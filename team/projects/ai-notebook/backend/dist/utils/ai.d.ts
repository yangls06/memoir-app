export declare function generateSummary(content: string): Promise<string>;
export declare function chatWithNotes(question: string, noteIds?: string[]): Promise<{
    answer: string;
    sources: {
        noteId: string;
        title: string;
    }[];
}>;
//# sourceMappingURL=ai.d.ts.map