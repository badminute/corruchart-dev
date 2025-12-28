"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import html2canvas from "html2canvas-pro";
import { computeScore, THRESHOLDS, CATEGORY_POINTS, CategoryId } from "@/data/scoring";
import { OPTIONS } from "@/data/options";

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

export default function ResultsPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [userOptions, setUserOptions] = useState<{ category: CategoryId; value: string }[]>([]);
  const [scoreData, setScoreData] = useState({ total: 0, category6Hit: false });

  /** Load persisted options and compute score */
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const savedStates: number[] = JSON.parse(saved);
      const valMap = ["Indifferent", "Highly Dislike", "Dislike", "Mildly Like", "Like", "Love"];

      const optionsWithValues = OPTIONS.map((opt, i) => ({
        category: (opt as any).category || 1,
        value: valMap[savedStates[i] % valMap.length],
      }));

      setUserOptions(optionsWithValues);
      setScoreData(computeScore(optionsWithValues));
    }
  }, []);

  /** Screenshot handler */
  const exportScreenshot = async () => {
    if (!containerRef.current) return;

    const canvas = await html2canvas(containerRef.current, {
      backgroundColor: "#262626",
      scale: 2,
      onclone: (doc) => {
        const root = doc.body;
        root.querySelectorAll("*").forEach((el) => {
          const htmlEl = el as HTMLElement;
          htmlEl.className = htmlEl.className
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
          htmlEl.style.color ||= "#ffffff";
          htmlEl.style.backgroundColor ||= "transparent";
          htmlEl.style.borderColor ||= "transparent";
        });
      },
    });

    const link = document.createElement("a");
    link.download = "results-screenshot.png";
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  if (!userOptions.length) {
    return (
      <main className="min-h-screen bg-neutral-800 px-8 py-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-white mb-6">Results</h1>
          <p className="text-gray-300 mb-6">No data available yet.</p>
          <Link
            href="/corruchart"
            className="px-4 py-2 rounded bg-neutral-700 text-neutral-200 hover:bg-neutral-600 cursor-pointer"
          >
            Go to Chart
          </Link>
        </div>
      </main>
    );
  }

  // Dynamically calculate maxPoints (sum of "Love" for all non-category6 options)
  const maxPoints = OPTIONS.reduce((sum, opt) => {
    const cat: CategoryId = (opt as any).category || 1;
    return cat !== 6 ? sum + CATEGORY_POINTS[cat].love : sum;
  }, 0);

  const fillPercentage = Math.min((scoreData.total / maxPoints) * 100, 100);

  return (
    <main className="min-h-screen bg-neutral-800 px-8 py-8">
      <div className="max-w-4xl mx-auto" ref={containerRef}>
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-white">Results Summary</h1>
          <div className="flex gap-2">
            <button
              onClick={exportScreenshot}
              className="px-4 py-2 rounded bg-neutral-700 text-neutral-200 hover:bg-neutral-600 cursor-pointer"
            >
              Export Screenshot
            </button>
            <Link
              href="/corruchart"
              className="px-4 py-2 rounded bg-neutral-700 text-neutral-200 hover:bg-neutral-600 cursor-pointer"
            >
              Back to Chart
            </Link>
          </div>
        </div>

        {/* Score Meter */}
        <div className="bg-neutral-900 rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold text-white mb-4">Score Meter</h2>
          <div className="w-full bg-neutral-700 rounded-full h-6 relative">
            <div
              className="bg-purple-600 h-6 rounded-full transition-all duration-500"
              style={{ width: `${fillPercentage}%` }}
            />
            {THRESHOLDS.slice(0, 5).map((t, i) => {
              const markerPercent = (t.points / maxPoints) * 100;
              return (
                <div
                  key={i}
                  className="absolute top-0 bottom-0 w-px bg-white"
                  style={{ left: `${markerPercent}%` }}
                />
              );
            })}
          </div>
          <div className="flex justify-between mt-2 text-sm text-gray-300">
            {THRESHOLDS.map((t, i) => (
              <span key={i}>{t.label}</span>
            ))}
          </div>
          {scoreData.category6Hit && (
            <div className="mt-2 text-yellow-400 font-semibold">
              Category 6 threshold reached!
            </div>
          )}
        </div>

        {/* Distribution by Category */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {COLOR_HEX.map((hex, i) => {
            const count = userOptions.filter((opt) => {
              const valMap = ["Indifferent", "Highly Dislike", "Dislike", "Mildly Like", "Like", "Love"];
              return valMap[i] === opt.value;
            }).length;
            const percentage = userOptions.length > 0 ? ((count / userOptions.length) * 100).toFixed(1) : "0";
            return (
              <div key={i} className="bg-neutral-900 rounded-lg p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span
                      style={{ backgroundColor: hex }}
                      className="w-5 h-5 rounded-full border border-black"
                    />
                    <span className="text-gray-200">{COLOR_NAMES[i]}</span>
                  </div>
                  <div className="text-right">
                    <div className="text-white font-medium">{count.toLocaleString()}</div>
                    <div className="text-gray-400 text-sm">{percentage}%</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </main>
  );
}
