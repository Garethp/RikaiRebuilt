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
  // const message = JSON.stringify({
  //     'message': 'ping',
  //     'requst': 'please say pong'
  // });

    let message = 'ping';

    // let message = "hi";

  browser.runtime.sendNativeMessage('ping_pong', message)
      .then((r) => {
        console.log(r.error);
      });
  // port.postMessage("ping");
});