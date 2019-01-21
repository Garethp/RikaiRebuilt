import Dexie from '../../lib/dexie.min'
import FileReader from '../FileReader'

export type importProgressCallback = (processed, total) => void;
export default class RikaiDatabase {
    private name: string;
    private fields: string[];
    private version: number;
    protected db: Dexie;

    constructor(name, fields) {
        this.name = name;
        this.fields = fields;

        this.version = 1;
    }

    async open() {
        this.db = new Dexie(this.name);
        this.db.version(this.version).stores({
            'dictionary': this.fields
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

    async importFromFile(file: string, progressCallback?: importProgressCallback) {
        return FileReader.readJson(file)
            .then(entries => {
                if (!Array.isArray(entries)) entries = entries.entries;
                return this.import(entries, progressCallback);
            });
    }

    async import(entries, progressCallback?: importProgressCallback) {
        function chunkArray(myArray, chunk_size) {
            let index;
            const arrayLength = myArray.length;
            const tempArray = [];

            for (index = 0; index < arrayLength; index += chunk_size) {
                tempArray.push(myArray.slice(index, index + chunk_size));
            }

            return tempArray;
        }


        const entryTotal = entries.length;
        const batches = chunkArray(entries, 5000);

        let hook = function () { };

        let currentProcessed = 0;
        if (typeof progressCallback === 'function') {
            hook = () => {
                currentProcessed++;

                progressCallback(currentProcessed, entryTotal);
            };
        }

        const runBulkAdd = async (batchIndex) => {
            if (batchIndex >= batches.length) return;

            return this.db.dictionary.bulkAdd(batches[batchIndex], null, hook).then(() => {
                batches[batchIndex] = null;
                return batchIndex + 1;
            }).then(runBulkAdd);
        };

        return runBulkAdd(0);
    }
}
