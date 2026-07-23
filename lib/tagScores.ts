import { OPTIONS } from "@/data/options";
import type { Reaction } from "@/data/scoring";

export type TagBreakdown = {
    tag: string;
    positive: { id: string; label: string }[];
    negative: { id: string; label: string }[];
    reactions: Record<Reaction, { id: string; label: string }[]>;
};

// Positive and negative reactions
const POSITIVE = new Set<Reaction>(["maybe", "like", "love", "lust"] as Reaction[]);
const NEGATIVE = new Set<Reaction>(["disgust", "dislike"] as Reaction[]);

// Include indifferent internally (but can be ignored in UI if desired)
const ALL_REACTIONS: Reaction[] = [
    "indifferent",
    "disgust",
    "dislike",
    "maybe",
    "like",
    "love",
    "lust",
];

const REACTION_WEIGHT_SCORE: Record<Reaction, number> = {
    indifferent: 0,
    disgust: 0,
    dislike: 1,
    maybe: 2,
    like: 3,
    love: 4,
    lust: 5,
};

const MAX_REACTION_SCORE = 5;

function getTagWeight(tag: TagBreakdown) {
    let totalResponses = 0;
    let totalScore = 0;

    for (const reaction of ALL_REACTIONS) {
        if (reaction === "indifferent") continue;
        const bucket = tag.reactions[reaction];
        if (!bucket || bucket.length === 0) continue;

        totalResponses += bucket.length;
        totalScore += REACTION_WEIGHT_SCORE[reaction] * bucket.length;
    }

    if (totalResponses === 0) return 0;
    return totalScore / (MAX_REACTION_SCORE * totalResponses);
}

function compareTagWeight(a: TagBreakdown, b: TagBreakdown) {
    const weightDiff = getTagWeight(b) - getTagWeight(a);
    if (weightDiff !== 0) return weightDiff;

    const aCount = Object.values(a.reactions).reduce((sum, items) => sum + items.length, 0);
    const bCount = Object.values(b.reactions).reduce((sum, items) => sum + items.length, 0);
    if (bCount !== aCount) return bCount - aCount;

    return a.tag.localeCompare(b.tag);
}

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

    const tagsWithReactions = Object.values(tagMap).filter(
        t => t.positive.length > 0 || t.negative.length > 0
    );

    const positive = tagsWithReactions.slice().sort(compareTagWeight);
    const negative = tagsWithReactions.slice().sort(compareTagWeight);

    return { positive, negative };
}
