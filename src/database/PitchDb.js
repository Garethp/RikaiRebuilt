class PitchDb extends RikaiDatabase {
    constructor() {
        super('pitch', '++, expression, reading, pitch');
    }

    async getPitchAccent(expression, reading) {
        let whereClause = {expression};
        if (typeof reading !== 'undefined') {
            whereClause.reading = reading;
        }

        const results = await this.db.dictionary.where(whereClause).toArray();
        return results.map(result => result.pitch);
    }
}
