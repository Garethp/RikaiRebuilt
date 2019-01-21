import IndexedDictionary from './database/IndexedDictionary';
import {deinflect, deinflectL10NKeys} from './deinflect';
import autobind from '../lib/autobind';
import FileReader from './FileReader';
import Utils from './Utils';
import {KanjiResult, SearchResults} from "./interfaces/SearchResults";
import {Config} from "./defaultConfig";
import {DictionaryWithDb, isForKanji, isForNames, isForWords} from "./interfaces/DictionaryDefinition";
import NameDictionary from "./database/NameDictionary";

export default class DictionaryLookup {
    private config: Config;
    private dictionaries: DictionaryWithDb[];
    private selectedDictionary: number = 0;
    private radData: any;
    private kanjiData: { [key: string]: string };

    constructor(config: Config) {
        autobind(this);
        this.config = config;
        this.dictionaries = [{
            name: 'Kanji',
            id: '',
            hasType: false,
            isNameDictionary: false,
            isKanjiDictionary: true,
            db: {
                open: async () => {},
                close: async () => {},
                getReadings: async () => [],
            }
        }];
    }

    selectNextDictionary(): void {
        this.selectedDictionary++;

        if (this.selectedDictionary >= this.dictionaries.length) {
            this.selectedDictionary = 0;
        }
    }

    async updateDictionaries(dictionaries) {
        for (const dictionary of this.dictionaries) {
            await dictionary.db.close();
        }

        this.dictionaries = [];
        for (const dictionary of dictionaries) {
            const copy = Object.assign({}, dictionary);

            if (dictionary.isNameDictionary === true) copy.db = new NameDictionary(copy.id);
            else copy.db = new IndexedDictionary(copy.id);
            copy.db.open();
            this.dictionaries.push(copy);
        }

        this.dictionaries.push({
            name: 'Kanji',
            id: '',
            hasType: false,
            isNameDictionary: false,
            isKanjiDictionary: true,
            db: {
                open: async () => {},
                close: async () => {},
                getReadings: async (reading?: string) => [],
            }
        });

        this.selectedDictionary = 0;
    }

    updateConfig(config: Config) {
        this.config = config;
    }

    async getReadingCount(reading: string): Promise<number> {
        const dictionary = this.dictionaries[this.selectedDictionary].db;
        const readingsList = await dictionary.getReadings(reading);
        return readingsList.length;
    }

    async search(word: string, noKanji: boolean = false): Promise<SearchResults> {
        if (this.dictionaries.length === 0) return null;

        let dictionaryIndex = this.selectedDictionary;
        do {
            const dictionary = this.dictionaries[dictionaryIndex];

            if (!noKanji || !dictionary.isKanjiDictionary) {
                let entry;
                if (isForKanji(dictionary)) entry = this.kanjiSearch(word.charAt(0));
                else if (isForNames(dictionary)) entry = await dictionary.db.findNames(word, this.config.nameMax);
                else entry = this.wordSearch(word, dictionary, null);

                if (entry) {
                    if (dictionaryIndex !== 0) entry.title = dictionary.name;

                    return entry;
                }
            }

            dictionaryIndex++;
            if (dictionaryIndex >= this.dictionaries.length) {
                dictionaryIndex = 0;
            }

        } while (dictionaryIndex !== this.selectedDictionary);

        return null;
    }

