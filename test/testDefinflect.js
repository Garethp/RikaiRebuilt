require('../src/deinflectText');
require('../src/auto-bind');

const assert = require('assert');
const Deinflect = require('../src/deinflect.js');

describe('Deinflect', () => {
    const deinflect = new Deinflect();

    describe('go', () => {
        it('should show the negative variant', () => {
            const expected = [
                {
                    "word": "見ない",
                    "type": 255,
                    "reason": ""
                },
                {
                    "reason": "negative",
                    "type": 9,
                    "word": "見る"
                },
                {
                    "reason": "masu stem",
                    "type": 1,
                    "word": "見ないる"
                },
                {
                    "reason": "masu stem",
                    "type": 66,
                    "word": "見なう"
                },
                {
                    "reason": "imperative",
                    "type": 8,
                    "word": "見なる"
                }
            ];
            const actual = deinflect.go('見ない');

            assert.deepEqual(actual, expected);
        })
    })
});