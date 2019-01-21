import RikaiDatabase from './RikaiDatabase'

export interface Dictionary {
    open: () => Promise<any>;
    close: () => Promise<any>;
    getReadings: () => Promise<string[]>;
}

export default class IndexedDictionary extends RikaiDatabase {
    constructor(name) {
        super(name, '++, kanji, kana, entry');
    }

    async findWord(searchWord: string): Promise<string[]> {
        const word = await this.db.dictionary.where('kanji').equals(searchWord).or('kana').equals(searchWord).toArray();
        return word.map(entry => {
            if (entry.entry[entry.entry.length - 1] === '/') return entry.entry;
            return ((entry.kanji ? (`${entry.kanji} [${entry.kana}]`) : entry.kana) + ` /${entry.entry}/`);
        });
    }

    async getReadings(reading: string) {
        const results = await this.db.dictionary.where('kana').equals(reading).toArray();
        return results.map(entry => {
            if (entry.entry[entry.entry.length - 1] === '/') return entry.entry;
            return ((entry.kanji ? (`${entry.kanji} [${entry.kana}]`) : entry.kana) + ` /${entry.entry}/`);
        });
    }
}

