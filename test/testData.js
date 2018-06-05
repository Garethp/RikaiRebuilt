require('../src/autobind');

require('../src/deinflect');
require('../src/IndexedDictionary');
const Data = require('../src/data.js');

const assert = require('assert');

describe('Data class', () => {
    const data = new Data();

    describe('convertKatakanaToHirigana', () => {
        it('should convert ガレト', () => {
            assert.equal('がれと', data.convertKatakanaToHiragana('ガレト'));
            assert.equal('といれ', data.convertKatakanaToHiragana('トイレ'));
        });
    });
});
