let config = defaultConfig;

class RikaiRebuilt {
    constructor() {
        autobind(this);

        this.enabled = false;
        this.data = null;
        this.activeTabs = [];
        this.deactivatedTabs = [];
        this.currentTab = null;
        this.config = defaultConfig;
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

        browser.storage.local.get('config').then(config => {
            if (!config.config) return;

            this.updateConfig(config.config);
        });

        await Promise.all([
            browser.tabs.executeScript({ file: "src/defaultConfig.js" }),
            browser.tabs.executeScript({ file: "dist/browser-polyfill.min.js" })
        ]);

        await Promise.all([
            browser.tabs.executeScript({ file: "src/index.js" }),
            browser.tabs.insertCSS({ file: "styles/popup-blue.css" }),
        ]);

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

    updateConfig(config) {
        this.config = config || defaultConfig;
    }

    sendToAnki(content) {
        const { entry, word, sentence, sentenceWithBlank, pageTitle, sourceUrl } = content;
        const entryFormat = ankiImport.makeTextOptions(entry, word, sentence, sentenceWithBlank, pageTitle, sourceUrl, false, false, this.config);
        ankiImport.addNote(entryFormat, this.config);
        playAudio([entry]);
    }
}


const rebuilt = new RikaiRebuilt();

function playAudio(lastFound) {
    if (!lastFound || lastFound.length === 0) return;

    const entry = lastFound[0];

    const audio = new Audio();
    audio.src = AudioPlayer.getAudioUrl(entry);
    audio.play();
}

const ankiImport = new AnkiImport();

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
        case "sendToAnki":
            rebuilt.sendToAnki(content);
            return 0;
    }
});

browser.browserAction.onClicked.addListener(rebuilt.enableForTab);

browser.tabs.onActivated.addListener(rebuilt.handleTabActivated);

browser.storage.onChanged.addListener((changes, areaName) => {
    if (areaName !== 'local') return;
    if (typeof changes.config === 'undefined') return;

    config = changes.config.newValue;

    rebuilt.updateConfig(config);
});

const testDb = new IndexedDictionary('test');
testDb.open()
.then(async () => {
    // await testDb.importFromFile('https://raw.githubusercontent.com/Garethp/RikaiRebuilt/master/resources/dictionaries/rikaichan.csv');
    let lastPercent = -1;
    let lastTime = new Date().getTime();
    await testDb.importFromFile('../resources/dictionaries/rikaichan.json', (item, total) => {
        const percent = Math.floor((item / total) * 100);

        if (percent > lastPercent) {
            let currentTime = new Date().getTime();
            const diffTime = currentTime - lastTime;
            console.log(`${percent}% of items have been processed, and the last percent took ${diffTime} milliseconds to add`);
            lastPercent = percent;
            lastTime = currentTime;
        }
    });
    console.log(await testDb.find('仝'));
}).then(async () => {
    await testDb.deleteDatabase();
});