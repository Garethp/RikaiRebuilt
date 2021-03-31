import AudioPlayer from "./AudioPlayer";
import {DictionaryResult, isDictionaryResult, SearchResults} from "./interfaces/SearchResults";
import {Config} from "./defaultConfig";
import {AnkiFields} from "./interfaces/AnkiFields";
import {RikaiController} from "./background";

export default class AnkiImport {
  private ankiUrl: string = "http://127.0.0.1:49601";
  private MOCK_CALL = false;

  async makeCall(action, params) {
    if (this.MOCK_CALL) {
      console.log(`POST ${this.ankiUrl}`);
      console.log({ action, params });
      return;
    }

    return fetch(this.ankiUrl, {
      method: "POST",
      body: JSON.stringify({ action, params }),
    });
  }

  async addNote(entryFormat: AnkiFields, entry: SearchResults, config: Config) {
    const promises = [];
    let audio = false;
    const isNoAudio = await AudioPlayer.isNoAudio(entry);

    const fields = {};
    for (const key in config.ankiFields) {
      let values = config.ankiFields[key].split(" ");
      let newValues = [];

      for (const valueKey in values) {
        let newValue = null;
        switch (values[valueKey]) {
          case "audio":
            if (isNoAudio && !config.importEmptyAudio) {
              newValue = null;
            } else {
              audio = true;
              newValue = `[sound:${entryFormat.audioFile}]`;
            }
            break;
          case "dictionaryFormat":
            newValue = entryFormat.dictionaryForm;
            break;
          case "word":
            newValue = entryFormat.word;
            break;
          case "reading":
            newValue = entryFormat.reading;
            break;
          case "saveNotes":
            newValue = entryFormat.saveNotes;
            break;
          case "sentence":
            newValue = entryFormat.sentence;
            break;
          case "sentenceWithBlank":
            newValue = entryFormat.sentenceWithBlank;
            break;
          case "sourceUrl":
            newValue = entryFormat.sourceUrl;
            break;
          case "pageTitle":
            newValue = entryFormat.pageTitle;
            break;
          case "definition":
            newValue = entryFormat.definition;
            break;
          case "frequency":
            newValue = entryFormat.frequency;
            break;
          case "pitch":
            newValue = entryFormat.pitch;
            break;
        }

        if (newValue !== null) {
          newValues.push(newValue);
        }
      }

      newValues = newValues.filter((value) => value !== null);
      if (newValues.length) {
        fields[key] = newValues.join(" ");
      }
    }

    const tags = config.ankiTags;
    promises.push(this.makeCall("addNote", { fields, tags }));

    // If Audio
    if (audio && !isNoAudio) {
      promises.push(
        this.makeCall("downloadAudio", {
          filename: entryFormat.audioFile,
          url: entryFormat.audioUrl,
        })
      );
    }

    return Promise.all(promises);
  }

  async downloadAudio(entry: SearchResults & { selected?: number }) {
    if (!isDictionaryResult(entry)) return;
    if (!entry?.data) return;
    if (await AudioPlayer.isNoAudio(entry)) return;

    const selected = entry.selected || 0;

    const audioUrl = AudioPlayer.getAudioUrl(entry);

    let [, dictionaryForm, reading] = entry.data[selected][0].match(
      /^(.+?)\s+(?:\[(.*?)\])?\s*\/(.+)\//
    );

    const audioFile = `${reading} - ${dictionaryForm}.mp3`;

    return this.makeCall("downloadAudio", {
      filename: audioFile,
      url: audioUrl,
    });
  }

