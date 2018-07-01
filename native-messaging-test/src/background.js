/*
On startup, connect to the "ping_pong" app.
*/
// var port = browser.runtime.connectNative("ping_pong");
//
// /*
// Listen for messages from the app.
// */
// port.onMessage.addListener((response) => {
//   console.log("Received: " + response);
// });

/*
On a click on the browser action, send the app a message.
*/
browser.browserAction.onClicked.addListener(() => {
  console.log("Sending:  ping");
  const message = {
      'book_path': 'C:\\Users\\Gareth\\Downloads\\RUIGO\\',
      'options': {
      },
      'input': '別',
  };

    // let message = 'ping';

    // let message = "hi";

  browser.runtime.sendNativeMessage('ping_pong', message)
      .then((r) => {
        console.log(JSON.stringify(r));
      });
  // port.postMessage("ping");
});