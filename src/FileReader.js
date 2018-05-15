class FileReader {
    static read(uri) {
        if (typeof browser !== 'undefined') {
            uri = browser.extension.getURL(uri);
        }

        return fetch(uri);
    }

    static readJson(uri) {
        return this.read(uri).then(response => response.json())
    }

    static readCSv(uri) {
        return this.read(uri).then(response => response.text())
            .then(text => {
            return text.split('\n').map(line => {
                return line.split(',');
            });
        });
    }
}

if (typeof process !== 'undefined') { module.exports = FileReader; }