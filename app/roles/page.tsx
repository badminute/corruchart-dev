"use client";

import { useEffect, useRef, useState } from "react";
import html2canvas from "html2canvas-pro";
import Link from "next/link";

import { ROLES } from "@/data/roles";
import type { Option } from "@/types/option";
import { ROLE_SYMBOLS } from "@/data/roleSymbols";

const STORAGE_KEY = "rolespage-option-color-states";

export default function Page() {
    const options: Option[] = ROLES;
    const containerRef = useRef<HTMLDivElement>(null);

    const [states, setStates] = useState<number[]>([]);
    const [query, setQuery] = useState("");
    const searchInputRef = useRef<HTMLInputElement>(null);
    const [colorFilter, setColorFilter] = useState<Set<number>>(new Set());

    /** Load persisted state */
    useEffect(() => {
        const saved = localStorage.getItem(STORAGE_KEY);
        let loaded: number[] = saved
            ? JSON.parse(saved)
            : Array(options.length).fill(0);

        // Make sure array length matches options
        if (loaded.length > options.length) loaded = loaded.slice(0, options.length);
        if (loaded.length < options.length)
            loaded = [...loaded, ...Array(options.length - loaded.length).fill(0)];

        // Ensure all values are 0 or 1 (untoggled/toggled)
        loaded = loaded.map((v) => (v === 1 ? 1 : 0));

        setStates(loaded);
    }, [options.length]);

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

    const exportScreenshot = async () => {
        if (!containerRef.current) return;

        // Create a temporary wrapper for extra padding
        const wrapper = document.createElement("div");
        wrapper.style.padding = "40px"; // extra padding
        wrapper.style.backgroundColor = "#1C1E20"; // match page background
        wrapper.style.display = "inline-block";
        wrapper.appendChild(containerRef.current.cloneNode(true));

        document.body.appendChild(wrapper); // temporarily add to DOM

        const canvas = await html2canvas(wrapper, {
            backgroundColor: "#1C1E20",
            scale: 2,
            onclone: (doc) => {
                const root = doc.body;

                // Keep the original text color (do not force)
                root.querySelectorAll("*").forEach((el) => {
                    const element = el as HTMLElement;

                    // Leave SVGs alone
                    if (el instanceof SVGElement) return;

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

                    // Preserve existing text/background/border styles if present
                    element.style.color ||= "inherit";
                    element.style.backgroundColor ||= "transparent";
                    element.style.borderColor ||= "transparent";
                });
            },
        });

        document.body.removeChild(wrapper); // clean up wrapper

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
                                    {/* Role symbol */}
                                    <span
                                        className="flex-shrink-0 w-6 text-center font-bold"
                                        style={{
                                            fontSize: "18px",

                                            // Unicode symbols: real color control
                                            color: states[index] === 1
                                                ? ROLE_SYMBOLS[option.id]?.color ?? "#b1b1b1"
                                                : "#555",

                                            // Emojis: visual dimming
                                            opacity: states[index] === 1 ? 1 : 0.35,
                                            filter: states[index] === 1
                                                ? "none"
                                                : "grayscale(100%) brightness(70%)",
                                        }}
                                    >
                                        {ROLE_SYMBOLS[option.id]?.symbol ?? "★"}
                                    </span>

                                    {/* Option label (must be separate) */}
                                    <span
                                        className="text-sm"
                                        style={{
                                            textShadow: "0 1px 2px rgba(0,0,0,0.3)",
                                            color: "#979797", // ensure visible
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
