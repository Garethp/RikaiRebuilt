import IndexedDictionary from './database/IndexedDictionary';
import { deinflect, deinflectL10NKeys } from './deinflect';
import autobind from '../lib/autobind';
import FileReader from './FileReader';

export default class Data {
    // katakana -> hiragana conversion tables

    constructor(config) {
        autobind(this);
        this.config = config;
        this.dictionaries = [];
        this.dictionaries = [{
            name: 'Kanji',
            id: '',
            hasType: false,
            isNameDictionary: false,
            isKanjiDictionary: true,
            db: {
                open: () => {},
                close: () => {},
            }
        }];

        this.ch = [0x3092, 0x3041, 0x3043, 0x3045, 0x3047, 0x3049, 0x3083, 0x3085, 0x3087, 0x3063, 0x30FC, 0x3042, 0x3044, 0x3046,
            0x3048, 0x304A, 0x304B, 0x304D, 0x304F, 0x3051, 0x3053, 0x3055, 0x3057, 0x3059, 0x305B, 0x305D, 0x305F, 0x3061,
            0x3064, 0x3066, 0x3068, 0x306A, 0x306B, 0x306C, 0x306D, 0x306E, 0x306F, 0x3072, 0x3075, 0x3078, 0x307B, 0x307E,
            0x307F, 0x3080, 0x3081, 0x3082, 0x3084, 0x3086, 0x3088, 0x3089, 0x308A, 0x308B, 0x308C, 0x308D, 0x308F, 0x3093];
        this.cv = [0x30F4, 0xFF74, 0xFF75, 0x304C, 0x304E, 0x3050, 0x3052, 0x3054, 0x3056, 0x3058, 0x305A, 0x305C, 0x305E, 0x3060,
            0x3062, 0x3065, 0x3067, 0x3069, 0xFF85, 0xFF86, 0xFF87, 0xFF88, 0xFF89, 0x3070, 0x3073, 0x3076, 0x3079, 0x307C];
        this.cs = [0x3071, 0x3074, 0x3077, 0x307A, 0x307D];

        this.selectedDictionary = 0;
    }

