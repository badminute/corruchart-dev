"use client";

import { memo, useRef, useState, useLayoutEffect } from "react";

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

// Haptic feedback helper with pattern support
function triggerHaptic(pattern: number | number[] = 50) {
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
        navigator.vibrate(pattern);
    } else {
        console.log("Haptic triggered:", pattern); // for desktop testing
    }
}

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
    const [tooltipPlacement, setTooltipPlacement] = useState<"top" | "bottom">("top");
    const [tooltipOffsetX, setTooltipOffsetX] = useState(0);
    const tooltipRef = useRef<HTMLDivElement | null>(null);

    // Customize potion widths and heights here
    const potionSizes: Record<number, { width: string; height: string }> = {
        5: { width: "35px", height: "35px" }, // large
        6: { width: "35px", height: "35px" }, // large
        4: { width: "20px", height: "30px" }, // medium
        0: { width: "12px", height: "28px" }, // small (default category)
    };

    useLayoutEffect(() => {
        if (openDescription !== option.id) return;
        if (!tooltipRef.current) return;

        // defer until next paint so Tailwind width/line wraps are applied
        requestAnimationFrame(() => {
            const rect = tooltipRef.current!.getBoundingClientRect();
            const padding = 8;

            // ---- Vertical clamp ----
            if (rect.top < padding) {
                setTooltipPlacement("bottom");
            } else if (rect.bottom > window.innerHeight - padding) {
                setTooltipPlacement("top");
            }

            // ---- Horizontal clamp ----
            let offsetX = 0;
            if (rect.left < padding) {
                offsetX = padding - rect.left;
            } else if (rect.right > window.innerWidth - padding) {
                offsetX = (window.innerWidth - padding) - rect.right;
            }

            setTooltipOffsetX(offsetX);
        });
    }, [openDescription, option.id]);


    const customColor: Record<string, string> = {
        "scat": "#785023", // poo poo
        // "optionB": "#34d399", // 
    };

    const customGradients: Record<string, string> = {
        "trans-porn": "linear-gradient(90deg, #5BCEFA, #F5A9B8, #FFFFFF, #F5A9B8, #5BCEFA)", // trans porn
        // "optionB": "linear-gradient(90deg, #34d399, #3b82f6)", //
    };

    // Pick gradient or fallback color
    const gradient = customGradients[option.id];
    const solid = customColor[option.id] ?? (
        option.category === 5 ? "#a56ddd" :
            option.category === 6 ? "#6770c2" :
                "#9F86D8"
    );

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
                            .map(p => {
                                const size = potionSizes[option.category] || potionSizes[0]; // fallback to small
                                return (
                                    <img
                                        key={p.id}
                                        src={getPlusImage(option, p.state)}
                                        className="absolute -top-6 -right-3 pointer-events-none animate-pop-plus"
                                        style={{
                                            width: size.width,
                                            height: size.height,
                                        }}
                                    />
                                );
                            })}


                        {slot.options.length > 1 && (
                            <span
                                className="absolute -top-1 -left-1 text-[12px] text-gray-400 cursor-pointer select-none z-10"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setActiveVariant(prev => {
                                        const updated = {
                                            ...prev,
                                            [slot.slotId]: ((prev[slot.slotId] ?? 0) + 1) % slot.options.length,
                                        };
                                        triggerHaptic([30, 20, 30]); // long press pattern
                                        return updated;
                                    });
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
                    style={
                        gradient
                            ? {
                                background: gradient,
                                WebkitBackgroundClip: "text",
                                WebkitTextFillColor: "transparent",
                            }
                            : { color: solid }
                    }
                    onPointerDown={() => {
                        if (slot.options.length <= 1) return;

                        didLongPressRef.current = false;
                        labelRef.current?.classList.add("holding");

                        holdTimerRef.current = setTimeout(() => {
                            didLongPressRef.current = true;
                            labelRef.current?.classList.remove("holding");

                            setActiveVariant(prev => {
                                const updated = {
                                    ...prev,
                                    [slot.slotId]: ((prev[slot.slotId] ?? 0) + 1) % slot.options.length,
                                };
                                triggerHaptic(50); // short click vibration
                                return updated;
                            });
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

                    const isOpening = openDescription !== option.id;

                    if (!isOpening) {
                        // Reset tooltip state when closing
                        setTooltipPlacement("top");
                        setTooltipOffsetX(0);
                    }

                    setOpenDescription(isOpening ? option.id : null);

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
                <div
                    ref={tooltipRef}
                    className={`
                        absolute
                        ${tooltipPlacement === "top"
                            ? "bottom-full mb-2"
                            : "top-full mt-2"}
                        left-1/2 -translate-x-1/2
                        z-50
                    `}
                    style={{
                        transform: `translateX(calc(-50% + ${tooltipOffsetX}px))`,
                    }}
                >

                    <div
                        className="
                                w-max
                                max-w-[90vw]
                                sm:max-w-md
                                md:max-w-lg
                                bg-neutral-800
                                text-gray-200
                                px-4 py-3
                                rounded
                                border border-gray-500
                                text-center
                                animate-pop-in
                            "
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
