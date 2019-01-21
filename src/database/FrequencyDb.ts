import RikaiDatabase from './RikaiDatabase'

export default class FrequencyDb extends RikaiDatabase {
    constructor() {
        super('frequency', '++, expression, frequency');
    }

    async findFrequencyForExpression(expression: string) {
        const results = await this.db.dictionary.where('expression').equals(expression).toArray();
        return results.map(result => result.frequency);
    }
}
