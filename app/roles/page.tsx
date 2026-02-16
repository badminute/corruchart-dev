"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

import { ROLES } from "@/data/roles";
import type { RoleOption } from "@/data/roles";
import { ROLE_SYMBOLS } from "@/data/roleSymbols";
import { DESCRIPTIONS } from "@/data/descriptions";
import { WelcomeSlideshow } from "@/components/onboarding";

export default function Page() {
    const options: RoleOption[] = ROLES;
    const [states, setStates] = useState<number[]>([]);
    const [query, setQuery] = useState("");
    const searchInputRef = useRef<HTMLInputElement>(null);
    const [colorFilter, setColorFilter] = useState<Set<number>>(new Set());
    const [openDescription, setOpenDescription] = useState<string | null>(null);
    const longPressTimer = useRef<number | null>(null);
    const longPressTriggered = useRef(false);
    const [activeVariant, setActiveVariant] = useState<Record<string, number>>({});
    const [isHolding, setIsHolding] = useState<string | null>(null);
    
    // WELCOME MODAL
    const [showWelcome, setShowWelcome] = useState(false);

    useEffect(() => {
        const hasSeenWelcome = localStorage.getItem("hasSeenWelcomeRoles");
        if (!hasSeenWelcome) {
            setShowWelcome(true);
        }
    }, []);

    const closeWelcome = () => {
        setShowWelcome(false);
        localStorage.setItem("hasSeenWelcomeRoles", "true");
    };
    // -----------------------

    const EXCLUSIVE_CATEGORIES = ["Sex Experience", "Sexual Orientation", "Body Count", "Hentai Doujinshi Read", "Hentai Anime Watched", "Hentai Games Played", "Porn Stash", "Porn Experience", "Gender", "Erotic Novels Read", "Sex", "Sex Roles", "Gender Expression"];
    const customColor: Record<string, string> = {
        "fire-pyrolagnia": "#f87171",
        "optionB": "#34d399",
    };

    useEffect(() => {
        const savedRaw = localStorage.getItem("combined-selections");
        if (!savedRaw) {
            setStates(Array(options.length).fill(0));
            return;
        }
        try {
            const saved: Record<string, string> = JSON.parse(savedRaw);
            setStates(options.map(role => (saved[role.id] === "like" ? 1 : 0)));
        } catch {
            setStates(Array(options.length).fill(0));
        }
    }, [options]);

    useEffect(() => {
        if (!states.length) return;
        const RESULTS_KEY = "combined-selections";
        const existingRaw = localStorage.getItem(RESULTS_KEY);
        const existing: Record<string, string> = existingRaw ? JSON.parse(existingRaw) : {};
        const selections = options.reduce((acc, role, i) => {
            acc[role.id] = states[i] === 1 ? "like" : "indifferent";
            return acc;
        }, {} as Record<string, string>);
        localStorage.setItem(RESULTS_KEY, JSON.stringify({ ...existing, ...selections }));
    }, [states, options]);

    useEffect(() => {
        const onKeyDown = (e: KeyboardEvent) => {
            const isMac = navigator.platform.toUpperCase().includes("MAC");
            const isFind = (isMac && e.metaKey && e.key === "f") || (!isMac && e.ctrlKey && e.key === "f");
            if (isFind) {
                e.preventDefault();
                searchInputRef.current?.focus();
                searchInputRef.current?.select();
            }
        };
        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, []);

    useEffect(() => {
        if (!openDescription) return;
        const timer = setTimeout(() => setOpenDescription(null), 7500);
        return () => clearTimeout(timer);
    }, [openDescription]);

    const cycleColor = (option: RoleOption) => {
        const actualIndex = options.findIndex(r => r.id === option.id);
        if (actualIndex === -1) return;

        setStates(prev => {
            const next = [...prev];
            const isCurrentlyActive = next[actualIndex] === 1;
            const exclusiveTag = option.tags.find(tag => EXCLUSIVE_CATEGORIES.includes(tag));

            if (exclusiveTag && !isCurrentlyActive) {
                options.forEach((otherOption, idx) => {
                    if (otherOption.tags.includes(exclusiveTag)) {
                        next[idx] = 0;
                    }
                });
                next[actualIndex] = 1;
            } else {
                next[actualIndex] = isCurrentlyActive ? 0 : 1;
            }
            return next;
        });
    };

    const resetAll = () => {
        if (confirm("Reset all selections to 'I do not identify as'?")) {
            setStates(Array(options.length).fill(0));
            setColorFilter(new Set());
        }
    };

    if (!states.length) return null;

    const variantGroups = options.reduce((acc, option) => {
        if (!option.variantGroup) return acc;
        if (!acc[option.variantGroup]) acc[option.variantGroup] = [];
        acc[option.variantGroup].push(option);
        return acc;
    }, {} as Record<string, RoleOption[]>);

    Object.values(variantGroups).forEach(group =>
        group.sort((a, b) => (a.variantOrder ?? 0) - (b.variantOrder ?? 0))
    );

    const filtered = options
        .filter(option => {
            if (!option.variantGroup) return true;
            const group = variantGroups[option.variantGroup];
            const activeIndex = activeVariant[option.variantGroup] ?? 0;
            return group?.[activeIndex]?.id === option.id;
        })
        .map(option => ({ option, actualIndex: options.findIndex(o => o.id === option.id) }))
        .filter(({ option, actualIndex }) => {
            const matchesQuery = option.label.toLowerCase().includes(query.toLowerCase());
            const matchesColor = colorFilter.size === 0 || colorFilter.has(states[actualIndex]);
            return matchesQuery && matchesColor;
        });

    const categoriesMap: Record<string, { option: RoleOption; actualIndex: number }[]> = {};
    filtered.forEach(({ option, actualIndex }) => {
        option.tags.forEach(tag => {
            if (!categoriesMap[tag]) categoriesMap[tag] = [];
            categoriesMap[tag].push({ option, actualIndex });
        });
    });

    const categoryOrder = ["Sex", "Sex Roles", "Gender", "Sexual Orientation", "Gender Expression", "Domination & Submission", "Bondage & Discipline", "Fun Roles", "BDSM Roles Misc.", "Sex Experience", "Body Count",];
    const categoryNames = Object.keys(categoriesMap).sort((a, b) => {
        const ia = categoryOrder.indexOf(a);
        const ib = categoryOrder.indexOf(b);
        if (ia !== -1 && ib !== -1) return ia - ib;
        if (ia !== -1) return -1;
        if (ib !== -1) return 1;
        return a.localeCompare(b);
    });

    return (
        <>
            {/* MODAL OVERLAY */}
            {showWelcome && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4">
                <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-2xl w-full max-w-4xl h-[650px] shadow-2xl flex flex-col">
                
                {/* Header */}
                <h2 className="text-2xl font-bold text-center text-violet-400 mb-4">
                    Roles Section
                </h2>

                {/* Description */}
                <div className="text-gray-400 text-center text-xl mb-4">
                    <p>Here are some usage tips to make things smoother.</p>
                </div>

                {/* Slideshow */}
                <div className="flex-1">
                    <WelcomeSlideshow 
                    images={[
                        "images/select-roles.gif", 
                        "images/role-descriptions.gif",
                        "images/swap-roles.gif",
                    ]} 
                    />
                </div>

                {/* Button */}
                <button
                    onClick={closeWelcome}
                    className="w-full py-3 mt-4 bg-neutral-800 hover:bg-violet-500/30 cursor-pointer text-white font-semibold rounded-xl transition-colors"
                >
                    ROLES
                </button>

                </div>
            </div>
            )}


            {/* ORIGINAL PAGE CONTENT */}
            <main className="min-h-screen px-8 pb-24 flex flex-col items-center" style={{ backgroundColor: "#1F2023" }}>
                {/* Controls */}
                <div className="py-4 space-y-3 w-full max-w-7xl">
                    <div className="flex items-center gap-4 flex-wrap justify-center">
                        <input
                            ref={searchInputRef}
                            value={query}
                            onChange={e => setQuery(e.target.value)}
                            placeholder="Search options…"
                            className="px-3 py-2 rounded bg-neutral-900 text-gray-100 placeholder-gray-400 outline-none w-64"
                        />
                        <button onClick={resetAll} className="px-4 py-2 rounded bg-neutral-900 cursor-pointer text-neutral-200 hover:bg-red-900/90">Reset All</button>
                        {/* Info/Help button */}
                        <button
                            type="button"
                            onClick={() => setShowWelcome(true)}
                            className="px-4 py-2.5 rounded bg-neutral-900 text-neutral-400 hover:bg-neutral-800 cursor-pointer flex items-center justify-center text-sm gap-1"
                        >
                            <span className="font-bold text-white">Tips</span>
                        </button>
                        <Link href="/results" className="px-4 py-2 rounded bg-neutral-900 text-neutral-200 hover:bg-violet-500/30">Results</Link>
                        <span className="text-gray-400">Showing {filtered.length} / {options.length}</span>
                    </div>
                </div>

                {/* Roles grid */}
                <div className="w-full max-w-6xl mx-auto columns-1 md:columns-2 lg:columns-3 gap-4">
                    {categoryNames.map(category => (
                        <div key={category} className="w-full break-inside-avoid mb-4" style={{ border: "1px solid rgba(255,255,255,0.1)", padding: 12, borderRadius: 8 }}>
                            <h2 className="text-xl font-semibold mb-2 text-center" style={{ color: "#D3D3D3", textShadow: "0 3px 2px rgba(0,0,0,0.6)" }}>
                                {category}
                            </h2>

                            <div className="space-y-1">
                                {categoriesMap[category].map(({ option, actualIndex }) => {
                                    const description = DESCRIPTIONS[option.id];
                                    const isTooltipVisible = openDescription === option.id;
                                    const variantIndex = activeVariant[option.variantGroup ?? ""] ?? 0;

                                    return (
                                        <div key={`${option.id}-variant-${variantIndex}`} className="relative w-full">
                                            <div className="group flex items-center w-full relative">
                                                <span
                                                    className={`absolute inset-y-0 left-10 right-0 bg-violet-400/20 origin-left scale-x-0 transition-transform duration-[400ms] pointer-events-none ${isHolding === option.id ? "scale-x-100" : ""}`}
                                                />

                                                <button
                                                type="button"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    cycleColor(option);
                                                    setOpenDescription(null);
                                                }}
                                                className="flex-shrink-0 w-7 h-7 mr-3 flex items-center justify-center rounded cursor-pointer relative z-10 bg-transparent"
                                                style={{
                                                    fontSize: 18,
                                                    color: (() => {
                                                        const symbol = ROLE_SYMBOLS[option.id]?.symbol;
                                                        switch (symbol) {
                                                            case "TRANS_FLAG": return "#55CDFC";
                                                            case "GAY_FLAG": return "#ff0018";
                                                            case "LESBIAN_FLAG": return "#d52d00";
                                                            case "BI_FLAG": return "#d60270";
                                                            case "PAN_FLAG": return "#ff218c";
                                                            case "ACE_FLAG": return "#000000";
                                                            case "ARO_FLAG": return "#3eb489";
                                                            case "DEMI_FLAG": return "#800080";
                                                            default: return ROLE_SYMBOLS[option.id]?.color ?? "#b1b1b1";
                                                        }
                                                    })(),
                                                    opacity: states[actualIndex] === 1 ? 1 : 0.4,
                                                }}

                                                >
                                                {(() => {
                                                    const symbol = ROLE_SYMBOLS[option.id]?.symbol;

                                                    const FLAG_MAP: Record<string, string> = {
                                                    TRANS_FLAG: "/icons/trans-flag.svg",
                                                    NONBINARY_FLAG: "/icons/nonbinary-flag.svg",
                                                    STRAIGHT_FLAG: "/icons/straight-flag.svg",
                                                    GAY_FLAG: "/icons/gay-flag.svg",
                                                    LESBIAN_FLAG: "/icons/lesbian-flag.svg",
                                                    BI_FLAG: "/icons/bisexual-flag.svg",
                                                    PAN_FLAG: "/icons/pansexual-flag.svg",
                                                    ACE_FLAG: "/icons/asexual-flag.svg",
                                                    ARO_FLAG: "/icons/aromantic-flag.svg",
                                                    DEMI_FLAG: "/icons/demisexual-flag.svg",
                                                    };

                                                    if (symbol && FLAG_MAP[symbol]) {
                                                    return (
                                                        <img
                                                        src={FLAG_MAP[symbol]}
                                                        alt={symbol.replace("_FLAG", "").toLowerCase()}
                                                        style={{
                                                            width: 18,
                                                            height: 12,
                                                            display: "inline-block",
                                                            verticalAlign: "middle",
                                                        }}
                                                        />
                                                    );
                                                    }

                                                    return symbol ?? "★";
                                                })()}
                                                </button>


                                            <button
                                                type="button"
                                                className="flex items-center cursor-pointer gap-2 flex-1 relative z-10 text-left px-3 py-2 rounded-md overflow-hidden min-w-0"
                                                onPointerDown={() => {
                                                    longPressTriggered.current = false;
                                                    const holdDelayTimer = window.setTimeout(() => setIsHolding(option.id), 100);
                                                    const swapTimer = window.setTimeout(() => {
                                                        longPressTriggered.current = true;
                                                        setIsHolding(null);
                                                        if (option.variantGroup) {
                                                            const group = option.variantGroup;
                                                            const groupOptions = variantGroups[group];
                                                            const nextIndex = ((activeVariant[group] ?? 0) + 1) % groupOptions.length;
                                                            setActiveVariant(prev => ({ ...prev, [group]: nextIndex }));
                                                        }
                                                    }, 450);
                                                    longPressTimer.current = holdDelayTimer;
                                                    (longPressTimer as any).swapTimer = swapTimer;
                                                }}
                                                onPointerUp={() => { clearTimeout(longPressTimer.current); clearTimeout((longPressTimer as any).swapTimer); setIsHolding(null); }}
                                                onPointerLeave={() => { clearTimeout(longPressTimer.current); clearTimeout((longPressTimer as any).swapTimer); setIsHolding(null); }}
                                                onPointerCancel={() => { clearTimeout(longPressTimer.current); clearTimeout((longPressTimer as any).swapTimer); setIsHolding(null); }}
                                                onClick={() => {
                                                    if (longPressTriggered.current) return;
                                                    setOpenDescription(prev => prev === option.id ? null : option.id);
                                                }}
                                            >
                                                <span
                                                className="truncate block w-full"
                                                style={{
                                                    color: states[actualIndex] === 1
                                                        ? (() => {
                                                            const symbol = ROLE_SYMBOLS[option.id]?.symbol;

                                                            // Custom overrides for specific roles
                                                            if (symbol === "TRANS_FLAG") {
                                                                if (option.id === "man-transgender") return "#55CDFC";       // Light blue for trans men
                                                                if (option.id === "woman-transgender") return "#d792d7";    // Pink for trans women
                                                                return "#A3A3A3"; // Default color for other trans roles
                                                            }

                                                            // All other flags
                                                            switch (symbol) {
                                                                case "NONBINARY_FLAG": return "#9C59D1";
                                                                case "GAY_FLAG": return "#26CEAA";
                                                                case "LESBIAN_FLAG": return "#d52d00";
                                                                case "BI_FLAG": return "#d60270";
                                                                case "PAN_FLAG": return "#ff218c";
                                                                case "ACE_FLAG": return "#800080";
                                                                case "ARO_FLAG": return "#3eb489";
                                                                case "DEMI_FLAG": return "#800080";
                                                                default: return ROLE_SYMBOLS[option.id]?.color ?? "#b1b1b1";
                                                            }
                                                        })()
                                                        : "#aaa",
                                                    opacity: states[actualIndex] === 1 ? 1 : 0.55,
                                                    filter: states[actualIndex] === 1 ? "none" : "grayscale(100%) brightness(60%)",
                                                    textShadow: "0 2px 4px rgba(0,0,0,0.3)",
                                                    display: "inline-block"
                                                }}
                                            >

                                                    {option.label}
                                                </span>

                                            </button>

                                                {option.variantGroup && variantGroups[option.variantGroup]?.length > 1 && (
                                                    <button
                                                        type="button"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            const group = option.variantGroup!;
                                                            const groupOptions = variantGroups[group];
                                                            const nextIndex = ((activeVariant[group] ?? 0) + 1) % groupOptions.length;
                                                            setActiveVariant(prev => ({ ...prev, [group]: nextIndex }));
                                                        }}
                                                        className="absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center text-xs bg-neutral-800 text-gray-300 border border-neutral-600 rounded-full cursor-pointer opacity-30 hover:opacity-100 transition-opacity z-10"
                                                        title="Swap variant"
                                                    >
                                                        ⇄
                                                    </button>
                                                )}
                                            </div>

                                    {isTooltipVisible && description && (
                                    <div 
                                        className="absolute bottom-full mb-2 left-3/4 -translate-x-1/2 w-[220px] max-w-xs rounded-md bg-neutral-800 text-gray-200 text-xs px-4 py-3 text-center z-50 shadow-md break-inside-avoid border border-neutral-600"
                                        style={{ 
                                        display: 'table',
                                        breakInside: 'avoid',
                                        transform: 'translateX(-50%) translateZ(10px)', 
                                        backfaceVisibility: 'hidden',
                                        isolation: 'isolate',
                                        whiteSpace: 'normal',
                                        } as any}
                                    >
                                        <div style={{ display: 'block' }}>
                                        <div>{description}</div>
                                        {option.aka && option.aka.length > 0 && (
                                            <div className="mt-2 pt-2 border-t border-neutral-700 text-gray-400">
                                            <span className="font-semibold text-gray-300">AKAs:</span>{" "}
                                            {option.aka.join(", ")}
                                            </div>
                                        )}
                                        </div>
                                        <div className="absolute top-full left-1/8 -translate-x-1/2">
                                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[6px] border-t-neutral-800" />
                                        </div>
                                    </div>
                                    )}

                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            </main>
        </>
    );
}