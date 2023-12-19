// @ts-ignore
const browser = require("webextension-polyfill");

browser.runtime.onMessage.addListener((msg) => {
  if ("playAudio" in msg) playAudio(msg.playAudio);
});

// Play sound with access to DOM APIs
function playAudio({ source, volume }) {
  const audio = new Audio(source);
  audio.volume = volume;
  audio.play();
}
