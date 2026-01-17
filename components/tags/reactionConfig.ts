// components/ui/tags/reactionConfig.ts

// Reactions in desired display order (Lust → Love → Like → Dislike → Disgust)
export const REACTIONS = ["lust", "love", "like", "dislike", "disgust"] as const;

export type ReactionKey = typeof REACTIONS[number];

// Colors for each reaction
export const REACTION_COLORS: Record<ReactionKey, string> = {
    lust: "rgb(141, 83, 173)",
    love: "rgb(42, 124, 159)",
    like: "#299255",
    dislike: "#b66640",
    disgust: "#b53737",
};
