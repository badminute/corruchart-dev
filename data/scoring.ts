// app/data/scoring.ts

export type CategoryId = 1 | 2 | 3 | 4 | 5 | 6;

/** UI answer values */
export type PositiveAnswer = "Like" | "Love" | "Lust";

export const CATEGORY_POINTS: Record<
    CategoryId,
    Record<PositiveAnswer, number>
> = {
    1: {
        Like: 2,
        "Love": 3,
        Lust: 3,
    },
    2: {
        Like: 5,
        "Love": 7,
        Lust: 7,
    },
    3: {
        Like: 12,
        "Love": 16,
        Lust: 16,
    },
    4: {
        Like: 20,
        "Love": 25,
        Lust: 25,
    },
    5: {
        Like: 35,
        "Love": 45,
        Lust: 45,
    },
    6: {
        Like: 0,
        "Love": 0,
        Lust: 0, // category 6 never gives points
    },
};

export const THRESHOLDS = [
    { label: "Threshold 1", points: 100, description: "You are barely corrupt. Here's a headpat." },
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
