import defaultConfig, {Config} from './defaultConfig'
import autobind from '../lib/autobind'
import AnkiImport from './AnkiImport';
import FrequencyDb from './database/FrequencyDb'
import PitchDb from './database/PitchDb';
import IndexedDictionary from './database/IndexedDictionary';
import DictionaryLookup from './DictionaryLookup';
import AudioPlayer from './AudioPlayer';
import {DictionaryDefinition} from "./interfaces/DictionaryDefinition";
import Utils from "./Utils";
import {installFrequencyDb, installPitchDb} from "./initializers";

let config = defaultConfig;
let installedDictionaries: DictionaryDefinition[] = [];
let optionsPort;

export class RikaiController {
    private enabled: boolean = false;
    private isSetUp: boolean = false;
    private DictionaryLookup: DictionaryLookup;
    private config: Config;

    constructor() {
        autobind(this);

        this.config = defaultConfig;
    }

    setup() {
        if (this.isSetUp) return;

        this.isSetUp = true;
        this.DictionaryLookup = new DictionaryLookup(this.config);
    }

    async enable() {
        this.setup();

        if (this.enabled === true) {
            return this.disable();
        }

        browser.storage.local.set({enabled: true});
        browser.storage.sync.get('config').then((storage: Storage & { config: Config }) => {
            if (!storage.config) return;
            const config: Config = storage.config;

            this.updateConfig(config);

            if (typeof config.startWithSanseido !== 'undefined') {
                browser.storage.local.set({sanseidoMode: config.startWithSanseido});
            }

            if (typeof config.startWithEpwing !== 'undefined') {
                browser.storage.local.set({epwingMode: config.startWithEpwing});
            }
        });

        browser.storage.local.get('installedDictionaries').then(config => {
            if (config.installedDictionaries) this.updateDictionaries(config.installedDictionaries);
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

    getDictionaryLookup() {
        this.setup();

        return this.DictionaryLookup;
    }

    async wordSearch(text) {
        return this.getDictionaryLookup().search(text);
    }

    async getReadingCount(reading) {
        return this.getDictionaryLookup().getReadingCount(reading);
    }

    updateConfig(config) {
        if (this.config.epwingMode !== undefined) {
            config.epwingMode = this.config.epwingMode;
        }
        this.config = config || defaultConfig;
        this.getDictionaryLookup().updateConfig(config);
    }

    updateDictionaries(dictionaries) {
        this.getDictionaryLookup().updateDictionaries(dictionaries);
    }

    setEpwingMode(epwingMode) {
        this.config.epwingMode = epwingMode;
    }

    async sendToAnki(content) {
        const {entry, word, sentence, sentenceWithBlank, pageTitle, sourceUrl} = content;
        const entryFormat = await AnkiImport.makeTextOptions(entry, word, sentence, sentenceWithBlank, pageTitle, sourceUrl, false, false, this.config, this);
        ankiImport.addNote(entryFormat, entry, this.config);
        playAudio([entry]);
    }

    async getFrequencyNumber(content) {
        return frequencyDb.findFrequencyForExpression(content).then(results => {
            return results[0];
        });
    }

    async getPitch(expression, reading) {
        return pitchDb.getPitchAccent(expression, reading).then(results => results[0]);
    }

    async getEpwingDefinition(expression) {
        if (!this.config.epwingDictionaries.length) {
            return 'No dictionaries found';
        }

        const message = {
            'book_path': this.config.epwingDictionaries[0].path,
            'options': {
                // 'gaiji': true,
                'hit-num': true,
                'html-sub': true,
                'html-sup': true,
                // 'no-header': true,
            },
            'input': expression,
        };

        return browser.runtime.sendNativeMessage('eplkup', message).then((result: { output: any, error?: string }) => {
            if (result.error) {
                return `A problem occurred: ${result.error}`;
            }

            return result.output;
        }, f => { return `A problem has occurred. Have you set up the Epwing program? ${f}`; });
    }

    async getFrequency(inExpression, inReading, useHighlightedWord, highlightedWord) {
        const expression = inExpression;
        const reading = inReading;

        let freqNum = "";
        let freqStr = "";
        let freqBasedOnReading = false;

        try {
            const readingFreqNum = await this.getFrequencyNumber(reading);
            let readingSameAsExpression = (expression === reading);
            let expressionFreqNum = readingFreqNum;

            // Don't waste time looking up the expression freq if expression is same as the reading
            if (!readingSameAsExpression) {
                expressionFreqNum = await this.getFrequencyNumber(expression);
            }

            // If frequency was found for either frequency or reading
            if ((expressionFreqNum.length > 0) || (readingFreqNum.length > 0)) {
                // If the highlighted word does not contain kanji, and the reading is unique,
                // use the reading frequency
                if (useHighlightedWord
                    && !readingSameAsExpression
                    && !Utils.containsKanji(highlightedWord)
                    && (readingFreqNum.length > 0)
                    && (await this.getReadingCount(reading) === 1)) {
                    freqNum = readingFreqNum;
                    freqBasedOnReading = true;
                }

                // If expression and reading are the same, use the reading frequency
                if ((freqNum.length == 0)
                    && readingSameAsExpression
                    && (readingFreqNum.length > 0)) {
                    freqNum = readingFreqNum;
                }

                // If the expression is in the freq db, use the expression frequency
                if ((freqNum.length == 0) && (expressionFreqNum.length > 0)) {
                    freqNum = expressionFreqNum;
                }

                // If the reading is in the freq db, use the the reading frequency
                if ((freqNum.length == 0) && (readingFreqNum.length > 0)) {
                    freqNum = readingFreqNum;
                    freqBasedOnReading = true;
                }
            }

            freqStr = freqNum;

            // Indicate that frequency was based on the reading
            if (freqBasedOnReading) {
                freqStr += "_r";
            }
        }
        catch (ex) {
            //@TODO: Throw an error here?
            // Components.utils.reportError("getFreq() Exception: " + ex);
            freqStr = "";
        }

        return freqStr;
    }
}

const ankiImport = new AnkiImport();
const frequencyDb = new FrequencyDb();
const pitchDb = new PitchDb();
frequencyDb.open();
pitchDb.open();

const controller = new RikaiController();

function playAudio(entry) {
    if (!entry) return;

    AudioPlayer.play(entry, config);
}

browser.runtime.onMessage.addListener(async (message) => {
    const {type, content} = message;

    switch (type) {
        case "wordSearch":
            return controller.wordSearch(content).then(response => {
                return {response};
            }, f => console.log(f));
        case "getEpwingDefinition":
            return controller.getEpwingDefinition(content).then(response => {
                return {response};
            }, f => { console.log(f) });
        case "getPitch":
            return controller.getPitch(content.expression, content.reading).then(response => {
                return {response}
            });
        case "getFrequency":
            return controller.getFrequency(content.inExpression, content.inReading, content.useHighlightedWord, content.highlightedWord)
                .then(response => {
                    return {response}
                });
        case "getReadingCount":
            return controller.getReadingCount(content).then(response => {
                return {response};
            });
        case "playAudio":
            playAudio(content);
            return {response: ''};
        case "sendToAnki":
            controller.sendToAnki(content);
            return 0;
        case 'selectNextDictionary':
            controller.getDictionaryLookup().selectNextDictionary();
            return {response: null};
    }
});

browser.runtime.onConnect.addListener(port => {
    optionsPort = port;

    optionsPort.onMessage.addListener(message => {
        const {type, content} = message;

        switch (type) {
            case "deleteDictionary":
                const dictionary = new IndexedDictionary(content.id);
                dictionary.open().then(async () => {
                    dictionary.deleteDatabase();
                });
                break;

            case "importDictionary":
                const {name, id, url} = content;
                const testDb = new IndexedDictionary(id);
                let hasType, isNameDictionary, isKanjiDictionary;

                testDb.open().then(async () => {
                    let startTime;
                    let lastPercent = 0;
                    const progressCallback = (item, total) => {
                        let percentage = Math.floor((item / total) * 100);
                        if (percentage > lastPercent) {
                            optionsPort.postMessage({
                                type: 'DICTIONARY_IMPORT_UPDATE',
                                content: {id, item, total}
                            });
                        }

                        lastPercent = percentage;
                    };

                    return fetch(url).then(response => response.json())
                        .then(json => {
                            hasType = json.hasType;
                            isKanjiDictionary = json.isKanjiDictionary;
                            isNameDictionary = json.isNameDictionary;

                            startTime = new Date().getTime();
                            return testDb.import(json.entries, progressCallback)
                        })
                        .then(() => {
                            const endTime = new Date().getTime();
                            console.log(`Download took ${(endTime - startTime) / 1000} seconds`);

                            installedDictionaries.push({id, name, hasType, isNameDictionary, isKanjiDictionary});
                            // @ts-ignore
                            browser.storage.local.set({installedDictionaries})
                        })
                });
        }
    });
});

browser.browserAction.onClicked.addListener(controller.enable);

browser.storage.onChanged.addListener((changes, areaName) => {
    if (areaName !== 'sync' && areaName !== 'local') return;

    if (changes.config) {
        config = changes.config.newValue;

        controller.updateConfig(config);
    } else if (changes.installedDictionaries) {
        installedDictionaries = changes.installedDictionaries.newValue;
        controller.updateDictionaries(installedDictionaries);
    } else if (changes.epwingMode) {
        controller.setEpwingMode(changes.epwingMode.newValue);
    }
});

browser.browserAction.setIcon({
    path: {
        48: 'icons/smile.png'
    }
});
browser.storage.local.set({enabled: false});
browser.storage.local.get('installedDictionaries').then((config: Storage & { installedDictionaries?: DictionaryDefinition[] }) => {
    if (config.installedDictionaries) {
        installedDictionaries = config.installedDictionaries;
    }
});

browser.runtime.onInstalled.addListener(async ({id, previousVersion, reason}) => {
    //Frequency Information
    installFrequencyDb(frequencyDb);

    //Import pitch DB on first install
    installPitchDb(pitchDb);

    browser.storage.sync.get('config').then(({config}: Storage & {config: Config}) => {
        if (!config) return;

        if (config.openChangelogOnUpdate) {
            const optionsPageUrl = browser.extension.getURL('options/options.html');

            if (reason === 'update') {
                browser.tabs.create({url: `${optionsPageUrl}#changelog`});
            }
        }

        let newConfigs = false;
        for (const key in defaultConfig) {
            if(typeof config[key] === 'undefined') {
                newConfigs = true;
                config[key] = defaultConfig[key];
            }
        }
        if (newConfigs) {
            // @ts-ignore
            browser.storage.sync.set({ config });
        }
    });
});

// @ts-ignore
browser.contextMenus.removeAll();
// @ts-ignore
browser.contextMenus.create({
    title: "Options",
    contexts: ["browser_action"],
    onclick: () => {
        browser.tabs.create({url: browser.extension.getURL('options/options.html')});
    }
});
