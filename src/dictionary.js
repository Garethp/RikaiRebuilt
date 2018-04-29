class Dictionary {
    constructor (name) {
        autobind(this);

        this.opened = false;
        this.kanji = {};
        this.name = name;
        this.dictionaryPath = '../resources/dictionaries/';

        this.isName = false;
        this.hasType = true;
    }

    async open () {
        if (this.opened) return;

        console.log('Opening');
        let entries = await FileReader.readCSv(this.dictionaryPath + this.name + '.csv');
        entries = entries.map(entry => {
            const kanji = entry.shift();
            const kana = entry.shift();
            const definition = entry.join(',');

            return [kanji, kana, definition];
        });

        for (const line of entries) {
            const [kanji, kana, entry] = line;
            if (typeof this.kanji[kanji] === 'undefined') { this.kanji[kanji] = []; }

            const item = {kanji, kana, entry};
            this.kanji[kanji].push({kanji, kana, entry});
        }

        console.log('Open');
        this.opened = true;
    }

    async close () {
        this.kanji = {};
        this.opened = false;
    }

    checkIndex (name) {

    }

    find (query, arg) {

    }

    async findWord (word) {
        await this.open();

        if (!this.kanji[word]) return [];

        return this.kanji[word].map(entry => {
            return ((entry.kanji ? (`${entry.kanji} [${entry.kana}]`) : entry.kana) + ` /${entry.entry}/`);
        });
    }

    findText (text) {

    }

    getReadings (reading) {

    }
};

if (typeof process !== 'undefined') { module.exports = Dictionary; }
