"use client";

import { useState, useMemo } from "react";
import { REACTIONS, REACTION_COLORS, ReactionKey } from "./reactionConfig";
import { TagBreakdown } from "@/lib/tagScores";

interface TagAffinityDrilldownProps {
    tags: TagBreakdown[];
    favorites: string[];
    toggleFavorite: (id: string) => void;
}

export default function TagAffinityDrilldown({
    tags,
    favorites,
    toggleFavorite,
}: TagAffinityDrilldownProps) {
    const [openTag, setOpenTag] = useState<string | null>(null);
    const [activeReaction, setActiveReaction] = useState<ReactionKey | null>(null);

    const isFavorite = (id: string) => favorites.includes(id);

    // Prepare reaction buckets for each tag
    const bucketsByTag = useMemo(() => {
        const map: Record<string, Record<ReactionKey, TagBreakdown["positive"]>> = {};
        tags.forEach(tag => {
            // Initialize buckets for visible reactions only
            const buckets: Record<ReactionKey, TagBreakdown["positive"]> = {} as any;
            REACTIONS.forEach(r => (buckets[r] = []));

            // Map tag.reactions into visible buckets, ignoring "indifferent"
            Object.entries(tag.reactions).forEach(([r, opts]) => {
                const key = r.toLowerCase() as ReactionKey;
                if (REACTIONS.includes(key)) {
                    buckets[key] = opts;
                }
            // ignore "indifferent"
            });

            map[tag.tag] = buckets;
        });
        return map;
    }, [tags]);

    return (
        <div className="grid grid-cols-2 gap-4 justify-center">
            {tags.map(tag => {
                const buckets = bucketsByTag[tag.tag];
                const total = Object.values(buckets).reduce((sum, arr) => sum + arr.length, 0);
                if (total === 0) return null;

                return (
                    <div key={tag.tag} className="relative group">
                        <div
                            className="font-semibold cursor-pointer text-neutral-200 mb-1 text-center sm:text-left text-sm"
                        >
                            {tag.tag.toUpperCase()}
                        </div>

                        {/* Horizontal bar: each segment clickable */}
                        <div className="flex h-8 rounded overflow-hidden bg-neutral-800"> {/* increased h-6 → h-8 */}
                            {REACTIONS.map(r => {
                                const count = buckets[r].length;
                                if (!count) return null;

                                const widthPercent = (count / total) * 100;
                                return (
                                    <div
                                        key={r}
                                        style={{
                                            width: `${widthPercent}%`,
                                            minWidth: "12px", // ensures tiny segments are still clickable
                                            backgroundColor: REACTION_COLORS[r],
                                        }}
                                        title={`${r}: ${count}`}
                                        className="cursor-pointer"
                                        onClick={() => {
                                            if (openTag === tag.tag && activeReaction === r) {
                                                setOpenTag(null);
                                                setActiveReaction(null);
                                            } else {
                                                setOpenTag(tag.tag);
                                                setActiveReaction(r);
                                            }
                                        }}
                                    />
                                );
                            })}
                        </div>

                        {/* Drilldown: show only selected reaction */}
                        {openTag === tag.tag && activeReaction && buckets[activeReaction].length > 0 && (
                            <div className="absolute z-50 top-full left-0 mt-2 w-64 p-3 bg-neutral-900 text-gray-200 rounded shadow-lg max-h-48 overflow-y-auto hide-scrollbar">
                                <div className="mb-2">
                                    <div
                                        className="font-semibold mb-1"
                                        style={{ color: REACTION_COLORS[activeReaction] }}
                                    >
                                        {activeReaction}
                                    </div>
                                    <ul className="space-y-0.5 pl-2">
                                        {buckets[activeReaction].map(opt => {
                                            // Show star only for like, love, lust
                                            const showStar = ["like", "love", "lust"].includes(activeReaction);
                                            return (
                                                <li
                                                    key={opt.id}
                                                    className="flex justify-between items-center text-neutral-300"
                                                >
                                                    {opt.label}
                                                    {showStar && (
                                                        <button
                                                            onClick={() => toggleFavorite(opt.id)}
                                                            className={
                                                                isFavorite(opt.id)
                                                                    ? "text-yellow-400 cursor-pointer"
                                                                    : "text-neutral-500 cursor-pointer"
                                                            }
                                                        >
                                                            ★
                                                        </button>
                                                    )}
                                                </li>
                                            );
                                        })}
                                    </ul>
                                </div>
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
}
