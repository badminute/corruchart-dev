"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import html2canvas from "html2canvas-pro";
import Link from "next/link";

import { GROUPS } from "@/data/groups";
import { OPTIONS } from "@/data/options";
import type { Option as BaseOption } from "@/types/option";
import { DESCRIPTIONS } from "@/data/descriptions";

type GroupState = "include" | "exclude";

/** Reaction labels (UI only) */
const STATE_TO_LABEL = [
  "Indifferent",
  "Disgust",
  "Dislike",
  "Like",
  "Love",
  "Lust",
] as const;

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
  "Indifferent",
  "Disgust",
  "Dislike",
  "Like",
  "Love",
  "Lust",
] as const;

const STORAGE_KEY = "option-color-states";
const RESULTS_KEY = "corruchart-selections";

type Option = BaseOption & {
  tags: string[];
  category: number;
};

const STATE_TO_VALUE = [
  "Indifferent",
  "Disgust",
  "Dislike",
  "Like",
  "Love",
  "Lust",
] as const;

export default function Page() {
  const searchInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Progressive group filter state
  const [showAllGroups, setShowAllGroups] = useState(false);
  const INITIAL_VISIBLE_GROUPS = 6;
  const visibleGroups = showAllGroups ? GROUPS : GROUPS.slice(0, INITIAL_VISIBLE_GROUPS);

  useEffect(() => {
  const handler = (e: KeyboardEvent) => {
    const isMac = navigator.platform.toUpperCase().includes("MAC");
    const modifier = isMac ? e.metaKey : e.ctrlKey;

    if (modifier && e.key.toLowerCase() === "f") {
      e.preventDefault(); // stop browser find
      searchInputRef.current?.focus();
      searchInputRef.current?.select(); // optional: select existing text
    }
  };

  window.addEventListener("keydown", handler);
  return () => window.removeEventListener("keydown", handler);
}, []);

  /** Normalize OPTIONS tags */
  const options: Option[] = useMemo(
  () =>
    OPTIONS.map((opt) => ({
      ...opt,
      tags:
        (opt.tags as (string | number)[] | undefined)?.map((tag) => {
          if (typeof tag === "number") return GROUPS[tag - 1]?.id || "general";
          return tag;
        }) || ["general"],
      aka: opt.aka?.map((a) => a.toLowerCase()) || [], // 👈 normalize once
    })),
  []
);

  const [states, setStates] = useState<number[]>([]);
  const [query, setQuery] = useState("");
  const [colorFilter, setColorFilter] = useState<Set<number>>(new Set());
  const [groupStates, setGroupStates] = useState<Record<string, GroupState>>({});
  const [showCategory6, setShowCategory6] = useState(false);
  const [openDescription, setOpenDescription] = useState<string | null>(null);

  /** Load persisted numeric state */
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    let loaded: number[];

    try {
      const parsed = saved ? JSON.parse(saved) : null;
      loaded = Array.isArray(parsed)
        ? parsed
        : Array(options.length).fill(0);
    } catch {
      loaded = Array(options.length).fill(0);
    }

    if (loaded.length > options.length) loaded = loaded.slice(0, options.length);
    if (loaded.length < options.length) {
      loaded = [...loaded, ...Array(options.length - loaded.length).fill(0)];
    }

    loaded = loaded.map((v) => v % COLOR_HEX.length);
    setStates(loaded);
  }, [options.length]);

  /** Persist numeric state + semantic reactions */
  useEffect(() => {
    if (!states.length) return;

    // Keep original behavior
    localStorage.setItem(STORAGE_KEY, JSON.stringify(states));

    // 🔥 NEW: semantic data for results page
    const selectionsForResults: Record<string, string> = {};

    states.forEach((stateIndex, idx) => {
      const option = options[idx];
      if (!option) return;

      let reaction: string;
      switch (stateIndex) {
        case 1:
          reaction = "disgust";
          break;
        case 2:
          reaction = "hate";
          break;
        case 3:
          reaction = "like";
          break;
        case 4:
          reaction = "love";
          break;
        case 5:
          reaction = "lust";
          break;
        default:
          reaction = "indifferent";
      }

      selectionsForResults[option.id] = reaction;
    });

    localStorage.setItem(
      RESULTS_KEY,
      JSON.stringify(selectionsForResults)
    );
  }, [states, options]);

  const cycleColor = (index: number) => {
    setStates((prev) => {
      const next = [...prev];
      next[index] = (next[index] + 1) % COLOR_HEX.length;

      const selections = options.map((opt, i) => ({
        tags: opt.tags, // array of string ids
        value: STATE_TO_VALUE[next[i]],
      }));
      localStorage.setItem("corruchart-selections", JSON.stringify(selections));

      return next;
    });
  };

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

  return options
    .map((option, index) => ({ option, index }))
    .filter(({ option, index }) => {
      const matchesText =
        !q ||
        option.label.toLowerCase().includes(q) ||
        option.aka.some((alias) => alias.includes(q));

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
}, [options, query, states, colorFilter, groupStates, showCategory6]);

  /** Screenshot export */
  const exportScreenshot = async () => {
    if (!containerRef.current) return;

    // Clone the container into a wrapper with extra padding
    const wrapper = document.createElement("div");
    wrapper.style.padding = "40px"; // extra padding around content
    wrapper.style.backgroundColor = "#1F2023"; // match page background
    wrapper.style.display = "inline-block"; // shrink to content
    wrapper.appendChild(containerRef.current.cloneNode(true));

    document.body.appendChild(wrapper); // temporarily add to DOM

    const canvas = await html2canvas(wrapper, {
      scale: 2,
      backgroundColor: "#1F2023",
      onclone: (doc) => {
        const root = doc.body;
        root.style.backgroundColor = "#1F2023";
        root.style.color = "#E5E7EB"; // tailwind text-neutral-200

        root.querySelectorAll("*").forEach((el) => {
          if (el instanceof SVGElement) return; // leave SVGs

          const element = el as HTMLElement;

          // Strip Tailwind classes that might override colors
          if (typeof element.className === "string") {
            element.className = element.className
              .split(" ")
              .filter(
                (c) =>
                  !c.startsWith("bg-") &&
                  !c.startsWith("text-") &&
                  !c.startsWith("border-") &&
                  !c.startsWith("ring-") &&
                  !c.startsWith("shadow")
              )
              .join(" ");
          }

          element.style.backgroundColor ||= "transparent";
          element.style.borderColor ||= "transparent";
        });
      },
    });

    document.body.removeChild(wrapper); // clean up

    const link = document.createElement("a");
    link.download = "selections.png";
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  if (!states.length) return null;

  return (
    <main className="min-h-screen px-8" style={{ backgroundColor: "#1F2023" }}>
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
            onClick={exportScreenshot}
            className="px-4 py-2 rounded bg-neutral-900 text-neutral-200 hover:bg-neutral-600 cursor-pointer"
          >
            Export Screenshot
          </button>

          <button
            onClick={resetAll}
            className="px-4 py-2 rounded bg-neutral-900 text-neutral-200 hover:bg-red-900/90 hover:text-neutral-300 cursor-pointer"
          >
            Reset All
          </button>

          <Link
            href="/roles"
            className="px-4 py-2 rounded bg-neutral-900 text-neutral-200 hover:bg-green-900/90 hover:text-neutral-300 cursor-pointer"
          >
            Next
          </Link>

          <button
            onClick={() => setShowCategory6((prev) => !prev)}
            className="px-4 py-2 rounded bg-neutral-900 text-neutral-400 hover:bg-neutral-800 cursor-pointer"
          >
            {showCategory6 ? "Forbidden Interests: ON" : "Forbidden Interests: OFF"}
          </button>

          <span className="text-gray-400">
            Showing {filtered.length} / {options.length}
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

      {/* EXPORT-SAFE AREA */}
      <div ref={containerRef} style={{ backgroundColor: "#1F2023", color: "#9F86D8" }}>
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
          {filtered.map(({ option, index }) => {
            const description = DESCRIPTIONS[option.id];

            return (
              <div key={option.id} className="relative">
                <div
                  className="
          flex items-center gap-2
          text-left p-2 rounded
          border border-transparent hover:border-gray-500
          w-full
          group
        "
                >
                  {/* STAR */}
                  <button
                    onClick={() => cycleColor(index)}
                    className="flex-shrink-0 cursor-pointer"
                  >
                    <svg
                      width="32"
                      height="32"
                      viewBox="0 0 24 24"
                      fill={COLOR_HEX[states[index] % COLOR_HEX.length]}
                      stroke="#000"
                      strokeWidth="0.5"
                    >
                      <path d="M12 2.5l2.9 6.1 6.7.6-5 4.4 1.5 6.5L12 16.8 5.9 20.1l1.5-6.5-5-4.4 6.7-.6L12 2.5z" />
                    </svg>
                  </button>

                  {/* LABEL + QUESTION MARK OVERLAY */}
                  <span
                    className="relative text-lg pr-4"
                    style={{ textShadow: "0 2px 4px rgba(0,0,0,0.3)" }}
                  >
                    {option.label}

                    {description && (
                      <span
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenDescription(
                            openDescription === option.id ? null : option.id
                          );
                        }}
                        className="
                absolute -top-1 -right-1
                w-4 h-4
                flex items-center justify-center
                rounded-full
                text-[9px] font-bold
                bg-neutral-800 text-gray-300
                border border-neutral-600
                cursor-pointer
                opacity-0
                group-hover:opacity-100
              "
                        title="Show description"
                      >
                        ?
                      </span>
                    )}
                  </span>
                </div>

{/* DESCRIPTION POPOVER */}
{openDescription === option.id && description && (
  <div
    className="
      absolute z-10
      left-1 bottom-full mb-1
      max-w-xs
      p-3 rounded
      bg-neutral-900 text-gray-200
      text-sm
      border border-neutral-700
      shadow-lg
      text-center
    "
  >
    {/* Description text */}
    <div>{description}</div>

    {/* AKA list */}
    {option.aka && option.aka.length > 0 && (
      <div className="mt-2 pt-2 border-t border-neutral-700 text-xs text-gray-400 text-center">
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
    </main>
  );
}
