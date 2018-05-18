class AnkiImport {
    constructor() {
        this.ankiUrl = 'http://127.0.0.1:49601';
    }

    makeCall(action, params) {
        return fetch(this.ankiUrl, {
            method: 'POST',
            body: JSON.stringify({ action, params })
        });
    }

    async addNote(entryFormat, entry, config) {
        const promises = [];
        let audio = false;

        const fields = {};
        for(const key in config.ankiFields) {
            let newValue = null;
            switch(config.ankiFields[key]) {
                case 'audio':
                    audio = true;
                    newValue = `[sound:${entryFormat.audioFile}]`;
                    break;
                case 'dictionaryFormat':
                    newValue = entryFormat.dictionaryForm;
                    break;
                case 'word':
                    newValue = entryFormat.word;
                    break;
                case 'reading':
                    newValue = entryFormat.reading;
                    break;
                case 'saveNotes':
                    newValue = entryFormat.saveNotes;
                    break;
                case 'sentence':
                    newValue = entryFormat.sentence;
                    break;
                case 'sentenceWithBlank':
                    newValue = entryFormat.sentenceWithBlank;
                    break;
                case 'sourceUrl':
                    newValue = entryFormat.sourceUrl;
                    break;
                case 'pageTitle':
                    newValue = entryFormat.pageTitle;
                    break;
                case 'definition':
                    newValue = entryFormat.definition;
                    break;
                case 'frequency':
                    newValue = entryFormat.frequency;
                    break;
                case 'pitch':
                    newValue = entryFormat.pitch;
                    break;
            }

            if (newValue !== null) {
                fields[key] = newValue;
            }
        }

        const tags = config.ankiTags;
        promises.push(this.makeCall('addNote', { fields, tags }));

        const isNoAudio = await AudioPlayer.isNoAudio(entry);
        // If Audio
        if (audio && !isNoAudio) {
            promises.push(this.makeCall('downloadAudio', { filename: entryFormat.audioFile, url: entryFormat.audioUrl }));
        }

        return Promise.all(promises);
    }


    // entry          = Contains the work lookup info (kana, kanji, def)
    // word           = Highlighted Word
    // sentence       = The sentence containing the highlighted word
    // sentenceWBlank = Like sentence except the highlighted word is replaced with blanks
    // saveKana       = Replace kanji with kana (that is, $d=$r)
    // saveFormat     = Token-based save format
    makeTextOptions (entry, word, sentence, sentenceWithBlank, pageTitle, sourceUrl, saveKana, saveFormat, config)
    {
        let entryData;
        let b;
        let i, j, k;
        let t;

        if ((entry == null) || (entry.data == null))
        {
            return '';
        }

        // Example of what entry.data[0][0] looks like (linebreak added by me):
        //   乃 [の] /(prt,uk) indicates possessive/verb and adjective nominalizer (nominaliser)/substituting
        //   for "ga" in subordinate phrases/indicates a confident conclusion/emotional emphasis (sentence end) (fem)/(P)/

        // Extract needed data from the hilited entry
        //   entryData[0] = kanji/kana + kana + definition
        //   entryData[1] = kanji (or kana if no kanji)
        //   entryData[2] = kana (null if no kanji)
        //   entryData[3] = definition

        entryData = entry.data[0][0].match(/^(.+?)\s+(?:\[(.*?)\])?\s*\/(.+)\//);

        let dictionaryForm = entryData[1];
        let reading = entryData[2];

        // Does the user want to use the reading in place of kanji for the $d token?
        if(entryData[2] && saveKana)
        {
            dictionaryForm = entryData[2];
        }

        // Ensure that reading is never blank
        if(!reading)
        {
            reading = dictionaryForm;
        }

        const audioFile = reading + ' - ' + entryData[1] + '.mp3';

        let definition = "";

        if(config.epwingMode)
        {
            //@TODO: Add code for Epwing
        }
        else // Not EPWING mode
        {
            definition = entryData[3].replace(/\//g, "; ");

            // Remove word type indicators? [example: (v1,n)]
            if(!config.showWordTypeIndicator)
            {
                definition = definition.replace(/^\([^)]+\)\s*/, '');
            }

            // Remove popular indicator? [example: (P)]
            if(!config.showPopularWordIndicator)
            {
                definition = definition.replace('; (P)', '');
            }
        }

        // Get the page title
        pageTitle = pageTitle.replace(/ \- Mozilla Firefox$/, '');

        // Frequency
        // const frequency = rcxMain.getFreq(dictionaryForm, reading, true);
        const frequency = '';

        // Pitch accent
        // const pitch = rcxMain.getPitchAccent(dictionaryForm, reading);
        const pitch = '';

        const { saveNotes } = config;
        const audioUrl = AudioPlayer.getAudioUrl(entry);
        return { audioFile, audioUrl, dictionaryForm, word, reading, saveNotes, sentence, sentenceWithBlank, sourceUrl, pageTitle, definition, frequency, pitch };
    }
}

if (typeof process !== 'undefined') { module.exports = AnkiImport; }