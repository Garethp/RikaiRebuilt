export default class FileReader {
  static read(uri) {
    if (typeof browser !== "undefined" && uri.substr(0, 4) !== "http") {
      uri = browser.runtime.getURL(uri);
    }

    return fetch(uri);
  }

  static readJson(uri) {
    return this.read(uri).then((response) => response.json());
  }
}