    selectNextDictionary() {
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
            copy.db = new IndexedDictionary(copy.id);
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
                open: () => {},
                close: () => {},
            }
        });

        this.selectedDictionary = 0;
    }

    updateConfig(config) {
        this.config = config;
    }

    async getReadingCount(reading) {
        const dictionary = this.dictionaries[this.selectedDictionary].db;
        const readingsList = await dictionary.getReadings(reading);
        return readingsList.length;
    }

    async wordSearch(word, noKanji) {
        if (this.dictionaries.length === 0) return null;

        let dictionaryIndex = this.selectedDictionary;
        do {
            const dictionary = this.dictionaries[dictionaryIndex];

            if (!noKanji || !dictionary.isKanjiDictionary) {
                let entry;
                if (dictionary.isKanjiDictionary) entry = this.kanjiSearch(word.charAt(0));
                else entry = this._wordSearch(word, dictionary, null);

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

    async _wordSearch(word, dictionary, max) {
        // half & full-width katakana to hiragana conversion
        // note: katakana vu is never converted to hiragana

        let trueLen = [0];
        let p = 0;
        let r = '';
        for (let i = 0; i < word.length; ++i) {
            let u = word.charCodeAt(i);
            let v = u;

            if (u <= 0x3000) break;

            // full-width katakana to hiragana
            if ((u >= 0x30A1) && (u <= 0x30F3)) {
                u -= 0x60;
            }
            // half-width katakana to hiragana
            else if ((u >= 0xFF66) && (u <= 0xFF9D)) {
                u = this.ch[u - 0xFF66];
            }
            // voiced (used in half-width katakana) to hiragana
            else if (u === 0xFF9E) {
                if ((p >= 0xFF73) && (p <= 0xFF8E)) {
                    r = r.substr(0, r.length - 1);
                    u = this.cv[p - 0xFF73];
                }
            }
            // semi-voiced (used in half-width katakana) to hiragana
            else if (u === 0xFF9F) {
                if ((p >= 0xFF8A) && (p <= 0xFF8E)) {
                    r = r.substr(0, r.length - 1);
                    u = this.cs[p - 0xFF8A];
                }
            }
            // ignore J~
            else if (u === 0xFF5E) {
                p = 0;
                continue;
            }

            r += String.fromCharCode(u);
            trueLen[r.length] = i + 1;	// need to keep real length because of the half-width semi/voiced conversion
            p = v;
        }
        word = r;

        let result = {data: []};
        let maxTrim;

        if (dictionary.isNameDictionary) {
            maxTrim = this.config.nameMax;
            result.names = 1;
        }
        else {
            maxTrim = this.config.maxEntries;
        }

        if (max != null) maxTrim = max;

        let have = [];
        let count = 0;
        let maxLen = 0;

        while (word.length > 0) {
            let showInf = (count !== 0);
            let variants = dictionary.isNameDictionary ? [{word: word, type: 0xFF, reasons: []}] : deinflect(word);
            for (let i = 0; i < variants.length; i++) {
                let variant = variants[i];
                let entries = await dictionary.db.findWord(variant.word);
                for (let j = 0; j < entries.length; ++j) {
                    let entry = entries[j];
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
                    if ((ok) && (dictionary.hasType) && (this.config.hideXRatedEntries)) {
                        if (entry.match(/\/\([^\)]*\bX\b.*?\)/)) ok = false;
                    }
                    if (ok) {
                        if (count >= maxTrim) {
                            result.more = 1;
                            break;
                        }

                        have[entry] = 1;
                        ++count;
                        if (maxLen === 0) maxLen = trueLen[word.length];

                        r = null;

                        if (variant.reasons.length) {
                            let reason = deinflectL10NKeys[variant.reasons[0]];
                            if (showInf) r = '&lt; ' + reason + ' &lt; ' + word;
                            else r = '&lt; ' + reason;
                        }
                        result.data.push([entry, r]);
                    }
                }	// for j < entries.length
                if (count >= maxTrim) break;
            }	// for i < variants.length
            if (count >= maxTrim) break;
            word = word.substr(0, word.length - 1);
        }	// while word.length > 0

        if (result.data.length === 0) return null;

        result.matchLen = maxLen;
        return result;
    }

    async kanjiSearch(character) {
        const hex = '0123456789ABCDEF';
        let kanjiDataEntry;
        let result;
        let a, b;
        let i;

        i = character.charCodeAt(0);
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

        kanjiDataEntry = this.kanjiData[character];
        if (!kanjiDataEntry) return null;

        a = kanjiDataEntry.split('|');
        if (a.length !== 6) return null;

        result = { };
        result.kanji = a[0];

        result.misc = {};
        result.misc['U'] = hex[(i >>> 12) & 15] + hex[(i >>> 8) & 15] + hex[(i >>> 4) & 15] + hex[i & 15];

        b = a[1].split(' ');
        for (i = 0; i < b.length; ++i) {
            if (b[i].match(/^([A-Z]+)(.*)/)) {
                if (!result.misc[RegExp.$1]) result.misc[RegExp.$1] = RegExp.$2;
                else result.misc[RegExp.$1] += ' ' + RegExp.$2;
            }
        }

        result.radicalNumber = result.misc['B'];
        result.radical = this.radData[result.radicalNumber - 1];
        result.radicals = this.radData.filter((line, index) => index !== result.radicalNumber - 1 && line.indexOf(character) !== -1);

        result.onkun = a[2].replace(/\s+/g, '\u3001 ');
        result.nanori = a[3].replace(/\s+/g, '\u3001 ');
        result.bushumei = a[4].replace(/\s+/g, '\u3001 ');
        result.eigo = a[5];

        return result;
    }
}

