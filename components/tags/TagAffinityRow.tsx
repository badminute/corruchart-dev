// components/tags/TagAffinityRow.tsx
"use client";

import { useMemo } from "react";
import { TagBreakdown } from "@/lib/tagScores";
import { REACTIONS, getReactionColors, ReactionKey } from "./reactionConfig";
import TagAffinityDrilldown from "./TagAffinityDrilldown";
import { useSettings } from "../SettingsContext";

interface Props {
    tag: TagBreakdown;
    open: boolean;
    onToggle: () => void;
    favorites: string[];
    toggleFavorite: (id: string) => void;
}

export default function TagAffinityRow({ tag, open, onToggle, favorites, toggleFavorite }: Props) {
    const { colourblindMode } = useSettings();
    const reactionColors = useMemo(() => getReactionColors(colourblindMode), [colourblindMode]);
    const buckets: Record<ReactionKey, any[]> = Object.fromEntries(
        REACTIONS.map(r => [r, []])
    ) as Record<ReactionKey, any[]>;

    REACTIONS.forEach(r => {
        buckets[r] = tag.reactions[r] ?? [];
    });

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
                {[...REACTIONS].reverse().map(r => {
                    const count = buckets[r].length;
                    if (!count) return null;

                    return (
                        <div
                            key={r}
                            style={{
                                width: `${(count / total) * 100}%`,
                                backgroundColor: reactionColors[r],
                            }}
                            title={`${r}: ${count}`}
                        />
                    );
                })}
            </button>
        </div>
    );  
}
