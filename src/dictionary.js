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
}

class IndexedDictionary {
    constructor(name) {
        this.store = 'dictionary';

        this.name = name;
    }

    async open() {
        this.db = await idb.open(this.name, 2, upgradeDb => {
            try {
                upgradeDb.deleteObjectStore(this.store);
            } catch (e) {}
            const store = upgradeDb.createObjectStore(this.store, {autoIncrement: true});

            store.createIndex('kanji', 'kanji');
            store.createIndex('kana', 'kana');
            store.createIndex('both', 'combined', {multiEntry: true});
        });
    }

    async close() {

    }

    async find(word) {
        return this.findByIndex('both', word)
    }

    async findByIndex(index, value)
    {
        return this.db.transaction(this.store).objectStore(this.store).index(index).getAll(value);
    }

    async findKanji(word) {
        return this.findByIndex('kanji', word);
    }

    async add(kanji, kana, entry) {
        let transaction = this.db.transaction('dictionary', 'readwrite');
        transaction.objectStore('dictionary').add({kanji, kana, entry, combined: [kanji, kana]}).then(() => {
            console.log('added');
        });
        return transaction.complete;
    }

    async addMultiple(entries) {
        const transaction = this.db.transaction(this.store, 'readwrite');
        const objectStore = transaction.objectStore(this.store);

        for (let e of entries) {
            const {kanji, kana, entry} = e;
            objectStore.add({ kanji, kana, entry, combined: [kanji, kana]}).then(() => {
                console.log('Add');
            })
        }

        return transaction.complete;
    }

    async deleteDatabase() {
        return idb.delete(this.name);
    }

    async importFromFile(file) {
        return FileReader.readJson(file).then(dictionary => {
            const entries = dictionary.entries;
            const addPromises = [];
            // console.log(entries);

            // let i =1;
            // for (const entry of entries) {
            //     addPromises.push(this.add(entry.kanji, entry.kana, entry.entry));
            //     i++;
            //     if (i == 5) break;
            // }
            //
            // return Promise.all(addPromises);

            return this.addMultiple(entries);
        });
    }

    async clear() {
        const transaction = this.db.transaction(this.store, 'readwrite');
        transaction.objectStore(this.store).clear();
        return transaction.complete;
    }
}

if (typeof process !== 'undefined') { module.exports = Dictionary; }
