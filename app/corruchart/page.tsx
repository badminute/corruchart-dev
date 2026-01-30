"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";

import type { OptionData as Option } from "@/data/options";
import { GROUPS } from "@/data/groups";
import { OPTIONS } from "@/data/options";
import { DESCRIPTIONS } from "@/data/descriptions";
import SettingsButton from "@/components/SettingsButton";
import OptionsGrid from "@/components/OptionsGrid";

// import base type
import type { OptionData as BaseOption } from "@/data/options";

// define extended type
type OptionWithCategory = BaseOption & {
    category: number;
    tags: string[];
    aka?: string[];
};

type GroupState = "include" | "exclude";

/** html2canvas-safe hex colors */
const COLOR_HEX = [
  "#828282ff", // Indifferent
  "#e74c3c",   // Disgust
  "#fc8d59",   // Dislike
  "#27ae60",   // Like
  "#37bdf6ff", // Love
  "#c88de8ff", // Lust
];

const COLOR_NAMES = [
  "indifferent",
  "disgust",
  "dislike",
  "like",
  "love",
  "lust",
] as const;

const RESULTS_KEY = "combined-selections";


const STATE_TO_VALUE = [
  "indifferent",
  "disgust",
  "dislike",
  "like",
  "love",
  "lust",
] as const;

