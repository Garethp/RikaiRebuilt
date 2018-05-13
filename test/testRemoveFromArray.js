const removeFromArray = require('../src/removeFromArray');

const assert = require('assert');

describe('removeFromArray', () => {
    it('should remove single item from an array', () => {
        const array = [1, 2, 3];

        assert.equal(removeFromArray(array, 1).indexOf(1), -1);
    });

    it('should remove all values from array', () => {
        const array = [1, 1, 2, 3];

        assert.equal(removeFromArray(array, 1).indexOf(1), -1)
    });
});