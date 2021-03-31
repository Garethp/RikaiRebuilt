type WordSearchMessage = {
    type: "wordSearch";
    content: string;
}

type GetEpwingDefinition = {
    type: "getEpwingDefinition";
    content: string;
}

type GetPitch = {
    type: "getPitch";
    content: {
        expression: string;
        reading: string;
    }
}

type GetFrequency = {
    type: "getFrequency"
    content: {
        inExpression: string;
        inReading: string;
        useHighlightedWord: boolean;
        highlightedWord: string;
    }
}

export type MessagesToBackground = WordSearchMessage | GetEpwingDefinition | GetPitch | GetFrequency;
