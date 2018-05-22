class FrequencyDb {
    constructor() {
        this.store = 'dictionary';

        this.name = 'frequency';
        this.version = 1;
    }

    async open() {
        this.db = await idb.open(this.name, this.version, upgradeDb => {
            try {
                upgradeDb.deleteObjectStore(this.store);
            } catch (e) {}
            const store = upgradeDb.createObjectStore(this.store, {autoIncrement: true});

            store.createIndex('expression', 'expression');
        });
    }

    async close() {
        if (!this.db) return;
        return this.db.close();
    }

    async findFrequencyForExpression(expression) {
        const results = await this.findByIndex('expression', expression);
        return results.map(result => {
            return result.frequency;
        });
    }

    async findByIndex(index, value)
    {
        return this.db.transaction(this.store).objectStore(this.store).index(index).getAll(value);
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

                    const {expression, frequency} = entries[i];
                    const addRequest = itemStore.add({ expression, frequency });
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
        return FileReader.readJson(file).then(entries => {
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