export default function Page() {
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Progressive group filter state
  const [showAllGroups, setShowAllGroups] = useState(false);
  const INITIAL_VISIBLE_GROUPS = 6;
  const visibleGroups = showAllGroups ? GROUPS : GROUPS.slice(0, INITIAL_VISIBLE_GROUPS);

  useEffect(() => {
      const handler = (e: KeyboardEvent) => {
          const isMac = navigator.platform.toUpperCase().includes("MAC");
          const modifier = isMac ? e.metaKey : e.ctrlKey;

          if (!modifier) return;
          if (e.key.toLowerCase() !== "f") return;

          e.preventDefault(); // stop browser find
          e.stopPropagation(); // extra safety
          searchInputRef.current?.focus();
          searchInputRef.current?.select();
      };

      document.addEventListener("keydown", handler);
      return () => document.removeEventListener("keydown", handler);
}, []);

  /** Normalize OPTIONS tags */
    const options: OptionWithCategory[] = useMemo(
        () =>
            OPTIONS.map((opt) => ({
                ...opt,
                tags:
                    (opt.tags as (string | number)[] | undefined)?.map((tag) => {
                        if (typeof tag === "number") return GROUPS[tag - 1]?.id || "general";
                        return tag;
                    }) || ["general"],
                aka: opt.aka?.map((a) => a.toLowerCase()) || [],
            })),
        []
    );

    type OptionSlot = {
        slotId: string;
        options: OptionWithCategory[];
    };

    const slots: OptionSlot[] = useMemo(() => {
        const map = new Map<string, OptionWithCategory[]>();

        options.forEach((opt) => {
            const key = opt.variantGroup ?? opt.id;
            if (!map.has(key)) map.set(key, []);
            map.get(key)!.push(opt);
        });

        return Array.from(map.entries()).map(([slotId, opts]) => ({
            slotId,
            options: opts.sort(
                (a, b) => (a.variantOrder ?? 0) - (b.variantOrder ?? 0)
            ),
        }));
    }, [options]);


    const [isHolding, setIsHolding] = useState<string | null>(null);
    const holdTimerRef = useRef<NodeJS.Timeout | null>(null);
    const didLongPressRef = useRef(false);
    const [states, setStates] = useState<number[]>([]);
    const [query, setQuery] = useState("");
    const [colorFilter, setColorFilter] = useState<Set<number>>(new Set());
    const [groupStates, setGroupStates] = useState<Record<string, GroupState>>({});
    const [showCategory6, setShowCategory6] = useState(false);
    const [openDescription, setOpenDescription] = useState<string | null>(null);
    const [activeVariant, setActiveVariant] = useState<Record<string, number>>({});
    type ActivePlus = { index: number; id: string; state: number }; // ✅ must include state
  const [activePluses, setActivePluses] = useState<ActivePlus[]>([]);
    const optionIndexById = useMemo(() => {
        const map: Record<string, number> = {};
        options.forEach((opt, i) => {
            map[opt.id] = i;
        });
        return map;
    }, [options]);
  

  /** SET ALL TO (Forbidden only) */
  const [setAllState, setSetAllState] = useState(0);

  const cycleSetAllState = () => {
    setSetAllState((prev) => (prev + 1) % COLOR_HEX.length);
  };

  const applySetAllState = () => {
    const colorName = COLOR_NAMES[setAllState];

    if (
      !confirm(
        `Set ALL VISIBLE interests to "${colorName.toUpperCase()}"?\n\nThis cannot be undone.`
      )
    ) {
      return;
    }

    setStates((prev) => {
      const next = [...prev];

      filtered.forEach(({ index }) => {
        next[index] = setAllState;
      });

      return next;
    });
  };

  // Auto-hide tooltip after 20 seconds
  useEffect(() => {
    if (openDescription) {
      const timer = setTimeout(() => setOpenDescription(null), 7500);
      return () => clearTimeout(timer); // cleanup if tooltip closes early
    }
  }, [openDescription]);

  /** Load persisted numeric state from combined-selections safely */
  useEffect(() => {
    const savedRaw = localStorage.getItem("combined-selections");
    if (!savedRaw) {
      setStates(Array(options.length).fill(0));
      return;
    }

    try {
      const saved: Record<string, string> = JSON.parse(savedRaw);

      const initialStates = options.map((option) => {
        const reaction = saved[option.id] ?? "indifferent";

        switch (reaction) {
          case "disgust": return 1;
          case "dislike": return 2;
          case "like": return 3;
          case "love": return 4;
          case "lust": return 5;
          default: return 0; // indifferent
        }
      });

      setStates(initialStates);
    } catch {
      setStates(Array(options.length).fill(0));
    }
  }, [options]);
  
  

  /** Persist numeric state safely, merging with existing selections */
  useEffect(() => {
    if (!states.length) return;

    const existingRaw = localStorage.getItem(RESULTS_KEY);
    const existing: Record<string, string> = existingRaw ? JSON.parse(existingRaw) : {};

    const pageSelections = options.reduce((acc, option, i) => {
      acc[option.id] = STATE_TO_VALUE[states[i]];
      return acc;
    }, {} as Record<string, string>);

    // Merge: existing roles + CorruChart current page
    const merged = { ...existing, ...pageSelections };

    localStorage.setItem(RESULTS_KEY, JSON.stringify(merged));
  }, [states, options]);

  const cycleColor = (index: number) => {
    setStates(prev => {
      const next = [...prev];
      next[index] = (next[index] + 1) % COLOR_HEX.length;

      // Trigger "+" for positive states
      if (next[index] >= 3) {
        const id = `${index}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
        setActivePluses(prev => [...prev, { index, id, state: next[index] }]);
        setTimeout(() => {
          setActivePluses(prev => prev.filter(p => p.id !== id));
        }, 800);
      }
      

      // Load existing selections from localStorage
      const existingRaw = localStorage.getItem("combined-selections");
      const existing: Record<string, string> = existingRaw ? JSON.parse(existingRaw) : {};

      // Build current page selections
      const pageSelections = options.reduce((acc, opt, i) => {
        acc[opt.id] = STATE_TO_VALUE[next[i]];
        return acc;
      }, {} as Record<string, string>);

      // Merge with existing (preserves Roles selections)
      const merged = { ...existing, ...pageSelections };

      localStorage.setItem("combined-selections", JSON.stringify(merged));

      return next;
    });
  };

    // PERSIST FORBIDDEN INTERESTS TOGGLE
    useEffect(() => {
    if (typeof window !== "undefined") {
        const saved = localStorage.getItem("showCategory6");
        if (saved === "true") setShowCategory6(true);
    }
    }, []);

    // SAVE TOGGLE
    useEffect(() => {
    localStorage.setItem("showCategory6", showCategory6 ? "true" : "false");
    }, [showCategory6]);


  /** Reset all options */
  const resetAll = () => {
    if (confirm("Reset all selections to 'Indifferent'?")) {
      setStates(Array(options.length).fill(0));
      setColorFilter(new Set());
      setShowCategory6(false);
    }
  };

  /** Toggle color filter */
  const toggleColor = (colorIndex: number) => {
    setColorFilter((prev) => {
      const next = new Set(prev);
      next.has(colorIndex) ? next.delete(colorIndex) : next.add(colorIndex);
      return next;
    });
  };

  const toggleGroup = (groupId: string) => {
    setGroupStates((prev) => {
      const next = { ...prev };

      if (!next[groupId]) {
        // NEUTRAL → INCLUDE
        next[groupId] = "include";
      } else if (next[groupId] === "include") {
        // INCLUDE → EXCLUDE
        next[groupId] = "exclude";
      } else {
        // EXCLUDE → NEUTRAL
        delete next[groupId];
      }

      return next;
    });
  };

  /** Filtered options */
    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();

        return slots
            .map((slot) => {
                const variantIndex = activeVariant[slot.slotId] ?? 0;
                const option = slot.options[variantIndex % slot.options.length];
                const index = optionIndexById[option.id];

                return { slot, option, index };
            })
            .filter(({ option, index }) => {
                const matchesText =
                    !q ||
                    option.label.toLowerCase().includes(q) ||
                    option.aka.some((a) => a.includes(q));

                const matchesColor =
                    colorFilter.size === 0 ||
                    colorFilter.has(states[index] % COLOR_HEX.length);

                const matchesGroup =
                    (!Object.values(groupStates).includes("include") ||
                        option.tags.some((cat) => groupStates[cat] === "include")) &&
                    !option.tags.some((cat) => groupStates[cat] === "exclude");

                const matchesCategory6 =
                    showCategory6 || option.category !== 6;

                return (
                    matchesText &&
                    matchesColor &&
                    matchesGroup &&
                    matchesCategory6
                );
            });
    }, [
        slots,
        activeVariant,
        optionIndexById,
        query,
        states,
        colorFilter,
        groupStates,
        showCategory6,
    ]);

  if (!states.length) return null;

  return (
      <main className="min-h-screen px-8 pb-12" style={{ backgroundColor: "#1F2023" }}>
      {/* Controls */}
      <div className="py-4 space-y-3">
        <div className="flex items-center gap-4 flex-wrap">
          <input
            ref={searchInputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search options…"
            className="px-3 py-2 rounded bg-neutral-900 text-gray-100 placeholder-gray-400 outline-none w-64"
          />

          <button
            onClick={resetAll}
            className="px-4 py-2 rounded bg-neutral-900 text-neutral-200 hover:bg-red-600/30 hover:text-neutral-300 cursor-pointer"
          >
            Reset All
          </button>

          <div className="flex items-center gap-2">
              {/* Forbidden toggle */}
              <button
                onClick={() => setShowCategory6((prev) => !prev)}
                className="px-4 py-2 rounded bg-neutral-900 text-neutral-400 hover:bg-neutral-800 cursor-pointer"
              >
                {showCategory6 ? "Forbidden Interests: ON" : "Forbidden Interests: OFF"}
              </button>

            <div
              className="
                flex items-center gap-1
                px-1 py-1
                rounded-md
                bg-neutral-900/60
                border border-neutral-800
              "
            >
              {/* SET ALL TO star */}
              <button
                onClick={cycleSetAllState}
                className="
                  flex items-center gap-2
                  px-3 py-2
                  rounded-sm
                  bg-neutral-900
                  hover:bg-neutral-800
                  cursor-pointer
                "
              >
                <span className="text-sm font-semibold text-gray-300">
                  SET ALL VISIBLE TO:
                </span>

                <svg
                  className="cursor-pointer"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill={COLOR_HEX[setAllState]}
                  stroke="#000"
                  strokeWidth="0.5"
                >
                  <path d="M12 2.5l2.9 6.1 6.7.6-5 4.4 1.5 6.5L12 16.8 5.9 20.1l1.5-6.5-5-4.4 6.7-.6L12 2.5z" />
                </svg>
              </button>

              {/* Apply button */}
              <button
                onClick={applySetAllState}
                className="
                  px-3 py-2
                  rounded-sm
                  text-sm font-semibold
                  bg-neutral-900
                  text-neutral-300
                  hover:bg-neutral-700/50
                  hover:text-white
                  transition-colors
                  cursor-pointer
                "
              >
                Apply
              </button>
             
            </div>
          </div>

                <div className="flex items-center gap-2 flex-wrap">
                <SettingsButton />
                </div>

          <Link
            href="/roles"
            className="px-4 py-2 rounded bg-neutral-900 text-neutral-200 hover:bg-violet-600/30 hover:text-neutral-300 cursor-pointer"
          >
            Next
          </Link>

          <span className="text-gray-400">
            Showing {filtered.length} / {slots.length}
          </span>
        </div>

        {/* Group (category) filter */}
        <div className="flex items-center gap-1 py-1 flex-wrap">
          <span className="text-gray-400 mr-2 flex-shrink-0">Filter by Group:</span>

          {/* "All" button */}
          <button
            onClick={() => setGroupStates({})}
            className={`flex-shrink-0 px-3 py-1 cursor-pointer rounded font-medium transition ${Object.keys(groupStates).length === 0
                ? "bg-neutral-700 text-gray-100"
                : "bg-neutral-900 text-gray-400 hover:bg-neutral-800"
              }`}
          >
            All
          </button>

          {/* Visible group buttons */}
          {visibleGroups.map((group) => {
            const state = groupStates[group.id];

            return (
              <button
                key={group.id}
                onClick={() => toggleGroup(group.id)}
                className={`flex-shrink-0 px-3 py-1 rounded whitespace-nowrap font-medium transition cursor-pointer ${state === "include"
                    ? "bg-green-700 text-green-100"
                    : state === "exclude"
                      ? "bg-red-700 text-red-100 line-through"
                      : "bg-neutral-900 text-gray-400 hover:bg-neutral-800"
                  }`}
              >
                {group.name}
              </button>
            );
          })}

          {/* Show More / Show Less button */}
          {GROUPS.length > INITIAL_VISIBLE_GROUPS && (
            <button
              onClick={() => setShowAllGroups((prev) => !prev)}
              className="flex-shrink-0 px-3 py-1 rounded bg-neutral-800 text-gray-300 hover:bg-neutral-700 transition cursor-pointer"
            >
              {showAllGroups ? "Show Less" : "Show More"}
            </button>
          )}
        </div>

        {/* Color filter */}
        <div className="flex items-center gap-1 flex-wrap">
          {COLOR_HEX.map((hex, i) => {
            const active = colorFilter.has(i);
            return (
              <button
                key={i}
                onClick={() => toggleColor(i)}
                className={`flex items-center gap-2 px-2 py-1 rounded cursor-pointer ${active ? "bg-neutral-700" : "bg-neutral-900"
                  }`}
              >
                <span
                  style={{
                    width: 14,
                    height: 14,
                    borderRadius: "50%",
                    backgroundColor: hex,
                    border: "1px solid #000",
                  }}
                />
                <span className={`text-sm ${active ? "text-gray-100" : "text-gray-400"}`}>
                  {COLOR_NAMES[i]}
                </span>
              </button>
            );
          })}
        </div>
      </div>

          <OptionsGrid
              filtered={filtered}
              states={states}
              options={options}
              activePluses={activePluses}
              activeVariant={activeVariant}
              openDescription={openDescription}
              setOpenDescription={setOpenDescription}
              setActiveVariant={setActiveVariant}
              cycleColor={cycleColor}
          />
    </main>
  );
}
