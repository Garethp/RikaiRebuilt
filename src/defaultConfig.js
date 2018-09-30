const defaultConfig = {
    startWithSanseido: false,
    startWithEpwing: false,

    keymap: {
        playAudio: 70,
        sendToAnki: 82,
        selectNextDictionary: 16,
        toggleSanseidoMode: 79,

        toggleEpwingMode: 80,
        epwingPreviousEntry: 219,
        epwingNextEntry: 221,
    },
    hideDefinitions: false, //hidedef
    hideXRatedEntries: false, //hidex
    nameMax: 20, //namax
    maxEntries: 10,
    ankiFields: {},
    showWordTypeIndicator: true, //wpos
    showPopularWordIndicator: true, //wpop
    ankiTags: '',
    importEmptyAudio: true,
    openChangelogOnUpdate: false,
    showFrequency: false,
    showPitchAccent: false, //showpitchaccent
    theme: 'blue',
    audioVolume: 100,

    //Definitions for what we can show in the Kanji Dictionary display
    showKanjiComponents: true, //kindex-COMP
    showKanjiHalpern: true, //kindex-H
    showKanjiHeisig: true, //kindex-L
    showKanjiHenshall: true, //kindex-E
    showKanjiLearnersDictionary: true, //kindex-DK
    showKanjiNelson: true, //kindex-N
    showKanjiNewNelson: true, //kindex-V
    showKanjiPinYin: true, //kindex-Y
    showKanjiSkipPattern: true, //kindex-P
    showKanjiTurtleAndKana: true, //kindex-IN
    showKanjiTurtleDictionary: true, //kindex-I
    showKanjiUnicode: true, //kindex-U

    //Epwing Options
    epwingDictionaryPath: '',

    installedDictionaries: [
    ],
    recommendedDictionaries: [
        {
            name: 'Japanese to English Dictionary',
            id: 'e82ffa3b-1cd4-4749-b5bf-9a6f64e6890a',
            hasType: true,
            isNameDictionary: false,
            isKanjiDictionary: false,
            url: 'https://raw.githubusercontent.com/Garethp/RikaiRebuilt-dictionaries/master/english.json'
        },
        {
            name: 'Japanese Names',
            id: '359fe507-7235-4040-8f7b-c5af90e9897d',
            hasType: false,
            isNameDictionary: true,
            isKanjiDictionary: false,
            url: 'https://raw.githubusercontent.com/Garethp/RikaiRebuilt-dictionaries/master/names.json'
            // url: '../../names.json'
        },
        {
            name: 'Japanese to Dutch Dictionary',
            id: 'a544e3ba-51cc-4574-aed5-54e195557e17',
            hasType: true,
            isNameDictionary: false,
            isKanjiDictionary: false,
            url: 'https://raw.githubusercontent.com/Garethp/RikaiRebuilt-dictionaries/master/dutch.json'
            // url: '../../dutch.json'
        },
        {
            name: 'Japanese to French Dictionary',
            id: 'eb8e4ac0-9086-4710-b121-05f2acef5664',
            hasType: true,
            isNameDictionary: false,
            isKanjiDictionary: false,
            url: 'https://raw.githubusercontent.com/Garethp/RikaiRebuilt-dictionaries/master/french.json'
            // url: '../../french.json'
        },
        {
            name: 'Japanese to German Dictionary',
            id: '1d7e1b66-8478-4a7d-8c00-60cb85af772e',
            hasType: true,
            isNameDictionary: false,
            isKanjiDictionary: false,
            url: 'https://raw.githubusercontent.com/Garethp/RikaiRebuilt-dictionaries/master/german.json'
            // url: '../../german.json'
        },
        {
            name: 'Japanese to Russian Dictionary',
            id: '62be5b14-353b-4a25-92d7-341da40fd380',
            hasType: true,
            isNameDictionary: false,
            isKanjiDictionary: false,
            url: 'https://raw.githubusercontent.com/Garethp/RikaiRebuilt-dictionaries/master/russian.json'
            // url: '../../russian.json'
        },
        {
            name: 'Japanese to Thai Dictionary',
            id: 'bef50e55-3d98-438f-801f-70137714be30',
            hasType: true,
            isNameDictionary: false,
            isKanjiDictionary: false,
            url: 'https://raw.githubusercontent.com/Garethp/RikaiRebuilt-dictionaries/master/thai.json'
            // url: '../../thai.json'
        },
    ],
};
