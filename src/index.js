const autobind = (self, options) => {
    options = Object.assign({}, options);

    const filter = key => {
        const match = pattern => typeof pattern === 'string' ? key === pattern : pattern.test(key);

        if (options.include) {
            return options.include.some(match);
        }

        if (options.exclude) {
            return !options.exclude.some(match);
        }

        return true;
    };

    for (const key of Object.getOwnPropertyNames(self.constructor.prototype)) {
        const val = self[key];

        if (key !== 'constructor' && typeof val === 'function' && filter(key)) {
            self[key] = val.bind(self);
        }
    }

    return self;
};

class Rikai {

    constructor() {
        autobind(this);

        this.tabData = {};
        this.lastFound = [];
        this.inlineNames = {
            // text node
            '#text': true,

            // font style
            'FONT': true,
            'TT': true,
            'I': true,
            'B': true,
            'BIG': true,
            'SMALL': true,
            //deprecated
            'STRIKE': true,
            'S': true,
            'U': true,

            // phrase
            'EM': true,
            'STRONG': true,
            'DFN': true,
            'CODE': true,
            'SAMP': true,
            'KBD': true,
            'VAR': true,
            'CITE': true,
            'ABBR': true,
            'ACRONYM': true,

            // special, not included IMG, OBJECT, BR, SCRIPT, MAP, BDO
            'A': true,
            'Q': true,
            'SUB': true,
            'SUP': true,
            'SPAN': true,
            'WBR': true,

            // ruby
            'RUBY': true,
            'RBC': true,
            'RTC': true,
            'RB': true,
            'RT': true,
            'RP': true,

            // User configurable elements
            'DIV': false,
        };
        // this.wordData = new WordData();
    }

    async onMouseMove(event) {
        let {rangeParent, rangeOffset} = event;
        const tabData = this.tabData;

        if (event.target === tabData.previousTarget) {
            if (tabData.title) return;
            if (rangeParent === tabData.previousRangeParent && rangeOffset === tabData.previousRangeOffset) return;
        }

        if (event.explicitOriginalTarget.nodeType !== Node.TEXT_NODE && !('form' in event.target)) {
            rangeParent = null;
            rangeOffset = -1;
        }

        tabData.previousTarget = event.target;
        tabData.previousRangeParent = rangeParent;
        tabData.previousRangeOffset = rangeOffset;
        tabData.title = null;
        tabData.uofs = 0;

        this.uofsNext = 1;

        if (event.button !== 0) return;

        if (rangeParent && rangeParent.data && rangeOffset < rangeParent.data.length) {
            await this.show(tabData);
        }
    }

    async show(tabData) {
        let {previousRangeParent} = tabData;
        let previousRangeOffset = tabData.previousRangeOffset + tabData.uofs;
        let i, j;

        tabData.uofsNext = 1;

        if (!previousRangeParent) {
            this.clear();
            return 0;
        }

        if (previousRangeOffset < 0 || previousRangeOffset > previousRangeParent.data.length) {
            this.clear();
            return 0;
        }


        let charCode = previousRangeParent.data.charCodeAt(previousRangeOffset);
        if ((isNaN(charCode)) ||
            ((charCode !== 0x25CB) &&
                ((charCode < 0x3001) || (charCode > 0x30FF)) &&
                ((charCode < 0x3400) || (charCode > 0x9FFF)) &&
                ((charCode < 0xF900) || (charCode > 0xFAFF)) &&
                ((charCode < 0xFF10) || (charCode > 0xFF9D)))) {
            this.clear();
            return -2;
        }


        this.configureInlineNames();


        let selectionEndList = [];
        let text = this.getTextFomRange(previousRangeParent, previousRangeOffset, selectionEndList, 20);
        let sentence = this.getTextFomRange(previousRangeParent, 0, selectionEndList, previousRangeParent.data.length + 50);
        let previousSentence = this.getTextFromRangePrev(previousRangeParent, 0, selectionEndList, 50);

        sentence = previousSentence + sentence;


        // Get the position of the first selected character in the sentence variable
        i = previousRangeOffset + previousSentence.length;

        let sentenceStartPos;
        let sentenceEndPos;

        // Find the last character of the sentence
        while (i < sentence.length) {
            if (sentence[i] === "。" || sentence[i] === "\n" || sentence[i] === "？" || sentence[i] === "！") {
                sentenceEndPos = i;
                break;
            }
            else if (i === (sentence.length - 1)) {
                sentenceEndPos = i;
            }

            i++;
        }


        i = previousRangeOffset + previousSentence.length;

        // Find the first character of the sentence
        while (i >= 0) {
            if (sentence[i] === "。" || sentence[i] === "\n" || sentence[i] === "？" || sentence[i] === "！") {
                sentenceStartPos = i + 1;
                break;
            }
            else if (i === 0) {
                sentenceStartPos = i;
            }

            i--;
        }

        // Extract the sentence
        sentence = sentence.substring(sentenceStartPos, sentenceEndPos + 1);

        let startingWhitespaceMatch = sentence.match(/^\s+/);

        // Strip out control characters
        sentence = sentence.replace(/[\n\r\t]/g, '');

        let startOffset = 0;

        // Adjust offset of selected word according to the number of
        // whitespace chars at the beginning of the sentence
        if (startingWhitespaceMatch) {
            startOffset -= startingWhitespaceMatch[0].length;
        }

        // Trim
        sentence = this.trim(sentence);

        this.sentence = sentence;

        if (text.length === 0) {
            this.clear();
            return 0;
        }

        let e = await this.sendRequest('wordSearch', text);
        if (e === null) {
            this.clear();
            return 0;
        }

        this.lastFound = [e];

        this.word = text.substr(0, e.matchLen);

        const wordPositionInString = previousRangeOffset + previousSentence.length - sentenceStartPos + startOffset;
        let sentenceWithBlank = sentence.substr(0, wordPositionInString) + "___"
            + sentence.substr(wordPositionInString + e.matchLen, sentence.length);

        this.sentenceWithBlank = sentenceWithBlank;

        if (!e.matchLen) e.matchLen = 1;
        tabData.uofsNext = e.matchLen;
        tabData.uofs = previousRangeOffset - tabData.previousRangeOffset;

        // @TODO: Add config check for "shouldHighlight"
        const shouldHighlight = (!('form' in tabData.previousTarget));
        if (shouldHighlight) {
            let document = tabData.previousRangeParent.ownerDocument;
            if (!document) {
                this.clear();
                return 0;
            }

            this.highlightMatch(document, tabData.previousRangeParent, previousRangeOffset, e.matchLen, selectionEndList, tabData);
            tabData.prevSelView = document.defaultView;
        }

        // @TODO: Add audio playing
        // @TODO: Add checks for super sticky
        // @TODO: Add sanseido mode
        // @TODO: Add EPWING mode

        this.showPopup(this.getKnownWordIndicatorText() + rcxData.makeHtml(e), tabData.previousTarget, tabData.pos);
    }

