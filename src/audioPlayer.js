class AudioPlayer {
    static getAudioUrl(entry) {
        let kanaText;
        let kanjiText;

        //We have a single kanji selected
        if (entry && entry.kanji && entry.onkun) {
            entry.onkun.match(/^([^\u3001]*)/);

            kanjiText = entry.kanji;
            kanaText = RegExp.$1;

            if (!kanjiText || !kanaText) return;

            kanaText = Utils.convertKatakanaToHiragana(kanaText);

            if (!kanaText) return;
        } else if (entry.data[0]) {
            let entryData =
                entry.data[0][0].match(/^(.+?)\s+(?:\[(.*?)\])?\s*\/(.+)\//);

            if (!entryData) return 0;

            // Get just the kanji and kana
            kanjiText = entryData[1];
            kanaText = entryData[2];

            if (!kanjiText) return 0;

            if (!kanaText) kanaText = kanjiText;
        } else {
            return 0;
        }

        return "http://assets.languagepod101.com/dictionary/japanese/audiomp3.php?kana="
            + kanaText + "&kanji=" + kanjiText;

    }
}