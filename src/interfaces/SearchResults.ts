export type SearchResults = DictionaryResult | KanjiResult;

export interface DictionaryResult {
    data: [string, string?][],
    names: boolean,
    kanji: false,
    title?: string,
    more: boolean,
    matchLen: number,
}

export interface KanjiResult {
    kanji: string,
    onkun: string,
    nanori: string,
    bushumei: string,
    misc: { [key: string]: any },
    radical: string,
    radicals: string[],
    radicalNumber: number,
    eigo: string,
    matchLen?: number,
}

export function isKanjiResult(entry: SearchResults): entry is KanjiResult {
    return entry.kanji && 'onkun' in entry;
}

export function isDictionaryResult(entry: SearchResults): entry is DictionaryResult {
    return !entry.kanji;
}