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

    constructor(document) {
        autobind(this);

        this.document = document;
        this.tabData = {};
        this.lastFound = [];
        this.enabled = false;
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

        this.popupId = 'rikaichan-window';
        this.config = defaultConfig;
        this.keysDown = [];
    }

    async onMouseMove(event) {
        let {rangeParent, rangeOffset} = event;
        const tabData = this.tabData;

        if (event.buttons !== 0) return;

        let distance = null;
        if (tabData.pos) {
            const distanceX = tabData.pos.screenX - event.screenX;
            const distanceY = tabData.pos.screenY - event.screenY;
            distance = Math.sqrt((distanceX * distanceX) + (distanceY * distanceY));
        }

        if (event.target === tabData.previousTarget && distance && distance <= 4) {
            return;
        }

        tabData.previousTarget = event.target;
        tabData.pos = {screenX: event.screenX, screenY: event.screenY, pageX: event.pageX, pageY: event.pageY};

        //Not Firefox, need to query text in a different way
        //Firefox seems to have changed rangeParent. In the newer ones it's null for inputs, so we'll
        //always use Yomichan code
        if (rangeParent === undefined || true) {
            return setTimeout(() => {
                this.searchAt({x: event.clientX, y: event.clientY}, tabData, event);
            }, 1);
        }

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


        if (rangeParent && rangeParent.data && rangeOffset < rangeParent.data.length) {
            tabData.pos = {screenX: event.screenX, screenY: event.screenY, pageX: event.pageX, pageY: event.pageY};
            // await this.show(tabData);
        }

        if (tabData.pos) {
            const distanceX = tabData.pos.screenX - event.screenX;
            const distanceY = tabData.pos.screenY - event.screenY;
            const distance = Math.sqrt((distanceX * distanceX) + (distanceY * distanceY));

            if (distance > 4) {
                this.clear();
            }
        }
    }

    async searchAt(point, tabData, event) {
        const originalElement = document.elementFromPoint(point.x, point.y);
        const textSource = docRangeFromPoint(point);

        if (!textSource || !textSource.range || typeof textSource.range.startContainer.data === 'undefined') return;

        if (event.target === tabData.previousTarget && textSource.equals(tabData.previousTextSource)) {
            return;
        }

        let charCode = textSource.range.startContainer.data.charCodeAt(textSource.range.startOffset);
        if ((isNaN(charCode)) ||
            ((charCode !== 0x25CB) &&
                ((charCode < 0x3001) || (charCode > 0x30FF)) &&
                ((charCode < 0x3400) || (charCode > 0x9FFF)) &&
                ((charCode < 0xF900) || (charCode > 0xFAFF)) &&
                ((charCode < 0xFF10) || (charCode > 0xFF9D)))) {
            this.clear();
            return -2;
        }

        tabData.pos = {screenX: event.screenX, screenY: event.screenY, pageX: event.pageX, pageY: event.pageY};
        tabData.previousRangeOffset = textSource.range.startOffset;

        tabData.previousTarget = event.target;
        tabData.previousTextSource = textSource;

        let hideResults = !textSource || !textSource.containsPoint(point);
        const textClone = textSource.clone();
        const sentenceClone = textSource.clone();
        const previousSentenceClone = textSource.clone();

        textClone.setEndOffset(20);
        const text = textClone.text();

        sentenceClone.setEndOffsetFromBeginningOfCurrentNode(textSource.range.startContainer.data.length + 50);
        const sentence = sentenceClone.text();

        previousSentenceClone.setStartOffsetFromBeginningOfCurrentNode(50);
        const previousSentence = previousSentenceClone.text();

        this.showFromText(text, sentence, previousSentence, textSource.range.startOffset, textClone.range.startContainer, entry => {
            textClone.setEndOffset(this.word.length);

            const currentSelection = document.defaultView.getSelection();
            if (!currentSelection.isCollapsed && currentSelection.toString() !== tabData.selText) {
                return;
            }
            textClone.select();
            tabData.selText = textClone.text();
        }, tabData);
    };

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
        if (e === -1) {
            return 0;
        }
        if (e === null) {
            this.clear();
            return 0;
        }

        this.lastFound = [e];

        this.word = text.substr(0, e.matchLen);

        const wordPositionInString = previousRangeOffset + previousSentence.length - sentenceStartPos + startOffset;
        this.sentenceWithBlank = sentence.substr(0, wordPositionInString) + "___"
            + sentence.substr(wordPositionInString + e.matchLen, sentence.length);

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

        this.showPopup(this.getKnownWordIndicatorText() + this.makeHTML(e), tabData.previousTarget, tabData.pos);
    }

    getSentenceStuff(rangeOffset, sentence, previousSentence) {
        let i = rangeOffset + previousSentence.length;

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


        i = rangeOffset + previousSentence.length;

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

        return {sentence, sentenceStartPos, startOffset};
    }

    async showFromText(text, sentence, previousSentence, rangeOffset, rangeContainer, highlightFunction, tabData) {
        const sentenceStuff = this.getSentenceStuff(rangeOffset, sentence, previousSentence);

        let sentenceStartPos = sentenceStuff.sentenceStartPos;
        sentence = sentenceStuff.sentence;
        let startOffset = sentenceStuff.startOffset;

        this.sentence = sentence;

        if (text.length === 0) {
            this.clear();
            return 0;
        }

        let entry = await this.sendRequest('wordSearch', text);
        if (entry === -1) {
            return 0;
        }
        if (entry === null) {
            this.clear();
            return 0;
        }

        this.lastFound = [entry];

        this.word = text.substr(0, entry.matchLen);

        const wordPositionInString = rangeOffset + previousSentence.length - sentenceStartPos + startOffset;
        this.sentenceWithBlank = sentence.substr(0, wordPositionInString) + "___"
            + sentence.substr(wordPositionInString + entry.matchLen, sentence.length);

        if (!entry.matchLen) entry.matchLen = 1;
        tabData.uofsNext = entry.matchLen;
        tabData.uofs = rangeOffset - tabData.previousRangeOffset;

        // @TODO: Add config check for "shouldHighlight"
        // const shouldHighlight = (!('form' in tabData.previousTarget));
        const shouldHighlight = true;
        if (shouldHighlight) {
            if (typeof highlightFunction === 'undefined') {
                let document = rangeContainer.ownerDocument;
                if (!document) {
                    this.clear();
                    return 0;
                }

                this.highlightMatch(document, tabData.previousRangeParent, previousRangeOffset, entry.matchLen, selectionEndList, tabData);
                tabData.prevSelView = document.defaultView;
            } else {
                highlightFunction(entry);
            }
        }

        // @TODO: Add audio playing
        // @TODO: Add checks for super sticky
        // @TODO: Add sanseido mode
        // @TODO: Add EPWING mode

        this.showPopup(this.getKnownWordIndicatorText() + await this.makeHTML(entry), tabData.previousTarget, tabData.pos);
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


    getKnownWordIndicatorText() {
        return '';

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
        if (!this.todoWordsDic || (this.prevTodoWordsFilePath !== rcxConfig.vocabtodowordslistfile)) {
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

        if (outText.length === 0) {
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
        setTimeout(() => {
            docImposterDestroy();
        }, 500);
        this.clearPopup();
        this.clearHighlight();
    }

    clearPopup() {
        this.getPopup().style.display = 'none';
    }

    clearHighlight() {
        const tabData = this.tabData;

        const selection = document.defaultView.getSelection();
        if (!selection.isCollapsed && tabData.selText !== selection.toString()) {
            return;
        }

        if (tabData.previousTextSource) {
            tabData.previousTextSource.deselect();
            tabData.previousTextSource = null;
            return;
        }
    }

    enable() {
        if (this.enabled) return;

        this.tabData = {
            prevSelView: null
        };

        browser.storage.local.get('config').then(config => {
            this.config = config.config || defaultConfig;
            this.document.documentElement.removeChild(this.getPopup());
        });

        this.document.addEventListener('mousemove', this.onMouseMove);
        this.document.addEventListener('mousedown', this.onMouseDown);
        this.document.addEventListener('keydown', event => {
            const shouldStop = this.onKeyDown(event);
            if (shouldStop === true) {
                event.stopPropagation();
                event.preventDefault();
            }
        });
        this.document.addEventListener('keyup', this.onKeyUp);

        browser.storage.onChanged.addListener((changes, areaSet) => {
            if (areaSet !== 'local') return;
            if (typeof changes.config === 'undefined') return;

            this.config = changes.config.newValue || defaultConfig;
            this.document.documentElement.removeChild(this.getPopup());
        });

        this.createPopup();

        this.enabled = true;
    }

    onMouseDown(event) {
        // console.log(event);
        this.clearHighlight();
    }

    onKeyDown(event) {
        if ((event.altKey) || (event.metaKey) || (event.ctrlKey)) return;
        if ((event.shiftKey) && (event.keyCode != 16)) return;
        if (this.keysDown[event.keyCode]) return;
        if (!this.isVisible()) return;

        this.keysDown[event.keyCode] = 1;

        switch (event.keyCode) {
            case this.config.keymap.playAudio:
                return this.playAudio();
            case this.config.keymap.sendToAnki:
                return this.sendToAnki();
            case this.config.keymap.selectNextDictionary:
                this.sendRequest('selectNextDictionary');
                return;
        }

        return false;
    }

    onKeyUp(event) {
        if (this.keysDown[event.keyCode]) this.keysDown[event.keyCode] = 0;
    }

    disable() {
        this.document.removeEventListener('mousemove', this.onMouseMove);
        this.document.removeEventListener('mousedown', this.onMouseDown);
        this.document.removeEventListener('keydown', event => {
            const shouldStop = this.onKeyDown(event);
            if (shouldStop === true) {
                event.stopPropagation();
                event.preventDefault();
            }
        });

        this.document.removeEventListener('keyup', this.onKeyUp);

        if (this.hasPopup()) {
           this.document.documentElement.removeChild(this.getPopup());
        }

        this.enabled = false;
    }

    async sendRequest(type, content = '') {
        return browser.runtime.sendMessage({type, content}).then(response => {
            if (typeof response === 'undefined') {
                this.showPopup('If you have the options page for RikaiRebuilt, please close that. Word search' +
                    ' doesn\'t work properly when the options tab is open');
                return -1;
            }

            return response.response;
        });
    };

    createPopup() {
        if (this.hasPopup()) return;

        const popup = this.document.createElementNS('http://www.w3.org/1999/xhtml', 'div');
        popup.setAttribute('id', this.popupId);
        popup.setAttribute('style', 'display: none;');
        popup.setAttribute('class', `rikai-${this.config.theme}`);
        document.documentElement.appendChild(popup);
    }

    getPopup() {
        if (!this.hasPopup()) this.createPopup();

        return this.document.getElementById(this.popupId);
    }

    hasPopup() {
        return this.document.getElementById(this.popupId);
    }


    async makeHTML(entry) {
        let k;
        let e;
        let returnValue = [];
        let c, s, t;
        let i, j, n;

        if (entry == null) return '';

        // if (!this.ready) this.init();
        // if (!this.radData) this.radData = rcxFile.readArray('chrome://rikaichan/content/radicals.dat');

        if (entry.kanji) {
            let yomi;
            let box;
            let bn;
            let nums;

            yomi = entry.onkun.replace(/\.([^\u3001]+)/g, '<span class="k-yomi-hi">$1</span>');
            if (entry.nanori.length) {
                yomi += '<br/><span class="k-yomi-ti">\u540D\u4E57\u308A</span> ' + entry.nanori;
            }
            if (entry.bushumei.length) {
                yomi += '<br/><span class="k-yomi-ti">\u90E8\u9996\u540D</span> ' + entry.bushumei;
            }

            bn = entry.misc['B'] - 1;
            k = entry.misc['G'];
            switch (k) {
                case 8:
                    k = 'general<br/>use';
                    break;
                case 9:
                    k = 'name<br/>use';
                    break;
                default:
                    k = isNaN(k) ? '-' : ('grade<br/>' + k);
                    break;
            }
            box = '<table class="k-abox-tb"><tr>' +
                '<td class="k-abox-r">radical<br/>' + this.radData[bn].charAt(0) + ' ' + (bn + 1) + '</td>' +
                '<td class="k-abox-g">' + k + '</td>' +
                '</tr><tr>' +
                '<td class="k-abox-f">freq<br/>' + (entry.misc['F'] ? entry.misc['F'] : '-') + '</td>' +
                '<td class="k-abox-s">strokes<br/>' + entry.misc['S'] + '</td>' +
                '</tr></table>';
            if (this.kanjiShown['COMP']) {
                k = this.radData[bn].split('\t');
                box += '<table class="k-bbox-tb">' +
                    '<tr><td class="k-bbox-1a">' + k[0] + '</td>' +
                    '<td class="k-bbox-1b">' + k[2] + '</td>' +
                    '<td class="k-bbox-1b">' + k[3] + '</td></tr>';
                j = 1;
                for (i = 0; i < this.radData.length; ++i) {
                    s = this.radData[i];
                    if ((bn !== i) && (s.indexOf(entry.kanji) !== -1)) {
                        k = s.split('\t');
                        c = ' class="k-bbox-' + (j ^= 1);
                        box += '<tr><td' + c + 'a">' + k[0] + '</td>' +
                            '<td' + c + 'b">' + k[2] + '</td>' +
                            '<td' + c + 'b">' + k[3] + '</td></tr>';
                    }
                }
                box += '</table>';
            }

            nums = '';
            j = 0;

            for (i = 0; i < this.numList.length; i += 2) {
                c = this.numList[i];
                if (this.kanjiShown[c]) {
                    s = entry.misc[c]; // The number
                    c = ' class="k-mix-td' + (j ^= 1) + '"';

                    if (this.numList[i + 1] === "Heisig") {
                        const revTkLink = 'http://kanji.koohii.com/study/kanji/' + entry.kanji;
                        nums += '<tr><td' + c + '>' + '<a' + c + 'href="' + revTkLink + '">'
                            + this.numList[i + 1] + '</a>' + '</td><td' + c + '>' + '<a' + c + 'href="' + revTkLink + '">'
                            + (s ? s : '-') + '</a>' + '</td></tr>';
                    }
                    else {
                        nums += '<tr><td' + c + '>' + this.numList[i + 1] + '</td><td' + c + '>' + (s ? s : '-') + '</td></tr>';
                    }
                }
            }
            if (nums.length) nums = '<table class="k-mix-tb">' + nums + '</table>';

            returnValue.push('<table class="k-main-tb"><tr><td valign="top">');
            returnValue.push(box);
            returnValue.push('<span class="k-kanji">' + entry.kanji + '</span><br/>');
            if (!this.config.hideDefinitions) returnValue.push('<div class="k-eigo">' + entry.eigo + '</div>');
            returnValue.push('<div class="k-yomi">' + yomi + '</div>');
            returnValue.push('</td></tr><tr><td>' + nums + '</td></tr></table>');
            return returnValue.join('');
        }

        s = t = '';

        if (entry.names) {
            c = [];

            returnValue.push('<div class="w-title">Names Dictionary</div><table class="w-na-tb"><tr><td>');
            for (i = 0; i < entry.data.length; ++i) {
                e = entry.data[i][0].match(/^(.+?)\s+(?:\[(.*?)\])?\s*\/([\S\s]+)\//);
                if (!e) continue;

                if (s !== e[3]) {
                    c.push(t);
                    t = '';
                }

                if (e[2]) c.push('<span class="w-kanji">' + e[1] + '</span> &#32; <span class="w-kana">' + e[2] + '</span><br/> ');
                else c.push('<span class="w-kana">' + e[1] + '</span><br/> ');

                s = e[3];
                if (this.config.hideDefinitions) t = '';
                else t = '<span class="w-def">' + s.replace(/\//g, '; ').replace(/\n/g, '<br/>') + '</span><br/>';
            }
            c.push(t);
            if (c.length > 4) {
                n = (c.length >> 1) + 1;
                returnValue.push(c.slice(0, n + 1).join(''));

                t = c[n];
                c = c.slice(n, c.length);
                for (i = 0; i < c.length; ++i) {
                    if (c[i].indexOf('w-def') !== -1) {
                        if (t !== c[i]) returnValue.push(c[i]);
                        if (i === 0) c.shift();
                        break;
                    }
                }

                returnValue.push('</td><td>');
                returnValue.push(c.join(''));
            }
            else {
                returnValue.push(c.join(''));
            }
            if (entry.more) returnValue.push('...<br/>');
            returnValue.push('</td></tr></table>');

            return returnValue.join('');
        }
        if (entry.title) {
            returnValue.push('<div class="w-title">' + entry.title + '</div>');
        }

        let pK = '';

        for (i = 0; i < entry.data.length; ++i) {
            e = entry.data[i][0].match(/^(.+?)\s+(?:\[(.*?)\])?\s*\/([\S\s]+)\//);
            if (!e) continue;

            /*
      e[0] = kanji/kana + kana + definition
      e[1] = kanji (or kana if no kanji)
      e[2] = kana (null if no kanji)
      e[3] = definition
            */

            if (s !== e[3]) {
                returnValue.push(t);
                pK = k = '';
            }
            else {
                k = t.length ? '<br/>' : '';
            }

            if (e[2]) {
                if (pK === e[1]) k = '\u3001 <span class="w-kana">' + e[2] + '</span>';
                else k += '<span class="w-kanji">' + e[1] + '</span> &#32; <span class="w-kana">' + e[2] + '</span>';
                pK = e[1];
            }
            else {
                k += '<span class="w-kana">' + e[1] + '</span>';
                pK = '';
            }
            returnValue.push(k);

            //TODO: Add config usage here
            // Add pitch accent right after the reading
            // if (rcxConfig.showpitchaccent) {
            //     const pitchAccent = rcxMain.getPitchAccent(e[1], e[2]);
            //
            //     if (pitchAccent && (pitchAccent.length > 0)) {
            //         returnValue.push('<span class="w-conj"> ' + pitchAccent + '</span>');
            //     }
            // }

            if (entry.data[i][1]) returnValue.push(' <span class="w-conj">(' + entry.data[i][1] + ')</span>');

            // Add frequency
            if (this.config.showFrequency) {
                const freqExpression = e[1];
                let freqReading = e[2];

                if (freqReading === null) {
                    freqReading = freqExpression;
                }

                const freq = await this.getFrequency(freqExpression, freqReading, i === 0);

                if (freq && (freq.length > 0)) {
                    const frequencyClass = this.getFrequencyStyle(freq);
                    returnValue.push('<span class="' + frequencyClass + '"> ' + freq + '</span>');
                }
            }

            //TODO: Add config usage here
            s = e[3];
            if (this.config.hideDefinitions) {
                t = '<br/>';
            }
            else {
                t = s.replace(/\//g, '; ');
                //TODO: Add config here
                if (!this.config.showWordTypeIndicator) t = t.replace(/^\([^)]+\)\s*/, '');
                if (!this.config.showPopularWordIndicator) t = t.replace('; (P)', '');
                t = t.replace(/\n/g, '<br/>');
                t = '<br/><span class="w-def">' + t + '</span><br/>';
            }
        }
        returnValue.push(t);
        if (entry.more) returnValue.push('...<br/>');

        return returnValue.join('');
    }

    getFrequencyStyle(inFreqNum) {
        let freqNum = inFreqNum.replace(/_r/g, "");

        var freqStyle = 'w-freq-rare';

        if (freqNum <= 5000) {
            freqStyle = "w-freq-very-common";
        }
        else if (freqNum <= 10000) {
            freqStyle = "w-freq-common";
        }
        else if (freqNum <= 20000) {
            freqStyle = "w-freq-uncommon";
        }

        return freqStyle;
    }

    async getFrequency(inExpression, inReading, useHighlightedWord) {
        const highlightedWord = this.word;
        return this.sendRequest('getFrequency', {inExpression, inReading, useHighlightedWord, highlightedWord});
    }

    showPopup(textToShow, previousTarget, position) {
        let {pageX, pageY} = position || {pageX: 10, pageY: 10};
        const popup = this.getPopup();

        popup.innerHTML = textToShow;
        popup.style.display = 'block';
        popup.style.maxWidth = '600px';

        if (previousTarget && (typeof previousTarget !== 'undefined')
            && previousTarget.parentNode && (typeof previousTarget.parentNode !== 'undefined')) {

            let width = popup.offsetWidth;
            let height = popup.offsetHeight;

            popup.style.top = '-1000px';
            popup.style.left = '0px';
            popup.style.display = '';

            //TODO: Add alt-views here
            //TODO: Stuff for box object and zoom?
            //TODO: Check for Option Element? What?


            if (pageX + width > window.innerWidth - 20) {
                pageX = window.innerWidth - width - 20;
                if (pageX < 0) pageX = 0;
            }

            let v = 25;
            if (previousTarget.title && previousTarget.title !== '') v += 20;

            if (pageY + v + height > window.innerHeight) {
                let t = pageY - height - 30;
                if (t >= 0) pageY = t;
            } else {
                pageY += v;
            }
        }

        popup.style.left = pageX + 'px';
        popup.style.top = pageY + 'px';
    }

    sendToAnki() {
        const word = this.word;
        const sentence = this.sentence;
        const sentenceWithBlank = this.sentenceWithBlank;
        const entry = this.lastFound[0];
        const pageTitle = window.document.title;
        const sourceUrl = window.location.href;

        this.sendRequest('sendToAnki', {word, sentence, sentenceWithBlank, entry, pageTitle, sourceUrl});
        return true;
    }

    isVisible() {
        const popup = this.getPopup();
        return popup && popup.style.display !== 'none';
    }

    playAudio() {
        const {lastFound} = this;

        if (!lastFound || lastFound.length === 0) return false;

        this.sendRequest('playAudio', lastFound);
        return true;
    }
}

const rikai = new Rikai(document);
browser.storage.local.get('enabled').then(({enabled}) => {
    if (enabled) {
        rikai.enable();
    }
});

browser.storage.onChanged.addListener((change, storageArea) => {
    if (storageArea !== "local") return;
    if (typeof change.enabled === 'undefined') return;

    if (change.enabled.newValue === true) {
        rikai.enable();
    } else {
        rikai.disable();
    }
});
