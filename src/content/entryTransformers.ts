import {Config} from "../defaultConfig";
import {isDictionaryResult, SearchResults} from "../interfaces/SearchResults";

const transformNameEntriesToHtml = (entries: SearchResults, config: Config): string => {
    if (!isDictionaryResult(entries)) return '';

    const returnValue = [];
    let columns = [];

    returnValue.push('<div class="w-title">Names Dictionary</div>');
    for (let entry of entries.data) {
        let column = '<div>';
        let extractedEntries = entry[0].match(/^(.+?)\s+(?:\[(.*?)\])?\s*\/([\S\s]+)\//);
        let [ _, kanji, kana, definition ] = extractedEntries;
        if (!extractedEntries) continue;

        if (kana) column += `<span class="w-kanji">${kanji}</span> &#32; <span class="w-kana">${kana}</span>`;
        else column += `<span><span class="w-kana">${kanji}</span></span>`;

        if (!config.hideDefinitions)
            column += `<div class="w-def">${definition.replace(/\//g, '; ').replace(/\n/g, '<br/>')}</div>`;

        column += '</div>';
        columns.push(column);
    }

    //If we have more than four results, and there's more names, and we have an even number of names, take one off
    //to make space for the ...
    if (columns.length > 4 && entries.more && columns.length % 2 === 0) {
        columns.pop();
    }

    if (entries.more) columns.push('<div>...</div>');

    if (columns.length > 4) {
        columns.unshift(`<div class="two-columns">`);
        columns.push(`</div>`);
    }

    returnValue.push(columns.join(''));
    return returnValue.join('');
};

export { transformNameEntriesToHtml };