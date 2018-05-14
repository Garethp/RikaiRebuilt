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

    addNote(entry, config) {
        const promises = [];
        let audio = false;

        for(const key in config.ankiFields) {
            switch(config.ankiFields[key]) {
                case 'Audio':
                    audio = true;
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
}

if (typeof process !== 'undefined') { module.exports = AnkiImport; }