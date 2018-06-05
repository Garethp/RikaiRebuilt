class IndexedDictionary extends RikaiDatabase {
    constructor(name) {
        super(name, '++, kanji, kana, entry');
    }

    async findWord(word) {
        word = await this.db.dictionary.where('kanji').equals(word).or('kana').equals(word).toArray();
        return word.map(entry => {
            if (entry.entry[entry.entry.length - 1] === '/') return entry.entry;
            return ((entry.kanji ? (`${entry.kanji} [${entry.kana}]`) : entry.kana) + ` /${entry.entry}/`);
        });
    }

    async getReadings(reading) {
        const results = await this.db.dictionary.where('kana').equals(reading).toArray();
        return results.map(entry => {
            if (entry.entry[entry.entry.length - 1] === '/') return entry.entry;
            return ((entry.kanji ? (`${entry.kanji} [${entry.kana}]`) : entry.kana) + ` /${entry.entry}/`);
        });
    }
}

