import IndexedDictionary, {Dictionary} from "../database/IndexedDictionary";
import NameDictionary from "../database/NameDictionary";

export interface DictionaryDefinition {
    name: string,
    id: string,
    hasType: boolean,
    isNameDictionary: boolean,
    isKanjiDictionary: boolean,
    url?: string,
}

export type DictionaryWithDb = DictionaryWithIndexedDb | DictionaryWithKanjiDb | DictionaryWithNameDb;

export interface DictionaryWithKanjiDb extends DictionaryDefinition {
    isNameDictionary: false,
    isKanjiDictionary: true,
    db: Dictionary,
}

export interface DictionaryWithNameDb extends DictionaryDefinition {
    isNameDictionary: true,
    isKanjiDictionary: false,
    db: NameDictionary,
}

export interface DictionaryWithIndexedDb extends DictionaryDefinition {
    isNameDictionary: false,
    isKanjiDictionary: false,
    db: IndexedDictionary,
}

export function isForKanji(dictionary: DictionaryWithDb): dictionary is DictionaryWithKanjiDb {
    return dictionary.isKanjiDictionary === true;
}

export function isForNames(dictionary: DictionaryWithDb): dictionary is DictionaryWithNameDb {
    return dictionary.isNameDictionary === true;
}

export function isForWords(dictionary: DictionaryWithDb): dictionary is DictionaryWithIndexedDb {
    return dictionary.isKanjiDictionary === false && dictionary.isNameDictionary === false;
}

export function isIndexedDictionary(db: Dictionary | IndexedDictionary): db is IndexedDictionary {
    return 'findWord' in db;
}

