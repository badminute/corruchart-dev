// components/ui/tags/reactionConfig.ts

// Reactions in desired display order (Lust → Love → Like → Dislike → Disgust)
export const REACTIONS = ["lust", "love", "like", "dislike", "disgust"] as const;

export type ReactionKey = typeof REACTIONS[number];

// Colors for each reaction
export const REACTION_COLORS: Record<ReactionKey, string> = {
    lust: "#c88de8ff",
    love: "#37bdf6ff",
    like: "#27ae60",
    dislike: "#fc8d59",
    disgust: "#ef4444",
};
