"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import html2canvas from "html2canvas-pro";

import { OPTIONS } from "@/data/options";
import { ROLES } from "@/data/roles";
import { computeScore, THRESHOLDS } from "@/data/scoring";

/** html2canvas-safe hex colors */
const COLOR_HEX = [
  "#d1d5db", // Indifferent
  "#ef4444", // Disgust
  "#3b82f6", // Dislike
  "#22c55e", // Like
  "#facc15", // Love
  "#f97316", // Lust
];

const COLOR_NAMES = [
  "Indifferent",
  "Disgust",
  "Dislike",
  "Like",
  "Love",
  "Lust",
];

const METER_MAX_POINTS = 3000;

// ** Define the page background color once **
const PAGE_BACKGROUND_COLOR = "#1F2023";

export default function ResultsPage() {
  const [selections, setSelections] = useState<any[]>([]);
  const [identityOptions, setIdentityOptions] = useState<typeof ROLES>([]);

  /** Load Corruption Chart selections */
  useEffect(() => {
    const saved = localStorage.getItem("corruchart-selections");
    if (saved) setSelections(JSON.parse(saved));
  }, []);

  /** Listen for storage changes */
  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === "corruchart-selections") {
        setSelections(e.newValue ? JSON.parse(e.newValue) : []);
      }
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  /** Load Identity / Roles selections */
  useEffect(() => {
    const rolesSelections = JSON.parse(
      localStorage.getItem("rolespage-option-color-states") ?? "[]"
    );
    const selectedRoles = ROLES.filter((role, idx) => rolesSelections[idx] === 1);
    setIdentityOptions(selectedRoles);
  }, []);

  /** Map selections to scoring input */
  const scoredSelections = useMemo(() => {
    return selections
      .map((sel, index) => {
        const option = OPTIONS[index];
        if (!option) return null;
        return { category: option.category, value: sel.value };
      })
      .filter(Boolean);
  }, [selections]);

  const scoreData = useMemo(() => computeScore(scoredSelections), [scoredSelections]);

  const fillPercent = useMemo(() => {
    if (scoreData.category6Hit) return 100;
    return Math.min((scoreData.total / METER_MAX_POINTS) * 100, 100);
  }, [scoreData]);

  /** Count colors for distribution */
  const colorCounts = useMemo(() => {
    const counts = Array(COLOR_HEX.length).fill(0);
    scoredSelections.forEach((sel: any) => {
      const idx = COLOR_NAMES.indexOf(sel.value);
      if (idx !== -1) counts[idx]++;
    });
    return counts;
  }, [scoredSelections]);

  /** Screenshot export */
  const exportScreenshot = async () => {
    const container = document.getElementById("results-container");
    if (!container) return;

    const canvas = await html2canvas(container, { scale: 2, backgroundColor: PAGE_BACKGROUND_COLOR });
    const link = document.createElement("a");
    link.download = "results.png";
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  return (
    <main
      className="min-h-screen text-neutral-200 px-6 py-10"
      style={{ backgroundColor: PAGE_BACKGROUND_COLOR }}
    >
      <div id="results-container" className="max-w-3xl mx-auto space-y-10">
        <header className="space-y-2">
          <h1
            className="text-3xl text-center font-semibold"
            style={{ textShadow: "0px 5px 3px rgba(0,0,0,0.7)" }}
          >
            Results
          </h1>
          <p className="text-neutral-400 text-center">
            These are the results of your Corruption Chart. You can mouse over each threshold tick to see what threshold of corruption you met.
          </p>
        </header>

        {/* Actions */}
        <div className="flex gap-2">
          <button
            onClick={exportScreenshot}
            className="px-4 py-2 rounded bg-neutral-900 text-neutral-200 hover:bg-neutral-800 cursor-pointer"
          >
            Export Screenshot
          </button>
          <Link
            href="/"
            className="px-4 py-2 rounded bg-neutral-900 text-neutral-200 hover:bg-neutral-800 cursor-pointer"
          >
            Back
          </Link>
        </div>

        {/* SCORE METER */}
        <section className="space-y-3">
          <div className="flex justify-between text-sm text-neutral-400">
            <span style={{ textShadow: "0px 5px 3px rgba(0,0,0,0.3)" }}>Score</span>
            <span style={{ textShadow: "0px 5px 3px rgba(0,0,0,0.3)" }}>
              {scoreData.total} / {METER_MAX_POINTS}
            </span>
          </div>

          <div className="w-full h-4 rounded overflow-hidden" style={{ backgroundColor: "#2c2e33" }}>
            <div
              className="h-full bg-violet-500 transition-all duration-500"
              style={{ width: `${fillPercent}%` }}
            />
          </div>

          {/* Threshold markers */}
          <div className="relative w-full h-6">
            {THRESHOLDS.filter(t => t.points > 0).map((t, i) => {
              const leftPercent = (t.points / METER_MAX_POINTS) * 100;

              return (
                <div
                  key={i}
                  className="absolute top-0 text-center group"
                  style={{ left: `${leftPercent}%`, transform: 'translateX(-50%)' }}
                >
                  <div className="w-px h-4 cursor-pointer bg-neutral-500 mx-auto" />
                  <span className="text-xl cursor-pointer text-neutral-400 block mt-1">{i + 1}</span>
                  <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer z-50">
                    <div className="bg-black text-white text-s px-2 py-1 rounded shadow-lg relative">
                      {t.description}
                      <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-2 h-2 bg-black cursor-pointer rotate-45"></div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* CATEGORY 6 NOTE */}
        {scoreData.category6Hit && (
          <div
            className="p-2 rounded text-center text-xl text-violet-400 relative group cursor-pointer"
            title={THRESHOLDS[5].description}
            style={{ backgroundColor: "#2c2e33", textShadow: "0px 4px 1px rgba(0,0,0,0.7)" }}
          >
            YOU ARE TAINTED WITH FORBIDDEN CORRUPTION.
            <span className="absolute bottom-full mb-1 left-1/2 transform -translate-x-1/2 bg-neutral-900 text-xs text-white px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
              {THRESHOLDS[5].description}
            </span>
          </div>
        )}

        {/* IDENTITY & ROLES */}
        {identityOptions.length > 0 && (
          <section className="mt-8">
            <h2
              className="text-xl text-center font-semibold mb-4 text-white"
              style={{ textShadow: "0px 5px 3px rgba(0,0,0,0.7)" }}
            >
              Identity and Roles
            </h2>

            <div
              className="grid gap-4 justify-items-start"
              style={{
                gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
              }}
            >
              {identityOptions.map((opt) => (
                <div
                  key={opt.id}
                  className="flex items-center gap-2 text-white text-lg"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-5 h-5 text-yellow-400 flex-shrink-0"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14l-5-4.87 6.91-1.01L12 2z" />
                  </svg>
                  <span>{opt.label}</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* COLOR DISTRIBUTION */}
        <section className="space-y-3">
          <h2
            className="text-3xl text-center font-semibold"
            style={{ textShadow: "0px 5px 3px rgba(0,0,0,0.7)" }}
          >
            Distribution
          </h2>
          <div className="space-y-2">
            {COLOR_HEX.map((color, i) => (
              <div key={i} className="flex text-center drop-shadow items-center gap-3 text-sm">
                <div
                  className="w-4 h-4 rounded"
                  style={{ backgroundColor: color }}
                />
                <span className="flex-1 text-neutral-400">{COLOR_NAMES[i]}</span>
                <span>{colorCounts[i]}</span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
