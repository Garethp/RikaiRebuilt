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

    addNote(entryFormat, config) {
        const promises = [];
        let audio = false;

        for(const key in config.ankiFields) {
            let newValue = null;
            switch(config.ankiFields[key]) {
                case 'audio':
                    audio = true;
                    newValue = entryFormat.audioFile;
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
            }
        }

        promises.push(this.makeCall('addNote', { fields }));

        //If Audio
        if (audio) {
            promises.push(this.makeCall('downloadAudio', { filename, url }));
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

        if (!this.ready)
        {
            this.init();
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

        let translation = "";

        if(config.epwingMode)
        {
            //@TODO: Add code for Epwing
        }
        else // Not EPWING mode
        {
            translation = entryData[3].replace(/\//g, "; ");

            // Remove word type indicators? [example: (v1,n)]
            if(!rcxConfig.wpos)
            {
                translation = translation.replace(/^\([^)]+\)\s*/, '');
            }

            // Remove popular indicator? [example: (P)]
            if(!rcxConfig.wpop)
            {
                translation = translation.replace('; (P)', '');
            }
        }

        // Get the page title
        pageTitle = pageTitle.replace(/ \- Mozilla Firefox$/, '');

        // Frequency
        const frequency = rcxMain.getFreq(dictionaryForm, reading, true);

        // Pitch accent
        const pitch = rcxMain.getPitchAccent(dictionaryForm, reading);

        const { saveNotes } = config;
        return { audioFile, dictionaryForm, word, reading, saveNotes, sentence, sentenceWithBlank, sourceUrl, pageTitle, translation, frequency, pitch };
    }
}

if (typeof process !== 'undefined') { module.exports = AnkiImport; }