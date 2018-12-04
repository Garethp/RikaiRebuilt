import autobind from '../dist/autobind';
import deinflectText from './deinflectText';

export default class Deinflect {
    constructor() {
        autobind(this);

        this.ready = false;
    }

    init() {
        this.reasons = [];
        this.rules = [];

        let buffer = deinflectText.split('\n');
        let ruleGroup = [];
        ruleGroup.fromLen = -1;

        // i = 1: skip header
        for (let i = 1; i < buffer.length; ++i) {
            let line = buffer[i].split('\t');

            if (line.length === 1) {
                this.reasons.push(line[0]);
            }

            if (line.length === 4) {
                let rule = {from: line[0], to: line[1], type: line[2], reason: line[3]};
                if (ruleGroup.fromLen !== rule.from.length) {
                    ruleGroup = [];
                    ruleGroup.fromLen = rule.from.length;
                    this.rules.push(ruleGroup);
                }
                ruleGroup.push(rule);
            }
        }

        this.ready = true;
    }

    go(word) {
        if (!this.ready) this.init();

        let have = [];
        have[word] = 0;

        let r = [{word: word, type: 0xFF, reason: ''}];
        let i = 0;
        do {
            word = r[i].word;
            let wordLen = word.length;
            let type = r[i].type;

            for (let j = 0; j < this.rules.length; ++j) {
                let ruleGroup = this.rules[j];
                if (ruleGroup.fromLen <= wordLen) {
                    let end = word.substr(-ruleGroup.fromLen);
                    for (let k = 0; k < ruleGroup.length; ++k) {
                        const rule = ruleGroup[k];
                        if ((type & rule.type) && (end === rule.from)) {
                            let newWord = word.substr(0, word.length - rule.from.length) + rule.to;
                            if (newWord.length <= 1) continue;
                            let o = {};
                            if ((typeof(have[newWord])) !== 'undefined') {
                                o = r[have[newWord]];
                                o.type |= (rule.type >> 8);
                                continue;
                            }
                            have[newWord] = r.length;
                            if (r[i].reason.length) o.reason = this.reasons[rule.reason] + ' &lt; ' + r[i].reason;
                            else o.reason = this.reasons[rule.reason];
                            o.type = rule.type >> 8;
                            o.word = newWord;
                            r.push(o);
                        }
                    }
                }
            }
        } while (++i < r.length);

        return r;
    }
}

