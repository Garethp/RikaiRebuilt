let config = defaultConfig;

class RikaiRebuilt {
    constructor() {
        autobind(this);

        this.enabled = false;
        this.isSetUp = false;
        this.data = null;
        this.config = defaultConfig;
    }

    setup() {
        if (this.isSetUp) return;

        this.isSetUp = true;
        this.data = new Data(this.config);
    }

    async enable() {
        this.setup();

        if (this.enabled === true) {
            return this.disable();
        }

        browser.storage.local.set({enabled: true});
        browser.storage.local.get('config').then(config => {
            if (!config.config) return;

            this.updateConfig(config.config);
        });

        browser.browserAction.setIcon({
            path: {
                48: 'icons/smile_star.png'
            }
        });

        this.enabled = true;
    }

    async disable() {
        browser.storage.local.set({enabled: false});

        browser.browserAction.setIcon({
            path: {
                48: 'icons/smile.png'
            }
        });

        this.enabled = false;
    }

    getData() {
        this.setup();

        return this.data;
    }

    async wordSearch(text) {
        return this.getData().wordSearch(text);
    }

    updateConfig(config) {
        this.config = config || defaultConfig;
        this.getData().updateConfig(config);
    }

    sendToAnki(content) {
        const {entry, word, sentence, sentenceWithBlank, pageTitle, sourceUrl} = content;
        const entryFormat = ankiImport.makeTextOptions(entry, word, sentence, sentenceWithBlank, pageTitle, sourceUrl, false, false, this.config);
        ankiImport.addNote(entryFormat, entry, this.config);
        playAudio([entry]);
    }
}


const rebuilt = new RikaiRebuilt();

function playAudio(lastFound) {
    if (!lastFound || lastFound.length === 0) return;

    const entry = lastFound[0];

    AudioPlayer.play(entry);
}

const ankiImport = new AnkiImport();

browser.runtime.onMessage.addListener(async (message, sender) => {
    const {type, content} = message;

    switch (type) {
        case "wordSearch":
            return rebuilt.wordSearch(content).then(response => {
                return {response};
            }, f => console.log(f));
        case "unload":
            rebuilt.unloadTab(sender.tab.id);
            return {response: ''};
        case "playAudio":
            playAudio(content);
            return {response: ''};
        case "sendToAnki":
            rebuilt.sendToAnki(content);
            return 0;
        case 'selectNextDictionary':
            rebuilt.getData().selectNextDictionary();
            return {response: null};
        case "importDictionary":
            const {name, id, entries} = content;
            const testDb = new IndexedDictionary(id);
            const startTime = new Date().getTime();
            let lastPercent = 0;
            let canSend = true;
            testDb.open().then(async () => {
                return testDb.import(entries, (item, total) => {
                    let percentage = Math.floor((item / total) * 100);
                    if (percentage > lastPercent && canSend) {
                        browser.tabs.sendMessage(sender.tab.id, {
                            type: 'DICTIONARY_IMPORT_UPDATE',
                            content: {id, item, total}
                        }).then(() => {
                        }, rejected => {
                            console.log(rejected);
                            canSend = false;
                        });

                        lastPercent = percentage;
                    }
                });
            }, f => console.log(f)).then(async () => {
                const diff = new Date().getTime() - startTime;
                if (canSend) {
                    browser.tabs.sendMessage(sender.tab.id, {type: 'DICTIONARY_IMPORT_COMPLETE', content: {id}});
                } else {
                    config.installedDictionaries.push({name, id});
                    browser.storage.local.set({config})
                }
            }, f => console.log(f));
            return {response: ''};
        case "deleteDictionary":
            const dictionary = new IndexedDictionary(content.id);
            dictionary.open().then(async () => {
                dictionary.deleteDatabase();
            });
            return {response: ''};
    }
});

browser.browserAction.onClicked.addListener(rebuilt.enable);

browser.storage.onChanged.addListener((changes, areaName) => {
    if (areaName !== 'local') return;
    if (typeof changes.config === 'undefined') return;

    config = changes.config.newValue;

    rebuilt.updateConfig(config);
});

browser.storage.local.set({enabled: false});

browser.runtime.onInstalled.addListener(({id, previousVersion, reason}) => {
    browser.storage.local.get('config').then(({ config }) => {
        if (!config || !config.openChangelogOnUpdate) return;

        const optionsPageUrl = browser.extension.getURL('src/options/options.html');

        if (reason === 'update') {
            browser.tabs.create({url: `${optionsPageUrl}#changelog`});
        }
    });
});
