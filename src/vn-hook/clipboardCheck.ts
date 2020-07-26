import defaultConfig, {Config} from '../defaultConfig';

let timer = null;
let previousContent = ""
let config: Config = defaultConfig;

browser.storage.sync.get('config').then(({config: extensionConfig}: { config?: Config }) => {
    config = extensionConfig || defaultConfig;
    updateTimer(config.vnHookClipboardFrequency);
});

browser.storage.onChanged.addListener(({config: {newValue: extensionConfig}}: { config: { newValue: Config } }, areaName) => {
    if (areaName === 'local' || !extensionConfig) return;

    config = extensionConfig || defaultConfig;
    updateTimer(config.vnHookClipboardFrequency);
});

const shouldScroll = (): boolean => {
    if (!config.vnAutoScroll || config.vnHookAppendToTop) return false;

    const rikaiWindow = document.getElementById('rikaichan-window')

    if (rikaiWindow && rikaiWindow.style.display !== "none") return false;

    const LEEWAY = 170; // Amount of "leeway" pixels before latching onto the bottom.

    // Some obscene browser shit because making sense is for dweebs
    const offset = window.innerHeight + window.scrollY;
    const distanceFromBottom = document.body.offsetHeight - offset;

    return distanceFromBottom < LEEWAY;
}

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
    const checkShouldScroll = shouldScroll();

    previousContent = text.trim();
    const vnContent = document.getElementById('vn-content');

    const newItem = document.createElement('div');
    newItem.innerText = text;

    if (config.vnHookAppendToTop) {
        vnContent.prepend(newItem);
    } else {
        vnContent.appendChild(newItem);
    }

    if (checkShouldScroll) {
        window.scrollTo(0, document.body.scrollHeight);
    }
}

export default () => {
    updateTimer(defaultConfig.vnHookClipboardFrequency);

    $("#clear-page").on('click', () => {
        document.getElementById('vn-content').innerHTML = '';
    })
}