    async wordSearch(word: string, dictionary: DictionaryWithDb, max?: number) {
        if (!isForWords(dictionary)) return;

        let { kana, trueLen } = Utils.convertKatakanaToHirigana(word);
        word = kana;

        let result: SearchResults = {data: [], names: false, kanji: false, title: null, more: false, matchLen: 0};
        let maxEntries;

        if (dictionary.isNameDictionary) {
            maxEntries = this.config.nameMax;
            result.names = true;
        } else {
            maxEntries = this.config.maxEntries;
        }

        if (max != null) maxEntries = max;

        let have = [];
        let count = 0;
        let maxLen = 0;

        while (word.length > 0) {
            let showInf = (count !== 0);
            let variants = dictionary.isNameDictionary ? [{word: word, type: 0xFF, reasons: []}] : deinflect(word);
            for (let i = 0; i < variants.length; i++) {
                let variant = variants[i];
                let entries = await dictionary.db.findWord(variant.word);
                for (const entry of entries) {
                    if (have[entry]) continue;

                    let ok = true;

                    //The first candidate is always just the full string, so we'll skip it. Anything after the first variant
                    //is a deinflected word
                    if (dictionary.hasType && i > 0) {
                        let gloss = entry.split(/[,()]/);
                        let z;
                        for (z = gloss.length - 1; z >= 0; --z) {
                            let g = gloss[z];
                            if ((variant.type & 1) && (g === 'v1')) break;
                            if ((variant.type & 4) && (g === 'adj-i')) break;
                            if (variant.type & 66) {
                                if ((g === 'v5k-s') || (g === 'v5u-s')) {
                                    if (variant.type & 64) break;
                                }
                                else if (g.substr(0, 2) === 'v5') {
                                    if (variant.type & 2) break;
                                }
                            }
                            if ((variant.type & 8) && (g === 'vk')) break;
                            if ((variant.type & 16) && (g.substr(0, 3) === 'vs-')) break;
                        }
                        ok = (z !== -1);
                    }
                    if (ok && dictionary.hasType && this.config.hideXRatedEntries) {
                        if (entry.match(/\/\([^\)]*\bX\b.*?\)/)) ok = false;
                    }

                    if (ok) {
                        if (count >= maxEntries) {
                            result.more = true;
                            break;
                        }

                        have[entry] = 1;
                        ++count;
                        if (maxLen === 0) maxLen = trueLen[word.length];

                        let conjugationReason = null;

                        if (variant.reasons.length) {
                            let reason = deinflectL10NKeys[variant.reasons[0][0]];
                            if (showInf) conjugationReason = '&lt; ' + reason + ' &lt; ' + word;
                            else conjugationReason = '&lt; ' + reason;
                        }
                        result.data.push([entry, conjugationReason]);
                    }
                }	// for j < entries.length
                if (count >= maxEntries) break;
            }	// for i < variants.length
            if (count >= maxEntries) break;
            word = word.substr(0, word.length - 1);
        }	// while word.length > 0

        if (result.data.length === 0) return null;

        result.matchLen = maxLen;
        return result;
    }

    async kanjiSearch(character): Promise<KanjiResult> {
        const hex = '0123456789ABCDEF';
        let result;

        let i = character.charCodeAt(0);
        if (i < 0x3000) return null;

        if (!this.kanjiData) {
            this.kanjiData = await FileReader.read('resources/kanji.dat')
                .then(response => response.text())
                .then(data => data.split('\n').filter(line => line.length !== 0))
                .then(array => array.reduce((obj, current) => {
                    obj[current.charAt(0)] = current;
                    return obj;
                }, {}));
        }

        if (!this.radData) this.radData = await FileReader.read('resources/radicals.dat')
            .then(response => response.text())
            .then(text => text.split('\n'))
            .then(array => array.filter(line => line.length !== 0));

        const kanjiDataEntry = this.kanjiData[character];
        if (!kanjiDataEntry) return null;

        const kanjiData = kanjiDataEntry.split('|');
        if (kanjiData.length !== 6) return null;

        let [ kanji, miscString, onkun, nanori, bushumei, eigo ] = kanjiData;
        [ onkun, nanori, bushumei ] = [onkun, nanori, bushumei].map(
            (input: string) => input.replace(/\s+/g, '\u3001 ')
        );

        result = { kanji, onkun, nanori, bushumei, eigo };
        result.kanji = kanji;

        result.misc = {};
        result.misc['U'] = hex[(i >>> 12) & 15] + hex[(i >>> 8) & 15] + hex[(i >>> 4) & 15] + hex[i & 15];

        let b = miscString.split(' ');
        for (i = 0; i < b.length; ++i) {
            if (b[i].match(/^([A-Z]+)(.*)/)) {
                if (!result.misc[RegExp.$1]) result.misc[RegExp.$1] = RegExp.$2;
                else result.misc[RegExp.$1] += ' ' + RegExp.$2;
            }
        }

        result.radicalNumber = result.misc['B'];
        result.radical = this.radData[result.radicalNumber - 1];
        result.radicals = this.radData.filter((line, index) => index !== result.radicalNumber - 1 && line.indexOf(character) !== -1);

        return result;
    }
}

