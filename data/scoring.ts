// app/data/scoring.ts

export type CategoryId = 1 | 2 | 3 | 4 | 5 | 6;

export type CategoryPoints = {
    mildlyLike: number;
    like: number;
    love: number;
};

export const CATEGORY_POINTS: Record<CategoryId, CategoryPoints> = {
    1: { mildlyLike: 1, like: 2, love: 3 },
    2: { mildlyLike: 3, like: 5, love: 7 },
    3: { mildlyLike: 8, like: 12, love: 16 },
    4: { mildlyLike: 15, like: 20, love: 25 },
    5: { mildlyLike: 25, like: 35, love: 45 },
    6: { mildlyLike: 0, like: 0, love: 0 }, // Category 6 is threshold-based, not points
};

export const THRESHOLDS = [
    { label: "Threshold 1", points: 100 },
    { label: "Threshold 2", points: 400 },
    { label: "Threshold 3", points: 900 },
    { label: "Threshold 4", points: 1800 },
    { label: "Threshold 5", points: 3000 },
    { label: "Threshold 6", points: 0 }, // Special handling for Category 6
];

/**
 * Compute the total positive score for a user selection.
 * @param options Array of user-selected options with category & value
 */
export function computeScore(
    options: { category: CategoryId; value: "Mildly Like" | "Like" | "Love" | string }[]
) {
    let total = 0;
    let category6Hit = false;

    options.forEach(({ category, value }) => {
        if (category === 6 && ["Mildly Like", "Like", "Love"].includes(value)) {
            category6Hit = true;
        } else if (CATEGORY_POINTS[category] && ["Mildly Like", "Like", "Love"].includes(value)) {
            // Map "Mildly Like" | "Like" | "Love" → mildlyLike | like | love
            const key = value.toLowerCase().replace(" ", "") as keyof CategoryPoints;
            total += CATEGORY_POINTS[category][key];
        }
    });

    return { total, category6Hit };
}
