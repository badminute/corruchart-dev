"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import html2canvas from "html2canvas-pro";
import Link from "next/link";

import { GROUPS } from "@/data/groups";
import { OPTIONS } from "@/data/options";
import type { Option as BaseOption } from "@/types/option";

const STATE_TO_VALUE = [
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
  "#e74c3c", // Disgust
  "#fc8d59", // Dislike
  "#27ae60", // Like
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
];

const STORAGE_KEY = "option-color-states";

type Option = BaseOption & {
  categories: string[]; // array of GROUPS ids
  category: number; // numeric category
  value?: "Indifferent" | "Disgust" | "Dislike" | "Like" | "Love" | "Lust";
};

export default function Page() {
  const containerRef = useRef<HTMLDivElement>(null);

  // Map OPTIONS to use string category IDs from GROUPS
  const options: Option[] = OPTIONS.map((opt) => ({
    ...opt,
    categories:
      (opt.categories as string[] | number[] | undefined)?.map((cat) => {
        if (typeof cat === "number") return GROUPS[cat - 1]?.id || "general";
        return cat; // already string id
      }) || ["general"],
  }));

  const [states, setStates] = useState<number[]>([]);
  const [query, setQuery] = useState("");
  const [colorFilter, setColorFilter] = useState<Set<number>>(new Set());
  const [selectedGroup, setSelectedGroup] = useState<string>("");
  const [showCategory6, setShowCategory6] = useState(false); // hide category 6 by default

  /** Load persisted state */
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    let loaded: number[];

    try {
      const parsed = saved ? JSON.parse(saved) : null;
      loaded = Array.isArray(parsed) ? parsed : Array(options.length).fill(0);
    } catch {
      loaded = Array(options.length).fill(0);
    }

    if (loaded.length > options.length) loaded = loaded.slice(0, options.length);
    if (loaded.length < options.length)
      loaded = [...loaded, ...Array(options.length - loaded.length).fill(0)];

    loaded = loaded.map((val) => val % COLOR_HEX.length);
    setStates(loaded);
  }, [options.length]);

  /** Persist state */
  useEffect(() => {
    if (states.length) localStorage.setItem(STORAGE_KEY, JSON.stringify(states));
  }, [states]);

  /** Mapping of color index → scoring value */
  const STATE_TO_VALUE: Record<number, string> = {
    0: "Indifferent",
    1: "Highly Dislike",
    2: "Dislike",
    3: "Like",
    4: "Love",
    5: "Lust",
  };

  const cycleColor = (index: number) => {
    setStates((prev) => {
      const next = [...prev];
      next[index] = (next[index] + 1) % COLOR_HEX.length;

      const selections = options.map((opt, i) => ({
        categories: opt.categories, // array of string ids
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
      options.forEach((opt) => (opt.value = "Indifferent"));
      setColorFilter(new Set());
      setSelectedGroup("");
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

  /** Filtered options */
  const filtered = useMemo(() => {
    return options
      .map((option, index) => ({ option, index }))
      .filter(({ option, index }) => {
        const matchesText =
          !query.trim() || option.label.toLowerCase().includes(query.toLowerCase());
        const matchesColor =
          colorFilter.size === 0 || colorFilter.has(states[index] % COLOR_HEX.length);
        const matchesGroup =
          !selectedGroup || option.categories.includes(selectedGroup);
        const matchesCategory6 =
          showCategory6 || option.category !== 6; // hide category 6 unless toggled
        return matchesText && matchesColor && matchesGroup && matchesCategory6;
      });
  }, [options, query, states, colorFilter, selectedGroup, showCategory6]);

  /** Screenshot export */
  const exportScreenshot = async () => {
    if (!containerRef.current) return;

    const canvas = await html2canvas(containerRef.current, {
      backgroundColor: "#191B1C",
      scale: 2,
      onclone: (doc) => {
        const root = doc.body;
        root.style.backgroundColor = "#1F2023";
        root.style.color = "#B794F4";

        root.querySelectorAll("*").forEach((el) => {
          // Skip SVGs completely
          if (el instanceof SVGElement) return;

          const element = el as HTMLElement;

          // Safely strip Tailwind classes if className is string
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

          // Reset styles
          element.style.color ||= "inherit";
          element.style.backgroundColor ||= "transparent";
          element.style.borderColor ||= "transparent";
        });
      },
    });

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
        <div className="flex items-center gap-2 overflow-x-auto py-1">
          <span className="text-gray-400 mr-2 flex-shrink-0">Filter by Group:</span>

          <button
            onClick={() => setSelectedGroup("")}
            className={`flex-shrink-0 px-3 py-1 rounded whitespace-nowrap font-medium transition cursor-pointer ${selectedGroup === "" ? "bg-neutral-700 text-gray-100" : "bg-neutral-900 text-gray-400 hover:bg-neutral-800"
              }`}
          >
            All
          </button>

          {GROUPS.map((group) => (
            <button
              key={group.id}
              onClick={() => setSelectedGroup(group.id)}
              className={`flex-shrink-0 px-3 py-1 rounded whitespace-nowrap font-medium transition ${selectedGroup === group.id
                  ? "bg-neutral-700 text-gray-100 cursor-pointer"
                  : "bg-neutral-900 text-gray-400 hover:bg-neutral-800 cursor-pointer"
                }`}
            >
              {group.name}
            </button>
          ))}
        </div>

        {/* Color filter */}
        <div className="flex items-center gap-3 flex-wrap">
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
          {filtered.map(({ option, index }) => (
            <button
              key={option.id}
              onClick={() => cycleColor(index)}
              className="flex items-center gap-2 text-left p-2 rounded border border-transparent hover:border-gray-500 cursor-pointer"
            >
              <svg
                className="flex-shrink-0"
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill={COLOR_HEX[states[index] % COLOR_HEX.length]}
                stroke="#000"
                strokeWidth="0.5"
              >
                <path d="M12 2.5l2.9 6.1 6.7.6-5 4.4 1.5 6.5L12 16.8 5.9 20.1l1.5-6.5-5-4.4 6.7-.6L12 2.5z" />
              </svg>
              <span
                className="text-lg"
                style={{ textShadow: "0 2px 4px rgba(0,0,0,0.3)" }}
              >
                {option.label}
              </span>
            </button>
          ))}
        </div>
      </div>
    </main>
  );
}
