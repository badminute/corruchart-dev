// /lib/tagScores.ts
import { OPTIONS } from "@/data/options";
import type { Reaction } from "@/data/scoring";

export type TagBreakdown = {
    tag: string;
    positive: { id: string; label: string }[];
    negative: { id: string; label: string }[];
};

// Define which reactions are positive/negative
const POSITIVE = new Set<Reaction>(["like", "love", "lust"] as Reaction[]);
const NEGATIVE = new Set<Reaction>(["disgust", "dislike"] as Reaction[]);

// Explicit return type
export function computeTagScores(
    selections: Record<string, Reaction>
): { positive: TagBreakdown[]; negative: TagBreakdown[] } {
    const tagMap: Record<string, TagBreakdown> = {};

    for (const option of OPTIONS) {
        const reaction = selections[option.id];
        if (!reaction) continue;

        for (const tag of option.tags ?? []) {
            if (!tagMap[tag]) tagMap[tag] = { tag, positive: [], negative: [] };

            if (POSITIVE.has(reaction)) {
                tagMap[tag].positive.push({ id: option.id, label: option.label });
            }

            if (NEGATIVE.has(reaction)) {
                tagMap[tag].negative.push({ id: option.id, label: option.label });
            }
        }
    }

    // Sort tags by number of positive/negative reactions
    const positive = Object.values(tagMap)
        .filter(t => t.positive.length > 0)
        .sort((a, b) => b.positive.length - a.positive.length);

    const negative = Object.values(tagMap)
        .filter(t => t.negative.length > 0)
        .sort((a, b) => b.negative.length - a.negative.length);

    return { positive, negative };
}
