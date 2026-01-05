// app/data/scoring.ts

export type CategoryId = 1 | 2 | 3 | 4 | 5 | 6;

/** UI answer values */
export type PositiveAnswer = "like" | "love" | "lust";
export type Reaction = "disgust" | "hate" | "indifferent" | "like" | "love" | "lust";

export const REACTION_SCORES: Record<Reaction, number> = {
    disgust: -2,
    hate: -1,
    indifferent: 0,
    like: 1,
    love: 2,
    lust: 3,
  };

export const CATEGORY_POINTS: Record<
    CategoryId,
    Record<PositiveAnswer, number>
> = {
    1: {
        like: 2,
        "love": 3,
        lust: 3,
    },
    2: {
        like: 5,
        "love": 7,
        lust: 7,
    },
    3: {
        like: 12,
        "love": 16,
        lust: 16,
    },
    4: {
        like: 20,
        "love": 25,
        lust: 25,
    },
    5: {
        like: 35,
        "love": 45,
        lust: 45,
    },
    6: {
        like: 0,
        "love": 0,
        lust: 0, // category 6 never gives points
    },
};

export const THRESHOLDS = [
    { label: "Threshold 1", points: 100, description: "You are barely corrupt." },
    { label: "Threshold 2", points: 400, description: "You are mildly corrupt." },
    { label: "Threshold 3", points: 900, description: "You are moderately corrupt." },
    { label: "Threshold 4", points: 1800, description: "You are very corrupt." },
    { label: "Threshold 5", points: 3000, description: "You are beyond corrupt. Sicko." },
    { label: "Threshold 6", points: 0, description: "You should probably be in prison." }, // Optional
];

export function computeScore(
    options: { category: CategoryId; value: string }[]
) {
    let total = 0;
    let category6Hit = false;

    for (const { category, value } of options) {
        if (category === 6 && value in CATEGORY_POINTS[6]) {
            category6Hit = true;
            continue;
        }

        if (
            category !== 6 &&
            value in CATEGORY_POINTS[category]
        ) {
            total += CATEGORY_POINTS[category][value as PositiveAnswer];
        }
    }

    return { total, category6Hit };
}