  async bulkDownloadAudio (files: { reading: string; kanji: string }[]) {
    const downloadPromises = files.map((file):DictionaryResult => ({
      data: [[`${file.kanji} [${file.reading}] /something/`]],
      matchLen: 0,
      more: false,
      names: false,
      kanji :false
    })).filter(async (entry) => {
      const isEmpty = await AudioPlayer.isNoAudio(entry);
      if (isEmpty) return;

      const audioUrl = AudioPlayer.getAudioUrl(entry);
      let [, dictionaryForm, reading] = entry.data[0][0].match(
          /^(.+?)\s+(?:\[(.*?)\])?\s*\/(.+)\//
      );

      const audioFile = `${reading} - ${dictionaryForm}.mp3`;
      return this.makeCall("downloadAudio", {
        filename: audioFile,
        url: audioUrl,
      }).then(() => console.log('Downloaded audio'));
    });

    return Promise.all(downloadPromises).then(() => console.log('Downloaded all audio'));
  }

  // entry          = Contains the work lookup info (kana, kanji, def)
  // selected       = The index of the entry to look up
  // word           = Highlighted Word
  // sentence       = The sentence containing the highlighted word
  // sentenceWBlank = Like sentence except the highlighted word is replaced with blanks
  // saveKana       = Replace kanji with kana (that is, $d=$r)
  // saveFormat     = Token-based save format
  static async makeTextOptions(
    entry: SearchResults,
    selected: number,
    word: string,
    sentence: string,
    sentenceWithBlank: string,
    pageTitle: string,
    sourceUrl: string,
    saveKana: boolean,
    saveFormat,
    config: Config,
    rebuilt: RikaiController
  ): Promise<AnkiFields | null> {
    if (!isDictionaryResult(entry)) return;

    let entryData;

    if (entry == null || entry.data == null) {
      return null;
    }

    // Example of what entry.data[0][0] looks like (linebreak added by me):
    //   乃 [の] /(prt,uk) indicates possessive/verb and adjective nominalizer (nominaliser)/substituting
    //   for "ga" in subordinate phrases/indicates a confident conclusion/emotional emphasis (sentence end) (fem)/(P)/

    // Extract needed data from the hilited entry
    //   entryData[0] = kanji/kana + kana + definition
    //   entryData[1] = kanji (or kana if no kanji)
    //   entryData[2] = kana (null if no kanji)
    //   entryData[3] = definition

    entryData = entry.data[selected][0].match(
      /^(.+?)\s+(?:\[(.*?)\])?\s*\/(.+)\//
    );
    let [_, dictionaryForm, reading, definition] = entryData;

    // Does the user want to use the reading in place of kanji for the $d token?
    if (reading && saveKana) {
      dictionaryForm = reading;
    }

    // Ensure that reading is never blank
    if (!reading) {
      reading = dictionaryForm;
    }

    const audioFile = reading + " - " + entryData[1] + ".mp3";

    if (!config.epwingMode) {
      definition = entryData[3].replace(/\//g, "; ");

      // Remove word type indicators? [example: (v1,n)]
      if (!config.showWordTypeIndicator) {
        definition = definition.replace(/^\([^)]+\)\s*/, "");
      }

      // Remove popular indicator? [example: (P)]
      if (!config.showPopularWordIndicator) {
        definition = definition.replace("; (P)", "");
      }
    }

    // Get the page title
    pageTitle = pageTitle.replace(/ \- Mozilla Firefox$/, "");

    // Frequency
    // const frequency = rcxMain.getFreq(dictionaryForm, reading, true);
    const frequency = await rebuilt.getFrequency(
      dictionaryForm,
      reading,
      true,
      word
    );

    // Pitch accent
    // const pitch = rcxMain.getPitchAccent(dictionaryForm, reading);
    const pitch = await rebuilt.getPitch(dictionaryForm, reading);

    const saveNotes = null;
    const audioUrl = AudioPlayer.getAudioUrl(entry);
    return {
      audioFile,
      audioUrl,
      dictionaryForm,
      word,
      reading,
      saveNotes,
      sentence,
      sentenceWithBlank,
      sourceUrl,
      pageTitle,
      definition,
      frequency,
      pitch,
    };
  }
}
