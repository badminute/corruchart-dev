// components/ui/tags/reactionConfig.ts

// Reactions in desired display order (Lust → Love → Like → Maybe → Dislike → Disgust)
export const REACTIONS = ["lust", "love", "like", "maybe", "dislike", "disgust"] as const;

export type ReactionKey = typeof REACTIONS[number];

// Colors for each reaction
export const getReactionColors = (colourblindMode: boolean): Record<ReactionKey, string> => colourblindMode ? {
    lust: "#9467bd", // darker purple
    love: "#aec7e8", // light blue
    like: "#1e75b3", // blue
    maybe: "#dfbe08", // light yellow
    dislike: "#e07110", // orange
    disgust: "#d72828", // red
} : {
    lust: "#9467bd",
    love: "#2a7b9d",
    like: "#299255",
    maybe: "#dfbe08",
    dislike: "#e07110",
    disgust: "#b53737",
};
