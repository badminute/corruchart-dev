// components/ui/tags/reactionConfig.ts

// Reactions in desired display order (Lust → Love → Like → Dislike → Disgust)
export const REACTIONS = ["lust", "love", "like", "dislike", "disgust"] as const;

export type ReactionKey = typeof REACTIONS[number];

// Colors for each reaction
export const getReactionColors = (colourblindMode: boolean): Record<ReactionKey, string> => colourblindMode ? {
    lust: "rgb(148, 103, 189)", // darker purple
    love: "#aec7e8", // light blue
    like: "rgb(31, 119, 180)", // blue
    dislike: "rgb(255, 127, 14)", // orange
    disgust: "rgb(214, 39, 40)", // red
} : {
    lust: "rgb(141, 83, 173)",
    love: "rgb(42, 124, 159)",
    like: "#299255",
    dislike: "#b66640",
    disgust: "#b53737",
};
