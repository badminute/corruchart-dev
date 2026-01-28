"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

import { ROLES } from "@/data/roles";
import type { RoleOption } from "@/data/roles";
import { ROLE_SYMBOLS } from "@/data/roleSymbols"; 
import { DESCRIPTIONS } from "@/data/descriptions";

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

  // Load saved states from localStorage
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

  // Persist states to localStorage
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

  // Auto-focus search on Ctrl+F / Cmd+F
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().includes("MAC");
      const isFind =
        (isMac && e.metaKey && e.key === "f") ||
        (!isMac && e.ctrlKey && e.key === "f");

      if (isFind) {
        e.preventDefault();
        searchInputRef.current?.focus();
        searchInputRef.current?.select();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  // Auto-hide tooltip after 7.5s
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
      next[actualIndex] = next[actualIndex] === 1 ? 0 : 1;
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

  const categoryOrder = ["Sex Role", "BDSM Role", "Sexual Orientation", "Sex"];
  const categoryNames = Object.keys(categoriesMap).sort((a, b) => {
    const ia = categoryOrder.indexOf(a);
    const ib = categoryOrder.indexOf(b);
    if (ia !== -1 && ib !== -1) return ia - ib;
    if (ia !== -1) return -1;
    if (ib !== -1) return 1;
    return a.localeCompare(b);
  });

  return (
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
          <Link href="/results" className="px-4 py-2 rounded bg-neutral-900 text-neutral-200 hover:bg-violet-700/50">Results</Link>
          <span className="text-gray-400">Showing {filtered.length} / {options.length}</span>
        </div>
      </div>

      {/* Roles grid */}
      <div className="w-full max-w-6xl mx-auto columns-1 md:columns-2 lg:columns-3 gap-4" style={{ gridAutoFlow: "dense" }}>
        {categoryNames.map(category => (
          <div key={category} className="w-full break-inside-avoid mb-4" style={{ border: "1px solid rgba(255,255,255,0.1)", padding: 12, borderRadius: 8 }}>
            <h2 className="text-xl font-semibold mb-2 text-center" style={{ color: "#D3D3D3", textShadow: "0 3px 2px rgba(0,0,0,0.6)" }}>
              {category}
            </h2>

                <div className="space-y-1">
                    {categoriesMap[category].map(({ option, actualIndex }) => {
                        const description = DESCRIPTIONS[option.id];
                        const isTooltipVisible = openDescription === option.id;

                        return (
                            <div key={option.id} className="relative w-full">
                                {/* Main button */}
                                <button
                                    className="group flex items-center justify-between px-3 py-2 w-full rounded-md cursor-pointer text-left"
                                    onPointerDown={() => {
                                        longPressTriggered.current = false;

                                        // 100ms delay before showing the purple hold overlay
                                        const holdDelayTimer = window.setTimeout(() => setIsHolding(option.id), 100);

                                        // 400ms long-press timer (tooltip)
                                        const longPressTimerId = window.setTimeout(() => {
                                            longPressTriggered.current = true;
                                            setOpenDescription(option.id);
                                            setIsHolding(null);
                                        }, 400);

                                        // Save both timers so we can cancel them on pointer up/leave
                                        longPressTimer.current = holdDelayTimer;
                                        (longPressTimer as any).longPressId = longPressTimerId;
                                    }}
                                    onPointerUp={() => {
                                        clearTimeout(longPressTimer.current);
                                        clearTimeout((longPressTimer as any).longPressId);
                                        setIsHolding(null);
                                    }}
                                    onPointerLeave={() => {
                                        clearTimeout(longPressTimer.current);
                                        clearTimeout((longPressTimer as any).longPressId);
                                        setIsHolding(null);
                                    }}
                                    onPointerCancel={() => {
                                        clearTimeout(longPressTimer.current);
                                        clearTimeout((longPressTimer as any).longPressId);
                                        setIsHolding(null);
                                    }}
                                    onClick={(e) => {
                                        if (longPressTriggered.current) return; // ignore if long-press just triggered
                                        if (!(e.target as HTMLElement).closest(".description-toggle")) {
                                            cycleColor(option);       // cycle the star
                                            setOpenDescription(null); // close tooltip if open
                                        }
                                    
                                    }}

                                >
                                    {/* Purple hold overlay */}
                                    <span
                                        className={`absolute inset-0 bg-violet-400/20 origin-left scale-x-0 transition-transform duration-[400ms] pointer-events-none ${isHolding === option.id ? "scale-x-100" : ""
                                            }`}
                                    ></span>

                                    {/* Role symbol */}
                                    <span
                                        className="flex-shrink-0 w-6 text-center font-bold mr-3 transition-all relative z-10"
                                        style={{
                                            fontSize: 18,
                                            color:
                                                states[actualIndex] === 1
                                                    ? ROLE_SYMBOLS[option.id]?.color ?? "#b1b1b1"
                                                    : "#777",
                                            opacity: states[actualIndex] === 1 ? 1 : 0.4,
                                            filter:
                                                states[actualIndex] === 1 ? "none" : "grayscale(100%) brightness(65%)",
                                        }}
                                    >
                                        {ROLE_SYMBOLS[option.id]?.symbol ?? "★"}
                                    </span>

                                    {/* Label + ? */}
                                    <span className="flex items-center gap-2 flex-1 relative z-10">
                                        <span
                                            className="whitespace-nowrap"
                                            style={{
                                                color:
                                                    states[actualIndex] === 1
                                                        ? ROLE_SYMBOLS[option.id]?.color ?? "#b1b1b1"
                                                        : "#aaa",
                                                opacity: states[actualIndex] === 1 ? 1 : 0.55,
                                                textShadow: "0 2px 4px rgba(0,0,0,0.3)",
                                            }}
                                        >
                                            {option.label}
                                        </span>

                                        {description && (
                                            <span
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setOpenDescription((prev) => (prev === option.id ? null : option.id));
                                                }}
                                                className="description-toggle w-5 h-5 flex items-center justify-center text-[9px] font-bold bg-neutral-800 text-gray-300 border border-neutral-600 rounded-full cursor-pointer transition-opacity opacity-0 group-hover:opacity-100"
                                                title="Show description"
                                            >
                                                ?
                                            </span>
                                        )}
                                    </span>
                                </button>

                                    {/* Swap button — absolutely positioned far right (outside main button) */}
                                    {option.variantGroup && variantGroups[option.variantGroup]?.length > 1 && (
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                const group = option.variantGroup!;
                                                const groupOptions = variantGroups[group];
                                                const size = groupOptions.length;
                                                const nextIndex = ((activeVariant[group] ?? 0) + 1) % size;
                                                setActiveVariant((prev) => ({ ...prev, [group]: nextIndex }));
                                            }}
                                            className="absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center text-xs bg-neutral-800 text-gray-300 border border-neutral-600 rounded-full cursor-pointer opacity-30 hover:opacity-100 transition-opacity z-10"
                                            title="Swap variant"
                                        >
                                            ⇄
                                        </button>
                                    )}

                                {/* Tooltip OUTSIDE button */}
                                {isTooltipVisible && description && (
                                    <div
                                        className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 w-[220px] max-w-xs rounded-md bg-neutral-800 text-gray-200 text-xs px-4 py-3 text-center whitespace-normal z-50 shadow-lg"
                                    >
                                        <div>{description}</div>
                                        {option.aka?.length > 0 && (
                                            <div className="mt-2 pt-2 border-t border-neutral-700 text-gray-400">
                                                <span className="font-semibold text-gray-300">AKAs:</span>{" "}
                                                {option.aka.join(", ")}
                                            </div>
                                        )}
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
  );
}
