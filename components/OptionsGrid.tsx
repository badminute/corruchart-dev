"use client";

import OptionItem from "./OptionItem";
import { DESCRIPTIONS } from "@/data/descriptions";
import type { Option as BaseOption } from "@/types/option";
import { useCallback } from "react";

type OptionWithCategory = BaseOption & { category: number };

type FilteredItem = {
    slot: {
        slotId: string;
        options: OptionWithCategory[];
    };
    option: OptionWithCategory;
    index: number;
};

type Props = {
    filtered: FilteredItem[];
    states: number[];
    options: OptionWithCategory[];
    activePluses: any[];
    activeVariant: Record<string, number>;
    openDescription: string | null;
    setOpenDescription: (id: string | null) => void;
    setActiveVariant: React.Dispatch<React.SetStateAction<Record<string, number>>>;
    cycleColor: (index: number) => void;
};

export default function OptionsGrid({
    filtered,
    states,
    options,
    activePluses,
    activeVariant,
    openDescription,
    setOpenDescription,
    setActiveVariant,
    cycleColor,
}: Props) {
    const getPlusImage = useCallback(
        (option: OptionWithCategory, state: number) => {
            if (option.category === 5 || option.category === 6)
                return "/images/corruption-potion-large.png";
            if (option.category === 4)
                return "/images/corruption-potion-medium.png";
            return "/images/corruption-potion-small.png";
        },
        []
    );

    return (
        <div style={{ backgroundColor: "#1F2023", color: "#9F86D8" }}>
            <div
                className="
                    grid
                    gap-x-12 gap-y-4
                    grid-cols-1
                    sm:grid-cols-2
                    md:grid-cols-3
                    lg:grid-cols-4
                    xl:grid-cols-5
                "
            >
                {filtered.map(({ slot, option, index }) => (
                    <OptionItem
                        key={`${slot.slotId}:${option.id}`}
                        slot={slot}
                        option={option}
                        index={index}
                        state={states[index]}
                        options={options}
                        activePluses={activePluses}
                        activeVariant={activeVariant}
                        description={DESCRIPTIONS[option.id]}
                        openDescription={openDescription}
                        setOpenDescription={setOpenDescription}
                        setActiveVariant={setActiveVariant}
                        cycleColor={cycleColor}
                        getPlusImage={getPlusImage}
                    />
                ))}
            </div>
        </div>
    );
}
