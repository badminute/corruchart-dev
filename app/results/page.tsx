"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import html2canvas from "html2canvas-pro"; // Using html2canvas-pro for better compatibility 

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
  const [states, setStates] = useState<number[]>([]);
  const [summary, setSummary] = useState<Record<number, number>>({});

  /** Load persisted state */
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      setStates(parsed);

      const counts: Record<number, number> = {};
      parsed.forEach((state: number) => {
        counts[state] = (counts[state] || 0) + 1;
      });
      setSummary(counts);
    }
  }, []);

  const totalSelections = states.length;

  /** Screenshot handler (html2canvas-safe) */
  const handleScreenshot = async () => {
    if (!containerRef.current) return;

    const canvas = await html2canvas(containerRef.current, {
      backgroundColor: "#262626",
      scale: 2,
      onclone: (doc) => {
        const root = doc.body;

        root.querySelectorAll("*").forEach((el) => {
          const htmlEl = el as HTMLElement;

          // Remove Tailwind color classes
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

          // Fallback colors
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

  if (!states.length) {
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

  return (
    <main className="min-h-screen bg-neutral-800 px-8 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-white">Results Summary</h1>
          <div className="flex gap-2">
            <button
              onClick={handleScreenshot}
              className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-500"
            >
              Screenshot
            </button>
            <Link
              href="/corruchart"
              className="px-4 py-2 rounded bg-neutral-700 text-neutral-200 hover:bg-neutral-600 cursor-pointer"
            >
              Back to Chart
            </Link>
          </div>
        </div>

        {/* Distribution by Category */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8" ref={containerRef}>
          <div className="bg-neutral-900 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-white mb-4">Distribution by Category</h2>
            <div className="space-y-4">
              {COLOR_HEX.map((hex, i) => {
                const count = summary[i] || 0;
                const percentage = totalSelections > 0 ? ((count / totalSelections) * 100).toFixed(1) : "0";
                return (
                  <div key={i} className="flex items-center justify-between">
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
                );
              })}
            </div>
          </div>

          {/* Totals */}
          <div className="bg-neutral-900 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-white mb-4">Totals</h2>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-300">Total Options:</span>
                <span className="text-white font-medium">{totalSelections.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-300">Options Selected:</span>
                <span className="text-white font-medium">
                  {(totalSelections - (summary[0] || 0)).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-300">Still Indifferent:</span>
                <span className="text-white font-medium">{(summary[0] || 0).toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
