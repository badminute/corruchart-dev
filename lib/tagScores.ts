import { OPTIONS } from "@/data/options";
import type { Reaction } from "@/data/scoring";

export type TagBreakdown = {
    tag: string;
    positive: { id: string; label: string }[];
    negative: { id: string; label: string }[];
    reactions: Record<Reaction, { id: string; label: string }[]>;
};

// Positive and negative reactions
const POSITIVE = new Set<Reaction>(["like", "love", "lust"] as Reaction[]);
const NEGATIVE = new Set<Reaction>(["disgust", "dislike"] as Reaction[]);

// Include indifferent internally (but can be ignored in UI if desired)
const ALL_REACTIONS: Reaction[] = [
    "indifferent",
    "disgust",
    "dislike",
    "like",
    "love",
    "lust",
];

export function computeTagScores(
    selections: Record<string, Reaction>
): { positive: TagBreakdown[]; negative: TagBreakdown[] } {
    const tagMap: Record<string, TagBreakdown> = {};

    for (const option of OPTIONS) {
        const reaction = selections[option.id];
        if (!reaction) continue;

        // Normalize to lowercase for consistent keys
        const key = reaction.toLowerCase() as Reaction;

        for (const tag of option.tags ?? []) {
            if (!tagMap[tag]) {
                tagMap[tag] = {
                    tag,
                    positive: [],
                    negative: [],
                    reactions: Object.fromEntries(
                        ALL_REACTIONS.map(r => [r, []])
                    ) as Record<Reaction, { id: string; label: string }[]>,
                };
            }

            // Safety check: only push if the bucket exists
            if (!tagMap[tag].reactions[key]) {
                console.warn(`Skipping unknown reaction "${reaction}" for tag "${tag}"`);
                continue;
            }

            // Add option to the reaction-specific bucket
            tagMap[tag].reactions[key].push({
                id: option.id,
                label: option.label,
            });

            // Update positive/negative arrays
            if (POSITIVE.has(key)) {
                tagMap[tag].positive.push({ id: option.id, label: option.label });
            }
            if (NEGATIVE.has(key)) {
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
