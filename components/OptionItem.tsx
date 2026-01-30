"use client";

import { memo, useRef } from "react";

type Props = {
    slot: any;
    option: any;
    index: number;
    state: number;
    options: any[];
    activePluses: any[];
    activeVariant: Record<string, number>;
    description?: string;
    openDescription: string | null;
    setOpenDescription: (id: string | null) => void;
    setActiveVariant: React.Dispatch<React.SetStateAction<Record<string, number>>>;
    cycleColor: (index: number) => void;
    getPlusImage: (option: any, state: number) => string;
};

function OptionItem({
    slot,
    option,
    index,
    state,
    options,
    activePluses,
    activeVariant,
    description,
    openDescription,
    setOpenDescription,
    setActiveVariant,
    cycleColor,
    getPlusImage,
}: Props) {
    const labelRef = useRef<HTMLButtonElement | null>(null);

    // ✅ LOCAL (per-item) animation refs
    const holdTimerRef = useRef<NodeJS.Timeout | null>(null);
    const didLongPressRef = useRef(false);

    return (
        <div className="relative">
            <div className="flex items-center gap-2 p-2 rounded w-full h-full">
                {/* STAR */}
                <div className="relative flex justify-center items-center">
                    <button onClick={() => cycleColor(index)} className="relative">
                        <svg
                            className="cursor-pointer"
                            width="32"
                            height="32"
                            viewBox="0 0 24 24"
                            fill={["#828282ff", "#e74c3c", "#fc8d59", "#27ae60", "#37bdf6ff", "#c88de8ff"][state]}
                            stroke="#000"
                            strokeWidth="0.5"
                        >
                            <path d="M12 2.5l2.9 6.1 6.7.6-5 4.4 1.5 6.5L12 16.8 5.9 20.1l1.5-6.5-5-4.4 6.7-.6L12 2.5z" />
                        </svg>

                        {activePluses
                            .filter(p => p.index === index)
                            .map(p => (
                                <img
                                    key={p.id}
                                    src={getPlusImage(option, p.state)}
                                    className="absolute -top-6 -right-3 pointer-events-none animate-pop-plus w-5"
                                />
                            ))}

                        {slot.options.length > 1 && (
                            <span
                                className="absolute -top-1 -left-1 text-[12px] text-gray-400 cursor-pointer select-none z-10"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setActiveVariant(prev => ({
                                        ...prev,
                                        [slot.slotId]:
                                            ((prev[slot.slotId] ?? 0) + 1) % slot.options.length,
                                    }));
                                }}
                            >
                                ⇄
                            </span>
                        )}
                    </button>
                </div>

                {/* LABEL */}
                <button
                    ref={labelRef}
                    id={`label-${slot.slotId}`}
                    onPointerDown={() => {
                        if (slot.options.length <= 1) return;

                        didLongPressRef.current = false;
                        labelRef.current?.classList.add("holding");

                        holdTimerRef.current = setTimeout(() => {
                            didLongPressRef.current = true;
                            labelRef.current?.classList.remove("holding");

                            setActiveVariant(prev => ({
                                ...prev,
                                [slot.slotId]:
                                    ((prev[slot.slotId] ?? 0) + 1) % slot.options.length,
                            }));
                        }, 400);
                    }}
                    onPointerUp={() => {
                        clearTimeout(holdTimerRef.current!);
                        labelRef.current?.classList.remove("holding");
                    }}
                    onPointerLeave={() => {
                        clearTimeout(holdTimerRef.current!);
                        labelRef.current?.classList.remove("holding");
                    }}
                    onClick={() => {
                        if (didLongPressRef.current) return;

                        if (description) {
                            setOpenDescription(openDescription === option.id ? null : option.id);
                        }

                        const flashEl = document.createElement("span");
                        flashEl.className =
                            "absolute inset-0 bg-violet-400/30 rounded pointer-events-none animate-flash z-20";

                        labelRef.current?.appendChild(flashEl);
                        setTimeout(() => flashEl.remove(), 200);
                    }}
                    className={`
                        group
                        relative text-left text-lg px-2 py-1 rounded
                        cursor-pointer select-none transition-all duration-100
                        hover:bg-violet-400/10
                        ${option.category === 5 ? "text-purple-300/60" : ""}
                        ${option.category === 6 ? "text-indigo-300/60" : ""}
                    `}
                >
                    {option.label}

                    {/* LONG PRESS WIPE */}
                    <span
                        className="
                        absolute inset-0
                        bg-violet-400/20
                        origin-left
                        scale-x-0
                        duration-[400ms] ease-in
                        delay-[150ms]        /* <-- start delay */
                        pointer-events-none
                        group-[.holding]:scale-x-100
                    "
                    />

                </button>
            </div>

            {/* DESCRIPTION */}
            {openDescription === option.id && description && (
                <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 z-50">
                    <div
                        className="max-w-xs bg-neutral-800 text-gray-200 px-4 py-3 rounded border border-gray-500 text-center animate-pop-in"
                        style={{ boxShadow: "0 3px 0 rgba(0,0,0,0.9)" }}
                    >
                        {description}
                    </div>
                </div>
            )}
        </div>
    );
}

/* 🔒 MEMO COMPARATOR (unchanged, still valid) */
function areEqual(prev: Props, next: Props) {
    return (
        prev.option.id === next.option.id &&
        prev.index === next.index &&
        prev.state === next.state &&
        prev.openDescription === next.openDescription &&
        prev.activePluses === next.activePluses &&
        prev.activeVariant === next.activeVariant
    );
}

export default memo(OptionItem, areEqual);
