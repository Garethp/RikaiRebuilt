async function buttonAction() {
    browser.tabs.executeScript({
        file: "src/index.js"
    });
}

browser.browserAction.onClicked.addListener(buttonAction);