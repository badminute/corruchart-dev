"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import html2canvas from "html2canvas";

import { OPTIONS } from "@/data/options";
import type { Option } from "@/types/option";

/** html2canvas-safe hex colors */
const COLOR_HEX = [
  "#d1d5db", // Indifferent
  "#ef4444", // Highly Dislike
  "#3b82f6", // Dislike
  "#22c55e", // Like
  "#facc15", // Highly Like
  "#f97316", // Fetish
];

const COLOR_NAMES = [
  "Indifferent",
  "Highly Dislike",
  "Dislike",
  "Like",
  "Highly Like",
  "Fetish",
];

const STORAGE_KEY = "option-color-states";

export default function Page() {
  const options: Option[] = OPTIONS;
  const containerRef = useRef<HTMLDivElement>(null);

  const [states, setStates] = useState<number[]>([]);
  const [query, setQuery] = useState("");
  const [colorFilter, setColorFilter] = useState<Set<number>>(new Set());

  /** Load persisted state */
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    setStates(saved ? JSON.parse(saved) : Array(options.length).fill(0));
  }, [options.length]);

  /** Persist state */
  useEffect(() => {
    if (states.length) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(states));
    }
  }, [states]);

  const cycleColor = (index: number) => {
    setStates((prev) => {
      const next = [...prev];
      next[index] = (next[index] + 1) % COLOR_HEX.length;
      return next;
    });
  };

  const resetAll = () => {
    if (
      confirm(
        "Reset all selections to 'Indifferent'?"
      )
    ) {
      setStates(Array(options.length).fill(0));
      setColorFilter(new Set());
    }
  };

  const toggleColor = (colorIndex: number) => {
    setColorFilter((prev) => {
      const next = new Set(prev);
      next.has(colorIndex) ? next.delete(colorIndex) : next.add(colorIndex);
      return next;
    });
  };

  /** Search + color filter */
  const filtered = useMemo(() => {
    return options
      .map((option, index) => ({ option, index }))
      .filter(({ option, index }) => {
        const matchesText =
          !query.trim() ||
          option.label.toLowerCase().includes(query.toLowerCase());

        const matchesColor =
          colorFilter.size === 0 || colorFilter.has(states[index]);

        return matchesText && matchesColor;
      });
  }, [options, query, states, colorFilter]);

  /** Screenshot export (hardened) */
  const exportScreenshot = async () => {
    if (!containerRef.current) return;

    const canvas = await html2canvas(containerRef.current, {
      backgroundColor: "#262626",
      scale: 2,
      onclone: (doc) => {
        const root = doc.body;
        root.style.backgroundColor = "#262626";
        root.style.color = "#c084fc";

        root.querySelectorAll("*").forEach((el) => {
          const element = el as HTMLElement;

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
    <main className="min-h-screen bg-neutral-800 px-8">
      {/* Controls */}
      <div className="py-4 space-y-3">
        <div className="flex items-center gap-4 flex-wrap">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search options…"
            className="px-3 py-2 rounded bg-gray-700 text-gray-100 placeholder-gray-400 outline-none w-64"
          />

          <button
            onClick={exportScreenshot}
            className="px-4 py-2 rounded bg-gray-700 text-gray-200 hover:bg-gray-600"
          >
            Export Screenshot
          </button>

          <button
            onClick={resetAll}
            className="px-4 py-2 rounded bg-gray-700 text-gray-200 hover:bg-red-900/30 hover:text-red-300"
          >
            Reset All
          </button>

          <span className="text-gray-400">
            Showing {filtered.length} / {options.length}
          </span>
        </div>

        {/* Color filter */}
        <div className="flex items-center gap-3 flex-wrap">
          {COLOR_HEX.map((hex, i) => {
            const active = colorFilter.has(i);

            return (
              <button
                key={i}
                onClick={() => toggleColor(i)}
                className={`flex items-center gap-2 px-2 py-1 rounded ${
                  active ? "bg-gray-700" : "bg-gray-800"
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
                <span
                  className={`text-sm ${
                    active ? "text-gray-100" : "text-gray-400"
                  }`}
                >
                  {COLOR_NAMES[i]}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* EXPORT-SAFE AREA */}
      <div
        ref={containerRef}
        style={{ backgroundColor: "#262626", color: "#c084fc" }}
      >
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
              className="
              flex items-center gap-2 text-left p-2 rounded
              border border-transparent
              hover:border-gray-500
              cursor-pointer
            "
            >
              <span
                style={{
                  width: 16,
                  height: 16,
                  borderRadius: "50%",
                  backgroundColor: COLOR_HEX[states[index]],
                  border: "1px solid #000",
                }}
              />
              <span className="text-lg">{option.label}</span>
            </button>
          ))}
        </div>
      </div>
    </main>
  );
}
