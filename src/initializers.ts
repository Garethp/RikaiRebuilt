import FrequencyDb from "./database/FrequencyDb";
import PitchDb from "./database/PitchDb";

export function installFrequencyDb (frequencyDb: FrequencyDb): void {
    frequencyDb.open().then(() => {
        frequencyDb.findFrequencyForExpression('の').then(frequency => {
            if (frequency.length === 0) {
                frequencyDb.importFromFile('https://raw.githubusercontent.com/Garethp/RikaiRebuilt-dictionaries/master/frequency.json');
            }
        });
    });
}

export function installPitchDb (pitchDb: PitchDb): void {
    pitchDb.open().then(() => {
        pitchDb.getPitchAccent('・').then(pitch => {
            if (pitch.length === 0) {
                pitchDb.importFromFile('https://raw.githubusercontent.com/Garethp/RikaiRebuilt-dictionaries/master/pitch.json');
            }
        });
    });
}