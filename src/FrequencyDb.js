class FrequencyDb {
    constructor() {
        this.store = 'dictionary';

        this.name = 'frequency';
        this.version = 1;
    }

    async open() {
        this.db = new Dexie(this.name);
        this.db.version(1).stores({
            'dictionary': '++,expression, frequency'
        });

        return this.db.open();
    }

    async close() {
        if (!this.db) return;
        return this.db.close();
    }

    async findFrequencyForExpression(expression) {
        const results = await this.db.dictionary.where('expression').equals(expression).toArray();
        return results.map(result => result.frequency);
    }

    async findByIndex(index, value)
    {
        return this.db.transaction(this.store).objectStore(this.store).index(index).getAll(value);
    }

    async deleteDatabase() {
        this.db.delete();
    }

    async importFromFile(file, progressCallback) {
        return FileReader.readJson(file).then(entries => {
            return this.import(entries, progressCallback);
        });
    }

    async import(entries, progressCallback) {
        const entryTotal = entries.length;
        let currentProcessed = 0;
        if (typeof progressCallback === 'function') {
            this.db.dictionary.hook('creating', () => {
                currentProcessed++;

                progressCallback(currentProcessed, entryTotal);
            });
        }

        return this.db.dictionary.bulkAdd(entries);
    }

    removeHook() {
        this.db.dictionary.removeHook();
    }
}
