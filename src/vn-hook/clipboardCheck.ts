import defaultConfig, {Config} from '../defaultConfig';

let timer = null;
let previousContent = ""
let config: Config = defaultConfig;

browser.storage.sync.get('config').then(({config: extensionConfig}: { config?: Config }) => {
    config = extensionConfig || defaultConfig;
    updateTimer(config.vnHookClipboardFrequency);
});

browser.storage.onChanged.addListener(({config: { newValue: extensionConfig }}: { config: { newValue: Config } }, areaName) => {
    if (areaName === 'local' || !extensionConfig) return;

    config = extensionConfig || defaultConfig;
    updateTimer(config.vnHookClipboardFrequency);
});

const checkClipboard = () => {
    // @ts-ignore
    navigator.clipboard.readText().then(content => {
        if (content.trim() !== previousContent.trim() && content !== "") {
            addItem(content.trim());
        }
    })
};

const updateTimer = (frequency: number) => {
    const stop = () => {
        clearInterval(timer.id)
        timer = null
    };

    const start = () => {
        const id = setInterval(checkClipboard, frequency)
        timer = {id, interval: frequency}
    };

    if (timer === null) {
        start()
    } else if (timer.interval !== frequency) {
        stop()
        start()
    }
};

const addItem = (text: string) => {
    previousContent = text.trim();
    const vnContent = document.getElementById('vn-content');

    const newItem = document.createElement('div');
    newItem.innerText = text;

    if (config.vnHookAppendToTop) {
        vnContent.prepend(newItem);
    } else {
        vnContent.appendChild(newItem);
    }
}

export default () => {
    updateTimer(defaultConfig.vnHookClipboardFrequency);
}

