async function buttonAction() {
    // browser.tabs.executeScript({
    //     file: "src/index.js"
    // });

    const deinflect = new Deinflect();
    const text = "見ない";
    const deinflection = deinflect.go(text);

    console.log(deinflection);
}

// browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
//     console.log(message);
//     console.log(sender);
//
//     const { id } = message;
//
//     sendResponse({ response: 'My response', id });
// });

browser.browserAction.onClicked.addListener(buttonAction);

buttonAction();
// const dictionary = new Dictionary();
// dictionary.super();
