export interface SearchResults {
    data: [string, string?][],
    names: boolean,
    more: boolean,
    matchLen: number,
}