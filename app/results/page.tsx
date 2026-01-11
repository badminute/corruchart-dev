"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import html2canvas from "html2canvas-pro";

import { computeTagScores, TagBreakdown } from "@/lib/tagScores";
import { Reaction } from "@/data/scoring";
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
const PAGE_BACKGROUND_COLOR = "#1F2023";

// === Tags you want to hide from results ===
const HIDDEN_TAGS = new Set<string>(["upper-body", "qualities", "acts", "lower-body", "misc", "roles-themes"]); // example

export default function ResultsPage() {
  // ----------------------------
  // STATE
  // ----------------------------
  const [selections, setSelections] = useState<any[]>([]);
  const [identityOptions, setIdentityOptions] = useState<typeof ROLES>([]);
  const [positiveTags, setPositiveTags] = useState<TagBreakdown[]>([]);
  const [negativeTags, setNegativeTags] = useState<TagBreakdown[]>([]);
  const [openTag, setOpenTag] = useState<string | null>(null);

  // ----------------------------
  // Load selections from localStorage
  // ----------------------------
  useEffect(() => {
    const saved = localStorage.getItem("corruchart-selections");
    if (!saved) return;

    const userSelections: Record<string, Reaction> = JSON.parse(saved);

    // Set raw selections for scoring
    setSelections(Object.entries(userSelections).map(([id, value]) => ({ id, value })));

    // Compute tag breakdowns
    const { positive, negative } = computeTagScores(userSelections);
    setPositiveTags(positive);
    setNegativeTags(negative);
  }, []);

  // ----------------------------
  // Listen for storage changes
  // ----------------------------
  useEffect(() => {
  const handleStorage = (e: StorageEvent) => {
    if (e.key !== "corruchart-selections" || !e.newValue) return;

    try {
      const parsed: Record<string, Reaction> = JSON.parse(e.newValue);

      const normalized = Object.entries(parsed).map(([id, value]) => ({
        id,
        value,
      }));

      setSelections(normalized);
    } catch {
      setSelections([]);
    }
  };

  window.addEventListener("storage", handleStorage);
  return () => window.removeEventListener("storage", handleStorage);
}, []);

  // ----------------------------
  // Load identity / roles
  // ----------------------------
  useEffect(() => {
    const rolesSelections = JSON.parse(
      localStorage.getItem("rolespage-option-color-states") ?? "[]"
    );
    const selectedRoles = ROLES.filter((role, idx) => rolesSelections[idx] === 1);
    setIdentityOptions(selectedRoles);
  }, []);

  // ----------------------------
  // Map selections for scoring
  // ----------------------------
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

  const isTainted = scoreData.category6Hit;

  const fillPercent = useMemo(() => {
    if (scoreData.category6Hit) return 100;
    return Math.min((scoreData.total / METER_MAX_POINTS) * 100, 100);
  }, [scoreData]);

  const colorCounts = useMemo(() => {
    const counts = Array(COLOR_HEX.length).fill(0);
    scoredSelections.forEach((sel: any) => {
      const idx = COLOR_NAMES.indexOf(sel.value);
      if (idx !== -1) counts[idx]++;
    });
    return counts;
  }, [scoredSelections]);

  // ----------------------------
  // Screenshot export
  // ----------------------------
  const exportScreenshot = async () => {
    const container = document.getElementById("results-container");
    if (!container) return;

    // Create a temporary wrapper with padding
    const wrapper = document.createElement("div");
    wrapper.style.padding = "40px"; // <-- adjust padding here
    wrapper.style.backgroundColor = PAGE_BACKGROUND_COLOR;
    wrapper.style.display = "inline-block"; // shrink to content
    wrapper.className = "text-neutral-200";
    wrapper.appendChild(container.cloneNode(true)); // clone to avoid moving the real DOM

    document.body.appendChild(wrapper); // temporarily add to DOM

    const canvas = await html2canvas(wrapper, { scale: 2, backgroundColor: PAGE_BACKGROUND_COLOR });

    document.body.removeChild(wrapper); // clean up

    const link = document.createElement("a");
    link.download = "corruchart-results.png";
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  /** Filter visible tags based on HIDDEN_TAGS */
  const visiblePositiveTags = positiveTags.filter(tag => !HIDDEN_TAGS.has(tag.tag));
  const visibleNegativeTags = negativeTags.filter(tag => !HIDDEN_TAGS.has(tag.tag));

  // ----------------------------
  // RENDER
  // ----------------------------
  return (
    <main
      className="min-h-screen text-neutral-200 px-6 py-10"
      style={{ backgroundColor: PAGE_BACKGROUND_COLOR }}
    >
        {/* Actions */}
        <div className="flex gap-3">
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
      </div><div id="results-container" className="max-w-3xl mx-auto space-y-15">
        <header className="space-y-2">
          <h1
            className="text-3xl text-center font-semibold"
            style={{ textShadow: "0px 5px 3px rgba(0,0,0,0.7)" }}
          >
            Results
          </h1>
          <p className="text-neutral-400 text-center">
            These are the results of your Corruption Chart. Feel free to save them using the "Export Screenshot" button and share with your pals.
          </p>
        </header>
        <section className="space-y-3">

          {/* 1️⃣ Current Threshold Message */}
          {!isTainted && (
        <div className="text-center text-lg text-violet-500 font-semibold mb-2">
          {(() => {
            const reachedThresholds = THRESHOLDS.filter(
              t => t.points > 0 && scoreData.total >= t.points
            );
            if (reachedThresholds.length === 0) return "";
            const highest = reachedThresholds[reachedThresholds.length - 1];
            return highest.description;
          })()}
        </div>
                )}
          {/* 2️⃣ Score Display */}
          <div className="flex justify-between text-xl text-neutral-400">
            <span style={{ textShadow: "0px 5px 3px rgba(0,0,0,0.3)" }}>Corruption</span>
            <span style={{ textShadow: "0px 5px 3px rgba(0,0,0,0.3)" }}>
              {scoreData.total} / {METER_MAX_POINTS}
            </span>
          </div>

          {/* 3️⃣ Meter Bar */}
          <div className="w-full h-4 rounded overflow-hidden" style={{ backgroundColor: "#2c2e33" }}>
            <div
              className="h-full transition-all duration-500"
              style={{
                width: `${fillPercent}%`,
                backgroundColor: isTainted ? "#8b5cf6" : "#8b5cf6",
              }}
            />
          </div>

          {/* 4️⃣ Threshold markers */}
          <div className="relative w-full h-6">
            {THRESHOLDS.filter(t => t.points > 0).map((t, i) => {
              const leftPercent = (t.points / METER_MAX_POINTS) * 100;
              const reached = isTainted || scoreData.total >= t.points;

              return (
                <div
                  key={i}
                  className="absolute top-0 text-center group"
                  style={{ left: `${leftPercent}%`, transform: 'translateX(-50%)' }}
                >
                  <div
                    className={`w-px h-4 cursor-pointer mx-auto transition-colors duration-300 ${reached ? 'bg-violet-500' : 'bg-neutral-500'
                      }`}
                  />
                  <span
                    className={`text-xl block mt-1 cursor-pointer transition-colors duration-300 ${reached ? 'text-violet-500' : 'text-neutral-400'
                      }`}
                  >
                    {i + 1}
                  </span>
                  {/* Tooltip */}
                  <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer z-50">
                    <div className="bg-black text-white text-m px-4 py-2 rounded shadow-lg relative inline-block whitespace-normal text-center max-w-[80vw]">
                      {t.description}
                      <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-2 h-2 bg-black rotate-45"></div>
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

        {/* TAG SUMMARY */}
        <section className="space-y-6">
          <h2
            className="text-3xl text-center font-semibold"
            style={{ textShadow: "0px 5px 3px rgba(0,0,0,0.7)" }}
          >
            Tag Affinities
          </h2>
          <p className="text-neutral-400 text-center">
            These are the tags of the interests you're most into, and tags of the interests you're most disgusted by.
          </p>

          {/* Positive Tags */}
          <div>
            <h3 className="text-xl font-semibold mb-2">Most Positive Tags</h3>
            {visiblePositiveTags.length === 0 ? (
              <p className="text-neutral-400">No positive reactions yet.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                  {visiblePositiveTags.map(tag => (
                  <span
                    key={tag.tag}
                    className="bg-green-600 px-3 py-1 rounded-full text-sm cursor-pointer"
                    onClick={() => setOpenTag(openTag === tag.tag ? null : tag.tag)}
                  >
                    {tag.tag.toUpperCase()} ({tag.positive.length})
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Negative Tags */}
          <div>
            <h3 className="text-xl font-semibold mb-2">Most Negative Tags</h3>
            {visibleNegativeTags.length === 0 ? (
              <p className="text-neutral-400">No negative reactions yet.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                  {visibleNegativeTags.map(tag => (
                  <span
                    key={tag.tag}
                    className="bg-red-600 px-3 py-1 rounded-full text-sm cursor-pointer"
                    onClick={() => setOpenTag(openTag === tag.tag ? null : tag.tag)}
                  >
                    {tag.tag.toUpperCase()} ({tag.negative.length})
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Show expanded options for selected tag */}
          {openTag && (
            <div className="mt-4 p-2 bg-neutral-800 rounded">
              <h4 className="font-semibold mb-2">{openTag.toUpperCase()} Options</h4>
              <ul className="list-disc pl-5">
                {positiveTags.find(t => t.tag === openTag)?.positive.map(opt => (
                  <li key={opt.id} className="text-green-400">{opt.label}</li>
                ))}
                {negativeTags.find(t => t.tag === openTag)?.negative.map(opt => (
                  <li key={opt.id} className="text-red-400">{opt.label}</li>
                ))}
              </ul>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
