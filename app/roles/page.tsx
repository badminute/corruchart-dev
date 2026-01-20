"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

import { ROLES } from "@/data/roles";
import type { Option } from "@/types/option";
import { ROLE_SYMBOLS, } from "@/data/roleSymbols"; 
import { DESCRIPTIONS } from "@/data/descriptions";
import type { RoleOption } from "@/data/roles";

export default function Page() {
    const options: RoleOption[] = ROLES;
    const [states, setStates] = useState<number[]>([]);
    const [query, setQuery] = useState("");
    const searchInputRef = useRef<HTMLInputElement>(null);
    const [colorFilter, setColorFilter] = useState<Set<number>>(new Set());
    const [openDescription, setOpenDescription] = useState<string | null>(null);
    const longPressTimer = useRef<number | null>(null);
    const longPressTriggered = useRef(false);

    const STATE_TO_VALUE = ["indifferent", "like"]; // for roles being off/on

    const startLongPress = (optionId: string) => {
        longPressTriggered.current = false;

        longPressTimer.current = window.setTimeout(() => {
            longPressTriggered.current = true;
            setOpenDescription(prev =>
                prev === optionId ? null : optionId
            );
        }, 450);
    };

    const cancelLongPress = () => {
        if (longPressTimer.current) {
            clearTimeout(longPressTimer.current);
            longPressTimer.current = null;
        }
    };
    

    // Auto-hide tooltip after 20 seconds
    useEffect(() => {
        if (openDescription) {
            const timer = setTimeout(() => setOpenDescription(null), 7500);
            return () => clearTimeout(timer); // cleanup if tooltip closes early
        }
    }, [openDescription]);

    /** Load persisted state from combined-selections */
    useEffect(() => {
        const savedRaw = localStorage.getItem("combined-selections");
        if (!savedRaw) {
            setStates(Array(options.length).fill(0));
            return;
        }

        try {
            const saved: Record<string, string> = JSON.parse(savedRaw);

            const initialStates = options.map((role) => {
                const reaction = saved[role.id] ?? "indifferent";

                switch (reaction) {
                    case "like":
                        return 1;
                    default:
                        return 0; // indifferent / off
                }
            });

            setStates(initialStates);
        } catch {
            setStates(Array(options.length).fill(0));
        }
    }, [options]);
    

    // Persist semantic selections for results page (merge with existing)
    useEffect(() => {
        if (!states.length) return;

        const RESULTS_KEY = "combined-selections";

        // Load existing combined selections
        const existingRaw = localStorage.getItem(RESULTS_KEY);
        const existing: Record<string, string> = existingRaw ? JSON.parse(existingRaw) : {};

        // Current page selections
        const selections = options.reduce((acc, role, i) => {
            acc[role.id] = states[i] === 1 ? "like" : "indifferent";
            return acc;
        }, {} as Record<string, string>);

        // Merge and save
        const merged = { ...existing, ...selections };
        localStorage.setItem(RESULTS_KEY, JSON.stringify(merged));
    }, [states, options]);
    


    useEffect(() => {
        const onKeyDown = (e: KeyboardEvent) => {
            const isMac = navigator.platform.toUpperCase().includes("MAC");
            const isFind =
                (isMac && e.metaKey && e.key === "f") ||
                (!isMac && e.ctrlKey && e.key === "f");

            if (isFind) {
                e.preventDefault(); // stop browser find
                searchInputRef.current?.focus();
                searchInputRef.current?.select();
            }
        };

        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, []);    

    /** Persist semantic selections for results page (merge with existing) */
    useEffect(() => {
        if (!states.length) return;

        const RESULTS_KEY = "combined-selections";

        // Load existing combined selections
        const existingRaw = localStorage.getItem(RESULTS_KEY);
        const existing: Record<string, string> = existingRaw ? JSON.parse(existingRaw) : {};

        // Current page selections (Roles only)
        const selections = options.reduce((acc, role, i) => {
            acc[role.id] = states[i] === 1 ? "like" : "indifferent";
            return acc;
        }, {} as Record<string, string>);

        // Merge with existing to avoid overwriting CorruChart selections
        const merged = { ...existing, ...selections };

        localStorage.setItem(RESULTS_KEY, JSON.stringify(merged));
    }, [states, options]);
    

    /** Cycle color */
    const cycleColor = (index: number) => {
        setStates((prev) => {
            const next = [...prev];
            next[index] = next[index] === 1 ? 0 : 1; // simple on/off
            return next;
        });
    };

    const toggleColor = (colorIndex: number) => {
        const next = new Set(colorFilter);
        next.has(colorIndex) ? next.delete(colorIndex) : next.add(colorIndex);
        setColorFilter(next);
    };

    const resetAll = () => {
        if (confirm("Reset all selections to 'I do not identify as'?")) {
            setStates(Array(options.length).fill(0));
            setColorFilter(new Set());
        }
    };

    if (!states.length) return null;

    /** Filter options */
    const filtered = options
        .map((option, index) => ({ option, index }))
        .filter(({ option, index }) => {
            const matchesQuery = option.label
                .toLowerCase()
                .includes(query.toLowerCase());
            const matchesColor =
                colorFilter.size === 0 || colorFilter.has(states[index]);
            return matchesQuery && matchesColor;
        });

    /** Group by category */
    const categoriesMap: Record<
        string,
        { option: Option; index: number }[]
    > = {};

    filtered.forEach(({ option, index }) => {
        option.tags.forEach((cat) => {
            if (!categoriesMap[cat]) categoriesMap[cat] = [];
            categoriesMap[cat].push({ option, index });
        });
    });

    const categoryOrder = [
        "Sex Role",
        "BDSM Role",
        "Sexual Orientation",
        "Sex",
    ];

    const categoryNames = Object.keys(categoriesMap).sort((a, b) => {
        const ia = categoryOrder.indexOf(a);
        const ib = categoryOrder.indexOf(b);
        if (ia !== -1 && ib !== -1) return ia - ib;
        if (ia !== -1) return -1;
        if (ib !== -1) return 1;
        return a.localeCompare(b);
    });

    return (
        <main
            className="min-h-screen px-8 flex flex-col items-center"
            style={{ backgroundColor: "#1F2023" }}
        >
            {/* Controls */}
            <div className="py-4 space-y-3 w-full max-w-7xl">
                <div className="flex items-center gap-4 flex-wrap justify-center">
                    <input
                        ref={searchInputRef}
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Search options…"
                        className="px-3 py-2 rounded bg-neutral-900 text-gray-100 placeholder-gray-400 outline-none w-64"
                    />

                    <button
                        onClick={resetAll}
                        className="px-4 py-2 rounded bg-neutral-900 cursor-pointer text-neutral-200 hover:bg-red-900/90"
                    >
                        Reset All
                    </button>

                    <Link
                        href="/results"
                        className="px-4 py-2 rounded bg-neutral-900 text-neutral-200 hover:bg-violet-700/50"
                    >
                        Results
                    </Link>

                    <span className="text-gray-400">
                        Showing {filtered.length} / {options.length}
                    </span>
                </div>
            </div>

            <div
                className="w-full max-w-6xl mx-auto columns-1 md:columns-2 lg:columns-3 gap-4"
                style={{
                    gridAutoFlow: "dense",
                    backgroundColor: "#1F2023",
                }}
            >
                {categoryNames.map((category) => (
                    <div
                        key={category}
                        className="w-full break-inside-avoid mb-4"
                        style={{
                            border: "1px solid rgba(255,255,255,0.1)",
                            padding: "12px",
                            borderRadius: "8px",
                        }}
                    >
                        <h2
                            className="text-xl font-semibold mb-2 text-center"
                            style={{
                                color: "#D3D3D3",
                                textShadow: "0 3px 2px rgba(0,0,0,0.6)",
                            }}
                        >
                            {category}
                        </h2>

                        {/* COMPACT LIST */}
                        <div className="space-y-1">
                            {categoriesMap[category].map(({ option, index }) => {
                                const description = DESCRIPTIONS[option.id];
                                const isTooltipVisible = openDescription === option.id;

                                const startLongPress = () => {
                                    longPressTimer.current = window.setTimeout(() => {
                                        setOpenDescription(option.id);
                                    }, 450);
                                };

                                const cancelLongPress = () => {
                                    if (longPressTimer.current) {
                                        clearTimeout(longPressTimer.current);
                                        longPressTimer.current = null;
                                    }
                                };

                                const handleClick = () => {
                                    // Only toggle role if tooltip wasn't triggered
                                    if (!isTooltipVisible) cycleColor(index);
                                    setOpenDescription(null); // hide tooltip after click
                                };

                                return (
                                    <button
                                        key={option.id}
                                        onClick={handleClick}
                                        onPointerDown={startLongPress}
                                        onPointerUp={cancelLongPress}
                                        onPointerLeave={cancelLongPress}
                                        onPointerCancel={cancelLongPress}
                                        className="group flex items-center gap-3 px-3 py-2 w-full rounded-md cursor-pointer text-left transition hover:bg-white/5 relative"
                                    >
                                        {/* Role symbol */}
                                        <span
                                            className="flex-shrink-0 w-6 text-center font-bold"
                                            style={{
                                                fontSize: "18px",
                                                color: states[index] === 1
                                                    ? ROLE_SYMBOLS[option.id]?.color ?? "#b1b1b1"
                                                    : "#555",
                                                opacity: states[index] === 1 ? 1 : 0.35,
                                                filter: states[index] === 1
                                                    ? "none"
                                                    : "grayscale(100%) brightness(70%)",
                                            }}
                                        >
                                            {ROLE_SYMBOLS[option.id]?.symbol ?? "★"}
                                        </span>

                                        {/* Label + tooltip */}
                                        <span
                                            className="relative text-sm pr-6 flex items-start"
                                            style={{
                                                color: states[index] === 1
                                                    ? ROLE_SYMBOLS[option.id]?.color ?? "#b1b1b1" // active role color
                                                    : "#aaa",                                     // inactive/faded
                                                transition: "all 0.2s ease-in-out",
                                            }}
                                        >
                                            {option.label}

                                            {description && (
                                                <span
                                                    className="
                                                    absolute top-[-0.5rem] right-1.75
                                                    w-4 h-4
                                                    flex items-center justify-center
                                                    rounded-full
                                                    text-[9px] font-bold
                                                    bg-neutral-800 text-gray-300
                                                    border border-neutral-600
                                                    cursor-pointer
                                                    opacity-0
                                                    group-hover:opacity-100
                                                    transition-opacity
                                                "
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setOpenDescription(prev => prev === option.id ? null : option.id);
                                                    }}
                                                >
                                                    ?
                                                </span>
                                            )}

                                            {/* Tooltip */}
                                            {description && (
                                                <div
                                                    className={`
                                                    absolute bottom-full mb-2 left-1/2 -translate-x-0/2
                                                    w-max max-w-xs
                                                    rounded-md bg-neutral-800 text-gray-200 text-xs px-4 py-2
                                                    text-center
                                                    pointer-events-none
                                                    transition-opacity duration-150
                                                    z-50
                                                    ${isTooltipVisible ? "opacity-100" : "opacity-0"}
                                                `}
                                                >
                                                    {description}
                                                </div>
                                            )}
                                        </span>

                                    </button>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>
        </main>
    );
}
