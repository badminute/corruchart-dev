"use client";

import { useState, useEffect, useRef } from "react";
import { useSettings } from "./SettingsContext";

const iconThemes = [
  { key: "default", label: "Star (Legacy)", emoji: "⭐" },
  { key: "emoji", label: "Emoji", emoji: "😶" },
] as const;

export default function SettingsButton() {
  const [open, setOpen] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const { colourblindMode, setColourblindMode, reverseColorCycle, setReverseColorCycle, scrollCycling, setScrollCycling, variantSwapEnabled, setVariantSwapEnabled, starTheme, setStarTheme } = useSettings();
  const rootRef = useRef<HTMLDivElement | null>(null);

// Load saved setting once
useEffect(() => {
  if (typeof window !== "undefined") {
    const saved = localStorage.getItem("reducedMotion");
    if (saved === "true") setReducedMotion(true);
  }
}, []);

// Apply/remove page-level attribute and save
useEffect(() => {
  if (typeof document !== "undefined") {
    if (reducedMotion) {
      document.documentElement.setAttribute("data-reduced-motion", "true");
    } else {
      document.documentElement.removeAttribute("data-reduced-motion");
    }
    localStorage.setItem("reducedMotion", reducedMotion ? "true" : "false");
  }
}, [reducedMotion]);

  // Close dropdown on outside click
  useEffect(() => {
    if (!open) return;
    function handleOutside(e: MouseEvent) {
      const el = rootRef.current;
      if (el && !el.contains(e.target as Node)) {
        setOpen(false);
      }
    }

    window.addEventListener("mousedown", handleOutside);
    return () => window.removeEventListener("mousedown", handleOutside);
  }, [open]);


  return (
    <div className="relative" ref={rootRef}>
      {/* Button to toggle dropdown */}
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="
          px-3 py-2
          rounded
          bg-neutral-900 text-gray-200
          hover:bg-neutral-800
          transition
          cursor-pointer
        "
      >
        ⚙
      </button>

      {/* Dropdown */}
      {open && (
        <div
          className="
            absolute left-full mt-2 ml-2 w-56
            rounded-md bg-neutral-900 text-gray-200
            shadow-lg border border-neutral-700
            z-50
          "
        >
          <div className="p-3 space-y-2">
            {/* Reduced Motion Toggle as Button */}
            <button
              onClick={() => setReducedMotion((prev) => !prev)}
              className={`
                w-full text-left cursor-pointer px-3 py-2 rounded
                font-medium transition
                ${reducedMotion
                  ? "bg-neutral-900 text-gray-100 hover:bg-neutral-800"
                  : "bg-neutral-800 text-gray-300 hover:bg-neutral-700"
                }
              `}
            >
              Reduced Motion: {reducedMotion ? "ON" : "OFF"}
            </button>

            {/* Colourblind Mode Toggle */}
            <button
              onClick={() => setColourblindMode(!colourblindMode)}
              className={`
                w-full text-left cursor-pointer px-3 py-2 rounded
                font-medium transition
                ${colourblindMode
                  ? "bg-neutral-900 text-gray-100 hover:bg-neutral-800"
                  : "bg-neutral-800 text-gray-300 hover:bg-neutral-700"
                }
              `}
            >
              Colorblind Mode: {colourblindMode ? "ON" : "OFF"}
            </button>

            {/* Reverse Color Cycle Toggle */}
            <button
              onClick={() => setReverseColorCycle(!reverseColorCycle)}
              className={`
                w-full text-left cursor-pointer px-3 py-2 rounded
                font-medium transition
                ${reverseColorCycle
                  ? "bg-neutral-900 text-gray-100 hover:bg-neutral-800"
                  : "bg-neutral-800 text-gray-300 hover:bg-neutral-700"
                }
              `}
            >
              Reverse Color Cycle: {reverseColorCycle ? "ON" : "OFF"}
            </button>

            {/* Scroll Cycling Toggle */}
            <button
              onClick={() => setScrollCycling(!scrollCycling)}
              className={`
                w-full text-left cursor-pointer px-3 py-2 rounded
                font-medium transition
                ${scrollCycling
                  ? "bg-neutral-900 text-gray-100 hover:bg-neutral-800"
                  : "bg-neutral-800 text-gray-300 hover:bg-neutral-700"
                }
              `}
            >
              Mouse Scroll Cycling: {scrollCycling ? "ON" : "OFF"}
            </button>

            {/* Variant Swap Toggle */}
            <button
              onClick={() => setVariantSwapEnabled(!variantSwapEnabled)}
              className={`
                w-full text-left cursor-pointer px-3 py-2 rounded
                font-medium transition
                ${variantSwapEnabled
                  ? "bg-neutral-900 text-gray-100 hover:bg-neutral-800"
                  : "bg-neutral-800 text-gray-300 hover:bg-neutral-700"
                }
              `}
            >
              Clickable Swap Button (CHART): {variantSwapEnabled ? "ON" : "OFF"}
            </button>

            <div className="pt-2 border-t border-neutral-700">
              <div className="text-xs uppercase tracking-[0.3em] text-gray-400 mb-2">
                Theme
              </div>
              <div className="grid grid-cols-2 gap-2">
                {iconThemes.map((theme) => (
                  <button
                    key={theme.key}
                    onClick={() => setStarTheme(theme.key)}
                    className={
                      `flex items-center justify-center gap-2 px-3 py-2 rounded text-sm transition cursor-pointer ${
                        starTheme === theme.key
                          ? "bg-neutral-900 text-gray-100 ring-1 ring-violet-500"
                          : "bg-neutral-800 text-gray-300 hover:bg-neutral-700"
                      }`
                    }
                  >
                    <span className="pointer-events-none">{theme.emoji}</span>
                    <span className="pointer-events-none">{theme.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
