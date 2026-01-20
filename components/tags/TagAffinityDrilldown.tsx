"use client";

import { useState, useMemo, useRef, useLayoutEffect } from "react";
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

    // Map tag -> whether to flip drilldown above
    const [flipUpMap, setFlipUpMap] = useState<Record<string, boolean>>({});

    // Refs for each tag container
    const tagRefs = useRef<Record<string, HTMLDivElement | null>>({});

    // Prepare reaction buckets for each tag
    const bucketsByTag = useMemo(() => {
        const map: Record<string, Record<ReactionKey, TagBreakdown["positive"]>> = {};
        tags.forEach(tag => {
            const buckets: Record<ReactionKey, TagBreakdown["positive"]> = {} as any;
            REACTIONS.forEach(r => (buckets[r] = []));

            Object.entries(tag.reactions).forEach(([r, opts]) => {
                const key = r.toLowerCase() as ReactionKey;
                if (REACTIONS.includes(key)) buckets[key] = opts;
            });

            map[tag.tag] = buckets;
        });
        return map;
    }, [tags]);

    // Calculate flipUp when a drilldown opens
    useLayoutEffect(() => {
        if (!openTag || !activeReaction) return;
        const el = tagRefs.current[openTag];
        if (!el) return;

        const rect = el.getBoundingClientRect();
        const spaceBelow = window.innerHeight - rect.bottom;
        const flipUp = spaceBelow < 200; // threshold, adjust as needed
        setFlipUpMap(prev => ({ ...prev, [openTag]: flipUp }));
    }, [openTag, activeReaction]);

    return (
        <div className="grid grid-cols-2 gap-4">
            {tags.map((tag, index) => {
                const buckets = bucketsByTag[tag.tag];
                const total = Object.values(buckets).reduce((sum, arr) => sum + arr.length, 0);
                if (total === 0) return null;

                const isLeftColumn = index % 2 === 0;

                return (
                    <div
                        key={tag.tag}
                        className="relative group w-full"
                        ref={el => {
  tagRefs.current[tag.tag] = el;
}}
                    >
                        <div
                            className={`flex items-center h-4 w-full`}
                            style={{ flexDirection: isLeftColumn ? "row" : "row-reverse" }}
                        >
                            {/* Tag name */}
                            <div
                                className={`font-semibold text-neutral-200 text-sm px-2 truncate ${isLeftColumn ? "text-right" : "text-left"}`}
                                style={{ maxWidth: 150, minWidth: 50, flexShrink: 1 }}
                            >
                                {tag.tag.toUpperCase()}
                            </div>

                            {/* Horizontal bar */}
                            <div className="flex rounded-sm overflow-hidden bg-neutral-900 flex-1 h-6 min-w-0">
                                {REACTIONS.map(r => {
                                    const count = buckets[r].length;
                                    if (!count) return null;
                                    const widthPercent = (count / total) * 100;

                                    return (
                                        <div
                                            key={r}
                                            style={{
                                                width: `${widthPercent}%`,
                                                minWidth: "12px",
                                                backgroundColor: REACTION_COLORS[r],
                                                transition: "filter 0.2s ease",
                                            }}
                                            className="cursor-pointer hover:brightness-120"
                                            title={`${r}: ${count}`}
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
                        </div>

                        {/* Drilldown */}
                        {openTag === tag.tag && activeReaction && buckets[activeReaction].length > 0 && (
                            <div
                                className="absolute z-50 left-0 w-64 p-3 bg-neutral-900 text-gray-200 rounded shadow-lg max-h-48 overflow-y-auto hide-scrollbar transition-all"
                                style={{
                                    top: flipUpMap[tag.tag] ? undefined : "100%",
                                    bottom: flipUpMap[tag.tag] ? "100%" : undefined,
                                    marginTop: flipUpMap[tag.tag] ? 0 : "0.5rem",
                                    marginBottom: flipUpMap[tag.tag] ? "0.5rem" : 0,
                                }}
                            >
                                <div className="mb-2">
                                    <div
                                        className="font-semibold mb-1"
                                        style={{ color: REACTION_COLORS[activeReaction] }}
                                    >
                                        {activeReaction} ({buckets[activeReaction].length})
                                    </div>
                                    <ul className="space-y-0.5 pl-2">
                                        {buckets[activeReaction].map(opt => {
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
