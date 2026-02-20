"use client";

import { useState, useMemo, useRef, useLayoutEffect } from "react";
import { REACTIONS, REACTION_COLORS, ReactionKey } from "./reactionConfig";
import { TagBreakdown } from "@/lib/tagScores";



interface TagAffinityDrilldownProps {
    tags: TagBreakdown[];
    favorites: string[];
    toggleFavorite: (id: string) => void;
    searchQuery?: string;
    forceCloseSignal?: number;
}


export default function TagAffinityDrilldown({
  tags,
  favorites,
  toggleFavorite,
  searchQuery = "",
  forceCloseSignal,
}: TagAffinityDrilldownProps) {
    const [openTag, setOpenTag] = useState<string | null>(null);
    const [activeReaction, setActiveReaction] = useState<ReactionKey | null>(null);
    const q = searchQuery.trim().toLowerCase();
    const isFavorite = (id: string) => favorites.includes(id);

    useLayoutEffect(() => {
        setOpenTag(null);
        setActiveReaction(null);
    }, [forceCloseSignal]);

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
      const tagHasMatch =
        q &&
        Object.values(buckets).some(bucket =>
          bucket.some(opt => opt.label.toLowerCase().includes(q))
        );
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
              className={`font-semibold text-sm px-2 truncate ${
                isLeftColumn ? "text-right" : "text-left"
              } ${tagHasMatch ? "text-yellow-300" : "text-neutral-200"}`}
            >
              {tag.tag.toUpperCase()}
            </div>

            {/* Horizontal bar with per-option highlight */}
            <div className="relative flex rounded-sm overflow-hidden flex-1 h-6 min-w-0 bg-neutral-900">
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
                    className="cursor-pointer hover:brightness-120 relative"
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
                  >
                    {/* Golden highlight for this segment if any option matches the search */}
                {q && buckets[r].some(opt => opt.label.toLowerCase().includes(q)) && (
                <div
                    className="absolute inset-0 rounded-sm pointer-events-none"
                    style={{
                    backgroundColor: "rgba(246, 249, 105, 0.7)",   // semi-transparent golden highlight
                    }}
                />
                )}

                  </div>
                );
              })}
            </div>
          </div>

          {/* Drilldown */}
          {openTag === tag.tag && activeReaction && buckets[activeReaction].length > 0 && (
            <div
              className="absolute z-50 left-0 w-64 p-3 bg-neutral-900 text-gray-200 rounded shadow-lg max-h-48 overflow-y-auto hide-scrollbar transition-all border border-neutral-600"
              style={{
                top: flipUpMap[tag.tag] ? undefined : "100%",
                bottom: flipUpMap[tag.tag] ? "100%" : undefined,
                marginTop: flipUpMap[tag.tag] ? 0 : "0.5rem",
                marginBottom: flipUpMap[tag.tag] ? "0.5rem" : 0,
              }}
            >
              <div className="mb-2">
                {/* Contextual Title: Tag - Reaction (Count) */}
                <div className="font-semibold mb-1 flex items-center gap-1.5 whitespace-nowrap">
                  <span className="text-gray-400 capitalize">{tag.tag}</span>
                  <span className="text-neutral-600">—</span>
                  <span style={{ color: REACTION_COLORS[activeReaction] }} className="capitalize">
                    {activeReaction} ({buckets[activeReaction].length})
                  </span>
                </div>

                <ul className="space-y-0.5 pl-2">
                  {buckets[activeReaction].map(opt => {
                    const showStar = ["like", "love", "lust", "dislike", "disgust"].includes(activeReaction);
                    return (
                      <li key={opt.id} className="flex justify-between items-center text-neutral-300">
                        <span className="truncate pr-2">
                          {q && opt.label.toLowerCase().includes(q) ? (
                            <span className="bg-yellow-400/30 text-yellow-300 px-0.5">
                              {opt.label}
                            </span>
                          ) : (
                            opt.label
                          )}
                        </span>

                        {showStar && (
                          <button
                            onClick={() => toggleFavorite(opt.id)}
                            className={
                              isFavorite(opt.id)
                                ? "text-yellow-400 cursor-pointer shrink-0"
                                : "text-neutral-500 cursor-pointer shrink-0"
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
