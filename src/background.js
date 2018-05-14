class RikaiRebuilt {
    constructor() {
        autobind(this);

        this.enabled = false;
        this.data = null;
        this.activeTabs = [];
        this.deactivatedTabs = [];
        this.currentTab = null;
    }

    enable() {
        if (this.enabled) return;

        this.enabled = true;
        this.data = new Data();
    }

    async enableForTab(tab) {
        this.enable();

        if (this.activeTabs.indexOf(tab.id) !== -1) {
            return this.disableTab(tab.id);
        }

        if (this.deactivatedTabs.indexOf(tab.id) !== -1) {
            return this.reEnableTab(tab.id);
        }

        await browser.tabs.executeScript({
            file: "src/index.js"
        });

        await browser.tabs.insertCSS({
            file: "styles/popup-blue.css"
        });

        this.activeTabs.push(tab.id);
        this.setTabIcon(tab.id);
    }

    async disableTab(tabId) {
        await browser.tabs.sendMessage(tabId, { type: 'DISABLE' });

        this.activeTabs = removeFromArray(this.activeTabs, tabId);
        this.deactivatedTabs.push(tabId);

        this.setTabIcon(tabId);
    }

    async unloadTab(tabId) {
        this.deactivatedTabs = removeFromArray(this.deactivatedTabs, tabId);
        this.activeTabs = removeFromArray(this.activeTabs, tabId);

        if (tabId === this.currentTab) {
            this.setTabIcon(tabId);
        }
    }

    async reEnableTab(tabId) {
        await browser.tabs.sendMessage(tabId, { type:  'ENABLE' });

        this.deactivatedTabs = removeFromArray(this.deactivatedTabs, tabId);

        this.activeTabs.push(tabId);
        this.setTabIcon(tabId);
    }

    getData() {
        this.enable();

        return this.data;
    }

    async wordSearch(text) {
        return this.getData().wordSearch(text);
    }

    handleTabActivated(tab) {
        this.setTabIcon(tab.tabId);

        this.currentTab = tab.tabId;
    }

    setTabIcon(tabId) {
        if (this.activeTabs.indexOf(tabId) === -1) {
            return browser.browserAction.setIcon({
                path: {
                    48: 'icons/smile.png'
                }
            })
        }

        browser.browserAction.setIcon({
            path: {
                48: 'icons/smile_star.png'
            }
        })
    }
}

const rebuilt = new RikaiRebuilt();

function playAudio(lastFound) {
    if (!lastFound || lastFound.length === 0) return;

    const entry = lastFound[0];

    let kanjiText;
    let kanaText;

    //We have a single kanji selected
    if (entry && entry.kanji && entry.onkun) {
        entry.onkun.match(/^([^\u3001]*)/);

        kanjiText = entry.kanji;
        kanaText = RegExp.$1;

        if (!kanjiText || !kanaText) return;

        kanaText = rebuilt.data.convertKatakanaToHiragana(kanaText);

        if (!kanaText) return;
    } else if (entry.data[0]) {
        let entryData =
            entry.data[0][0].match(/^(.+?)\s+(?:\[(.*?)\])?\s*\/(.+)\//);

        if (!entryData) return 0;

        // Get just the kanji and kana
        kanjiText = entryData[1];
        kanaText = entryData[2];

        if (!kanjiText) return 0;

        if (!kanaText) kanaText = kanjiText;
    } else {
        return 0;
    }

    const jdicAudioUrlText =
        "http://assets.languagepod101.com/dictionary/japanese/audiomp3.php?kana="
        + kanaText + "&kanji=" + kanjiText;

    const audio = new Audio();
    audio.src = jdicAudioUrlText;
    audio.play();
}

browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
    const {type, content} = message;

    switch (type) {
        case "wordSearch":
            return rebuilt.wordSearch(content).then(response => {
                return {response};
            });
        case "unload":
            rebuilt.unloadTab(sender.tab.id);
            return 0;
        case "playAudio":
            playAudio(content);
            return 0;
    }
});

const ankiImport = new AnkiImport();
browser.browserAction.onClicked.addListener(rebuilt.enableForTab);

browser.tabs.onActivated.addListener(rebuilt.handleTabActivated);