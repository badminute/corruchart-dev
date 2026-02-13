// app/data/scoring.ts

export type CategoryId = 1 | 2 | 3 | 4 | 5 | 6;

/** UI answer values */
export type PositiveAnswer = "like" | "love" | "lust";
export type Reaction = "disgust" | "dislike" | "indifferent" | "like" | "love" | "lust";

export const REACTION_SCORES: Record<Reaction, number> = {
    disgust: -2,
    dislike: -1,
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
        like: 0,
        "love": 0,
        lust: 1,
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
    { points: 75, key: 1 },
    { points: 750, key: 2 },
    { points: 1750, key: 3 },
    { points: 3000, key: 4 },
    { points: 5000, key: 5 },
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
