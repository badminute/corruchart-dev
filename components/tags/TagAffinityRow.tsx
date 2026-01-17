// components/tags/TagAffinityRow.tsx
"use client";

import { TagBreakdown } from "@/lib/tagScores";
import { REACTIONS, REACTION_COLORS, ReactionKey } from "./reactionConfig";
import TagAffinityDrilldown from "./TagAffinityDrilldown";

interface Props {
    tag: TagBreakdown;
    open: boolean;
    onToggle: () => void;
    favorites: string[];
    toggleFavorite: (id: string) => void;
}

export default function TagAffinityRow({ tag, open, onToggle, favorites, toggleFavorite }: Props) {
    // Build reaction buckets
    const buckets: Record<ReactionKey, any[]> = {
        disgust: [],
        dislike: [],
        like: [],
        love: [],
        lust: [],
    };

    tag.positive.forEach(opt => buckets.like.push(opt));
    tag.negative.forEach(opt => buckets.dislike.push(opt));
    const total = Object.values(buckets).reduce((acc, arr) => acc + arr.length, 0);
    if (total === 0) return null;

    return (
        <div className="flex items-center gap-2">
            {/* TAG NAME ON LEFT */}
            <div className="w-28 text-sm text-neutral-300 truncate">
                {tag.tag.toUpperCase()}
            </div>

            {/* BAR */}
            <button
                onClick={onToggle}
                className="flex-1 h-1 rounded overflow-hidden flex cursor-pointer bg-neutral-800"
            >
                {REACTIONS.map(r => {
                    const count = buckets[r].length;
                    if (!count) return null;

                    return (
                        <div
                            key={r}
                            style={{
                                width: `${(count / total) * 100}%`,
                                backgroundColor: REACTION_COLORS[r],
                            }}
                            title={`${r}: ${count}`}
                        />
                    );
                })}
            </button>
        </div>
    );  
}
