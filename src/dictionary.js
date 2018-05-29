class IndexedDictionary {
    constructor(name) {
        this.name = name;
        this.store = 'dictionary';

        this.version = 1;
    }

    async open() {
        this.db = new Dexie(this.name);
        this.db.version(1).stores({
            'dictionary': '++,kanji, kana, entry'
        });

        return this.db.open();
    }

    async close() {
        if (!this.db) return;
        return this.db.close();
    }

    async deleteDatabase() {
        this.db.delete();
    }

    async importFromFile(file, progressCallback) {
        return FileReader.readJson(file).then(entries => {
            return this.import(entries.entries, progressCallback);
        });
    }

    async import(entries, progressCallback) {
        const entryTotal = entries.length;

        let hook = function () { };

        let currentProcessed = 0;
        if (typeof progressCallback === 'function') {
            hook = () => {
                currentProcessed++;

                progressCallback(currentProcessed, entryTotal);
            };
        }

        return this.db.dictionary.bulkAdd(entries, null, hook);
    }


    removeHook() {
        // this.db.dictionary.removeHook();
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

class IndexedDictionaryOld {
    constructor(name) {
        this.store = 'dictionary';

        this.name = name;
        this.version = 2;
    }

    async open() {
        this.db = await idb.open(this.name, this.version, upgradeDb => {
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
        if (!this.db) return;
        return this.db.close();
    }

    async findWord(word) {
        word = await this.findByIndex('both', word);
        return word.map(entry => {
            if (entry.entry[entry.entry.length - 1] === '/') return entry.entry;
            return ((entry.kanji ? (`${entry.kanji} [${entry.kana}]`) : entry.kana) + ` /${entry.entry}/`);
        });
    }

    async getReadings(reading) {
        const results = await this.findByIndex('kana', reading);
        return results.map(entry => {
            if (entry.entry[entry.entry.length - 1] === '/') return entry.entry;
            return ((entry.kanji ? (`${entry.kanji} [${entry.kana}]`) : entry.kana) + ` /${entry.entry}/`);
        });
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
        transaction.objectStore('dictionary').add({kanji, kana, entry, combined: [kanji, kana]});
        return transaction.complete;
    }

    async addMultiple(entries, progressCallback) {
        return new Promise((resolve, reject) => {
            const openRequest = window.indexedDB.open(this.name, this.version);

            openRequest.onerror = reject;
            openRequest.onsuccess = () => {
                const db = openRequest.result;
                db.onerror = reject;

                const transaction = db.transaction(this.store, 'readwrite');
                const itemStore = transaction.objectStore(this.store);
                const length = entries.length;
                let i = 0;
                const addNext = async () => {
                    if (i === length || entries[i] === null) return resolve();

                    const {kanji, kana, entry} = entries[i];
                    const addRequest = itemStore.add({kanji, kana, entry, combined: [kanji, kana]});
                    addRequest.onsuccess = addNext;
                    addRequest.onerror = reject;

                    i++;
                    progressCallback(i, length)
                };

                return addNext();
            };
        });
    }

    async deleteDatabase() {
        return idb.delete(this.name);
    }

    async importFromFile(file, progressCallback) {
        return FileReader.readJson(file).then(dictionary => {
            const entries = dictionary.entries;
            return this.import(entries, progressCallback);
        });
    }

    async import(entries, progressCallback) {
        return this.addMultiple(entries, progressCallback);
    }

    async clear() {
        const transaction = this.db.transaction(this.store, 'readwrite');
        transaction.objectStore(this.store).clear();
        return transaction.complete;
    }
}
