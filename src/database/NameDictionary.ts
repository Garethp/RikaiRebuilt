import RikaiDatabase from "./RikaiDatabase";
import {DictionaryResult} from "../interfaces/SearchResults";
import Utils from "../Utils";

export default class NameDictionary extends RikaiDatabase {
    constructor(name) {
        super(name, '++, kanji, kana, entry');
    }

    private async find(name: string): Promise<string[]> {
        const word = await this.db.dictionary.where('kanji').equals(name).or('kana').equals(name).toArray();
        return word.map(entry => {
            if (entry.entry[entry.entry.length - 1] === '/') return entry.entry;
            return ((entry.kanji ? (`${entry.kanji} [${entry.kana}]`) : entry.kana) + ` /${entry.entry}/`);
        });
    }

    async findNames(name: string, maxEntries: number): Promise<DictionaryResult> {
        let { kana, trueLen } = Utils.convertKatakanaToHirigana(name);
        name = kana;

        let result: DictionaryResult = { data: [], names: true, kanji: false, title: null, more: false, matchLen: 0};

        let have = [];
        let count = 0;
        let maxLen = 0;

        while (name.length > 0) {
            let entries = await this.find(name);
            for (const entry of entries) {
                if (have[entry]) continue;

                if (count >= maxEntries) {
                    result.more = true;
                    break;
                }

                have[entry] = 1;
                count++;

                if (maxLen === 0) maxLen = trueLen[name.length];
                result.data.push([entry, null]);
            }

            if (count >= maxEntries) break;
            name = name.substr(0, name.length - 1);
        }

        if (result.data.length === 0) return null;

        result.matchLen = maxLen;
        return result;
    }

    async getReadings(reading: string) {
        const results = await this.db.dictionary.where('kana').equals(reading).toArray();
        return results.map(entry => {
            if (entry.entry[entry.entry.length - 1] === '/') return entry.entry;
            return ((entry.kanji ? (`${entry.kanji} [${entry.kana}]`) : entry.kana) + ` /${entry.entry}/`);
        });
    }
}

