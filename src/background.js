const data = new Data();

async function buttonAction() {
    browser.tabs.executeScript({
        file: "src/index.js"
    });
}

browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
    const {type, content} = message;

    console.log(type);
    switch (type) {
        case "wordSearch":
            return data.wordSearch(content).then(response => {
                return {response};
            });
    }
});

browser.browserAction.onClicked.addListener(buttonAction);