    highlightMatch(document, rangeParent, rangeOffset, matchLen, selEndList, tabData) {
        if (selEndList.length === 0) return;

        let selEnd;
        let offset = matchLen + rangeOffset;
        // before the loop
        // |----!------------------------!!-------|
        // |(------)(---)(------)(---)(----------)|
        // offset: '!!' lies in the fifth node
        // rangeOffset: '!' lies in the first node
        // both are relative to the first node
        // after the loop
        // |---!!-------|
        // |(----------)|
        // we have found the node in which the offset lies and the offset
        // is now relative to this node
        for (let i = 0; i < selEndList.length; ++i) {
            selEnd = selEndList[i];
            if (offset <= selEnd.data.length) break;
            offset -= selEnd.data.length;
        }

        const range = document.createRange();
        range.setStart(rangeParent, rangeOffset);
        range.setEnd(selEnd, offset);

        const sel = document.defaultView.getSelection();
        if ((!sel.isCollapsed) && (tabData.selText !== sel.toString()))
            return;
        sel.removeAllRanges();
        sel.addRange(range);
        tabData.selText = sel.toString();
    }


    getKnownWordIndicatorText () {
        let outText = "";
        let expression = "";
        let reading = "";

        // Get the last highlighted word
        if (this.lastFound[0].data) {
            // Extract needed data from the hilited entry
            //   entryData[0] = kanji/kana + kana + definition
            //   entryData[1] = kanji (or kana if no kanji)
            //   entryData[2] = kana (null if no kanji)
            //   entryData[3] = definition

            const entryData = this.lastFound[0].data[0][0].match(/^(.+?)\s+(?:\[(.*?)\])?\s*\/(.+)\//);
            expression = entryData[1];

            if (entryData[2]) {
                reading = entryData[2];
            }
        }
        else {
            return "";
        }

        // Reload the known words associative array if needed
        if (!this.knownWordsDic || (this.prevKnownWordsFilePath !== rcxConfig.vocabknownwordslistfile)) {
            rcxMain.knownWordsDic = {};
            rcxMain.readWordList(rcxConfig.vocabknownwordslistfile, rcxMain.knownWordsDic, rcxConfig.vocabknownwordslistcolumn);
            this.prevKnownWordsFilePath = rcxConfig.vocabknownwordslistfile;
        }

        // Reload the to-do words associative array if needed
        if (!this.todoWordsDic || (this.prevTodoWordsFilePath != rcxConfig.vocabtodowordslistfile)) {
            rcxMain.todoWordsDic = {};
            rcxMain.readWordList(rcxConfig.vocabtodowordslistfile, rcxMain.todoWordsDic, rcxConfig.vocabtodowordslistcolumn);
            this.prevTodoWordsFilePath = rcxConfig.vocabtodowordslistfile;
        }

        //
        // First try the expression
        //

        if (this.knownWordsDic[expression]) {
            outText = "* ";
        }
        else if (this.todoWordsDic[expression]) {
            outText = "*t ";
        }

        //
        // If expression not found in either the known words or to-do lists, try the reading
        //

        if (outText.length == 0) {
            if (this.knownWordsDic[reading]) {
                outText = "*_r ";
            }
            else if (this.todoWordsDic[reading]) {
                outText = "*t_r ";
            }
        }

        return outText;

    }

    trim(text) {
        return text.replace(/^\s\s*/, "").replace(/\s\s*$/, "");
    }

    getTextFomRange(rangeParent, offset, selelectionEndList, maxLength) {
        if (rangeParent.ownerDocument.evaluate('boolean(parent::rp or ancestor::rt)',
            rangeParent, null, XPathResult.BOOLEAN_TYPE, null).booleanValue)
            return '';

        if (rangeParent.nodeType !== Node.TEXT_NODE)
            return '';

        let text = rangeParent.data.substr(offset, maxLength);
        selelectionEndList.push(rangeParent);

        let nextNode = rangeParent;
        while ((text.length < maxLength) &&
        ((nextNode = this.getNext(nextNode)) != null) &&
        (this.inlineNames[nextNode.nodeName])) {
            text += this.getInlineText(nextNode, selelectionEndList, maxLength - text.length);
        }

        return text;
    }

    getPrev(node) {
        do {
            if (node.previousSibling) {
                return node.previousSibling;
            }

            node = node.parentNode;
        }
        while ((node) && (this.inlineNames[node.nodeName]));

        return null;
    }

    getInlineText(node, selEndList, maxLength) {
        if ((node.nodeType === Node.TEXT_NODE) && (node.data.length === 0)) return '';

        let text = '';
        let result = node.ownerDocument.evaluate('descendant-or-self::text()[not(parent::rp) and not(ancestor::rt)]',
            node, null, XPathResult.ORDERED_NODE_ITERATOR_TYPE, null);
        while ((maxLength > 0) && (node = result.iterateNext())) {
            text += node.data.substr(0, maxLength);
            maxLength -= node.data.length;
            selEndList.push(node);
        }
        return text;
    }

    // Given a node which must not be null, returns either the next sibling or
    // the next sibling of the father or the next sibling of the fathers father
    // and so on or null
    getNext(node) {
        do {
            if (node.nextSibling) return node.nextSibling;
            node = node.parentNode;
        } while ((node) && (this.inlineNames[node.nodeName]));
        return null;
    }

    getTextFromRangePrev(rangeParent, offset, selEndList, maxLength) {
        if (rangeParent.ownerDocument.evaluate('boolean(parent::rp or ancestor::rt)',
            rangeParent, null, XPathResult.BOOLEAN_TYPE, null).booleanValue) {
            return '';
        }

        let text = '';
        let prevNode = rangeParent;

        while ((text.length < maxLength) &&
        ((prevNode = this.getPrev(prevNode)) != null) &&
        (this.inlineNames[prevNode.nodeName])) {
            let textTemp = text;
            text = this.getInlineTextPrev(prevNode, selEndList, maxLength - text.length) + textTemp;
        }

        return text;
    }

    getInlineTextPrev(node, selEndList, maxLength) {
        if ((node.nodeType === Node.TEXT_NODE) && (node.data.length === 0)) {
            return ''
        }

        let text = '';


        let result = node.ownerDocument.evaluate('descendant-or-self::text()[not(parent::rp) and not(ancestor::rt)]',
            node, null, XPathResult.ORDERED_NODE_ITERATOR_TYPE, null);

        while ((text.length < maxLength) && (node = result.iterateNext())) {
            if (text.length + node.data.length >= maxLength) {
                text += node.data.substr(node.data.length - (maxLength - text.length), maxLength - text.length);
            }
            else {
                text += node.data;
            }

            selEndList.push(node);
        }

        return text;
    }

    configureInlineNames() {

    }

    clear() {
        this.clearPopup();
        this.clearHighlight();
    }

    clearPopup() {
    }

    clearHighlight () {
        const tabData = this.tabData;
        if ((!tabData) || (!tabData.prevSelView)) return;
        if (tabData.prevSelView.closed) {
            tabData.prevSelView = null;
            return;
        }

        const selelection = tabData.prevSelView.getSelection();
        if ((selelection.isCollapsed) || (tabData.selText === selelection.toString())) {
            selelection.removeAllRanges();
        }
        tabData.prevSelView = null;
        tabData.kanjiChar = null;
        tabData.selText = null;
    }

    enable(document) {
        this.tabData = {};
        this.document = document;

        document.addEventListener('mousemove', this.onMouseMove);
    }

    initDictionary() {
        // this.wordData.init();
    }

    disable() {
        this.document.removeEventListener('mousemove', this.onMouseMove);
    }

    async sendRequest(type, content) {
        return browser.runtime.sendMessage({type, content}).then(response => {
            return response.response;
        });
    };
}

rikai = new Rikai();
rikai.enable(document);

browser.runtime.onMessage.addListener(message => {
    console.log(message);
    switch(message) {
        case 'DISABLE':
            return rikai.disable();
        case 'ENABLE':
            console.log('Enable Recieved');
            return rikai.enable(document);
    }
});