class RikaiRebuilt {
    constructor() {
        autobind(this);

        this.enabled = false;
        this.data = null;
        this.activeTabs = [];
        this.deactivatedTabs = [];
    }

    enable() {
        if (this.enabled) return;

        this.enabled = true;
        this.data = new Data();
    }

    async enableForTab(tab) {
        this.enable();

        if (this.activeTabs.indexOf(tab.id) !== -1) {
            return this.disableTab(tab);
        }

        if (this.deactivatedTabs.indexOf(tab.id) !== -1) {
            return this.reEnableTab(tab);
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

    async disableTab(tab) {
        await browser.tabs.sendMessage(tab.id, 'DISABLE');

        this.activeTabs = this.activeTabs.filter(tabId => {
            return tabId !== tab.id;
        });

        this.deactivatedTabs.push(tab.id);
        this.setTabIcon(tab.id);
    }

    async reEnableTab(tab) {
        await browser.tabs.sendMessage(tab.id, 'ENABLE');

        this.deactivatedTabs = this.deactivatedTabs.filter(tabId => {
            return tabId !== tab.id;
        });

        this.activeTabs.push(tab.id);
        this.setTabIcon(tab.id);
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

browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
    const {type, content} = message;

    switch (type) {
        case "wordSearch":
            return rebuilt.wordSearch(content).then(response => {
                return {response};
            });
    }
});

browser.browserAction.onClicked.addListener(rebuilt.enableForTab);
browser.tabs.onActivated.addListener(rebuilt.handleTabActivated);