class FileReader {
    static read(uri) {
        if (typeof browser !== 'undefined') {
            uri = browser.extension.getURL(uri);
        }

        return fetch(uri).then(response => {
            return response.text();
        })
    }

    static readCSv(uri) {
        return this.read(uri).then(text => {
            return text.split('\n').map(line => {
                return line.split(',');
            });
        });
    }
}

if (typeof process !== 'undefined') { module.exports = FileReader; }