class FrequencyDb extends RikaiDatabase {
    constructor() {
        super('frequency', '++, expression, frequency');
    }

    async findFrequencyForExpression(expression) {
        const results = await this.db.dictionary.where('expression').equals(expression).toArray();
        return results.map(result => result.frequency);
    }
}
