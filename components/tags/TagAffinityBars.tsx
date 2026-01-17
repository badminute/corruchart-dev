// components/tags/TagAffinityBars.tsx
"use client";

import { useState } from "react";
import { TagBreakdown } from "@/lib/tagScores";
import TagAffinityRow from "./TagAffinityRow";

interface Props {
    tags: TagBreakdown[];
    favorites: string[];
    toggleFavorite: (id: string) => void;
}

export default function TagAffinityBars({
    tags,
    favorites,
    toggleFavorite,
}: Props) {
    const [open, setOpen] = useState<string | null>(null);

    return (
        <section className="mt-8">
            <h3 className="text-xl text-center font-semibold mb-4">
                Tag Affinities
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3">
                {tags.map(tag => (
                    <TagAffinityRow
                        key={tag.tag}
                        tag={tag}
                        open={open === tag.tag}
                        onToggle={() => setOpen(prev => (prev === tag.tag ? null : tag.tag))}
                        favorites={favorites}
                        toggleFavorite={toggleFavorite}
                    />
                ))}
            </div>
        </section>
    );
}
