async function buttonAction() {
    browser.tabs.executeScript({
        file: "src/index.js"
    });
}

browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log(message);
    console.log(sender);

    const { id } = message;

    sendResponse({ response: 'My response', id });
});

browser.browserAction.onClicked.addListener(buttonAction);