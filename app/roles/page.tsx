"use client";

import { useEffect, useRef, useState } from "react";
import html2canvas from "html2canvas-pro";
import Link from "next/link";

import { ROLES } from "@/data/roles";
import type { Option } from "@/types/option";

const STORAGE_KEY = "rolespage-option-color-states";

// Only keep two colors
const COLOR_HEX = [
    "#828282ff", // I do not identify as
    "#59c961ff", // I am / Identify as
];

const COLOR_NAMES = ["I do not identify as", "I am / Identify as"];

export default function Page() {
    const options: Option[] = ROLES;
    const containerRef = useRef<HTMLDivElement>(null);

    const [states, setStates] = useState<number[]>([]);
    const [query, setQuery] = useState("");
    const [colorFilter, setColorFilter] = useState<Set<number>>(new Set());

    /** Load persisted state */
    useEffect(() => {
        const saved = localStorage.getItem(STORAGE_KEY);
        let loaded: number[] = saved
            ? JSON.parse(saved)
            : Array(options.length).fill(0);

        if (loaded.length > options.length) loaded = loaded.slice(0, options.length);
        if (loaded.length < options.length)
            loaded = [...loaded, ...Array(options.length - loaded.length).fill(0)];

        loaded = loaded.map((v) => v % COLOR_HEX.length);
        setStates(loaded);
    }, [options.length]);

    /** Persist state */
    useEffect(() => {
        if (states.length) {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(states));
        }
    }, [states]);

    /** Cycle color */
    const cycleColor = (index: number) => {
        setStates((prev) => {
            const next = [...prev];
            next[index] = (next[index] + 1) % COLOR_HEX.length;
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

    const exportScreenshot = async () => {
        if (!containerRef.current) return;

        const canvas = await html2canvas(containerRef.current, {
            backgroundColor: "#191b1cff",
            scale: 2,
            onclone: (doc) => {
                const root = doc.body;
                root.style.backgroundColor = "#1C1E20";
                root.style.color = "#B794F4";

                root.querySelectorAll("*").forEach((el) => {
                    const element = el as HTMLElement;
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
        option.categories.forEach((cat) => {
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
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Search options…"
                        className="px-3 py-2 rounded bg-neutral-900 text-gray-100 placeholder-gray-400 outline-none w-64"
                    />

                    <button
                        onClick={exportScreenshot}
                        className="px-4 py-2 rounded bg-neutral-900 text-neutral-200 hover:bg-neutral-600"
                    >
                        Export Screenshot
                    </button>

                    <button
                        onClick={resetAll}
                        className="px-4 py-2 rounded bg-neutral-900 text-neutral-200 hover:bg-red-900/90"
                    >
                        Reset All
                    </button>

                    <Link
                        href="/results"
                        className="px-4 py-2 rounded bg-neutral-900 text-neutral-200 hover:bg-green-900/90"
                    >
                        Results
                    </Link>

                    <span className="text-gray-400">
                        Showing {filtered.length} / {options.length}
                    </span>
                </div>

                {/* Color filter */}
                <div className="flex items-center gap-3 flex-wrap justify-center">
                    {COLOR_HEX.map((hex, i) => (
                        <button
                            key={i}
                            onClick={() => toggleColor(i)}
                            className={`flex items-center gap-2 px-2 py-1 rounded ${colorFilter.has(i)
                                    ? "bg-neutral-700 text-gray-100"
                                    : "bg-neutral-900 text-gray-400"
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
                            {COLOR_NAMES[i]}
                        </button>
                    ))}
                </div>
            </div>

            {/* EXPORT SAFE AREA */}
            <div
                ref={containerRef}
                className="w-full max-w-6xl mx-auto columns-1 md:columns-2 lg:columns-3 gap-4"
                style={{
                    gridAutoFlow: "dense",
                    backgroundColor: "#1F2023",
                    color: "#9F86D8",
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
                            {categoriesMap[category].map(({ option, index }) => (
                                <button
                                    key={option.id}
                                    onClick={() => cycleColor(index)}
                                    className="flex items-center gap-3 px-3 py-2 w-full rounded-md cursor-pointer text-left transition hover:bg-white/5"
                                >
                                    <svg
                                        width="18"
                                        height="18"
                                        viewBox="0 0 24 24"
                                        fill={COLOR_HEX[states[index]]}
                                        stroke="#000"
                                        strokeWidth="0.5"
                                        className="flex-shrink-0"
                                    >
                                        <path d="M12 2.5l2.9 6.1 6.7.6-5 4.4 1.5 6.5L12 16.8 5.9 20.1l1.5-6.5-5-4.4 6.7-.6L12 2.5z" />
                                    </svg>

                                    <span
                                        className="text-sm"
                                        style={{
                                            textShadow: "0 1px 2px rgba(0,0,0,0.3)",
                                        }}
                                    >
                                        {option.label}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </main>
    );
}
