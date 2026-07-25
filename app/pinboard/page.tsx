"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import Link from "next/link";

import { OPTIONS } from "@/data/options";
import { useSettings } from "@/components/SettingsContext";
import SettingsButton from "@/components/SettingsButton";
import ChangelogFeedbackModal from "@/components/ChangelogFeedbackModal";
import GuideModal from "@/components/GuideModal";

const MAX_PINS = 30;
const PINS_KEY = "corruchart-favorites";
const RESULTS_KEY = "combined-selections";
const GUIDE_VERSION = "0.36.0";
const CHANGELOG_VERSION = "0.35.0";

const COLOR_NAMES = [
  "indifferent",
  "disgust",
  "dislike",
  "maybe",
  "like",
  "love",
  "lust",
] as const;

export default function PinboardPage() {
  const { colourblindMode } = useSettings();
  const [pins, setPins] = useState<string[]>([]);
  const [selections, setSelections] = useState<{ id: string; value: string }[]>([]);
  const [showChangelog, setShowChangelog] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [hasNewUpdate, setHasNewUpdate] = useState(false);
  const [hasNewGuide, setHasNewGuide] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const COLOR_HEX = useMemo(() =>
    colourblindMode
      ? [
          "#828282ff",
          "#d62728",
          "#ff7f0e",
          "#ffb347",
          "#1f77b4",
          "#aec7e8",
          "#9467bd",
        ]
      : [
          "#828282ff",
          "#e74c3c",
          "#fc8d59",
          "#ffd700",
          "#27ae60",
          "#37bdf6ff",
          "#c88de8ff",
        ],
    [colourblindMode]
  );

  useEffect(() => {
    const readSelections = () => {
      const savedRaw = localStorage.getItem(RESULTS_KEY);
      if (!savedRaw) {
        setSelections([]);
        return;
      }

      try {
        const parsed = JSON.parse(savedRaw) as Record<string, string>;
        const next = Object.entries(parsed).map(([id, value]) => ({ id, value }));
        setSelections(next);
      } catch {
        setSelections([]);
      }
    };

    readSelections();
    window.addEventListener("storage", readSelections);
    return () => window.removeEventListener("storage", readSelections);
  }, []);

  useEffect(() => {
    const readPins = () => {
      const savedRaw = localStorage.getItem(PINS_KEY);
      if (!savedRaw) {
        setPins([]);
        return;
      }

      try {
        const parsed = JSON.parse(savedRaw) as string[];
        if (Array.isArray(parsed)) {
          setPins(parsed.slice(0, MAX_PINS));
        } else {
          setPins([]);
        }
      } catch {
        setPins([]);
      }
    };

    readPins();
    window.addEventListener("storage", readPins);
    return () => window.removeEventListener("storage", readPins);
  }, []);

  useEffect(() => {
    const key = "pinboard-guide-last-shown";
    const lastShown = localStorage.getItem(key);
    const now = Date.now();
    const SIX_HOURS = 6 * 60 * 60 * 1000;

    if (!lastShown || now - Number(lastShown) >= SIX_HOURS) {
      setShowGuide(true);
    }
  }, []);

  useEffect(() => {
    const seen = localStorage.getItem("pinboard-changelog-seen");
    if (seen !== CHANGELOG_VERSION) {
      setHasNewUpdate(true);
    }
  }, []);

  useEffect(() => {
    if (GUIDE_VERSION.length === 0) {
      setHasNewGuide(false);
      return;
    }

    const seen = localStorage.getItem("pinboard-guide-seen");
    if (seen !== GUIDE_VERSION) {
      setHasNewGuide(true);
    } else {
      setHasNewGuide(false);
    }
  }, []);

  const openGuide = () => setShowGuide(true);

  const markGuideSeen = () => {
    localStorage.setItem("pinboard-guide-seen", GUIDE_VERSION);
    setHasNewGuide(false);
  };

  const closeGuide = () => {
    setShowGuide(false);
    localStorage.setItem("pinboard-guide-last-shown", Date.now().toString());
  };

  const openChangelog = () => {
    setShowChangelog(true);
    if (hasNewUpdate) {
      localStorage.setItem("pinboard-changelog-seen", CHANGELOG_VERSION);
      setHasNewUpdate(false);
    }
  };

  const togglePin = (id: string) => {
    setPins((prev) => {
      let next: string[];

      if (prev.includes(id)) {
        next = prev.filter((pinId) => pinId !== id);
      } else {
        if (prev.length >= MAX_PINS) return prev;
        next = [...prev, id];
      }

      localStorage.setItem(PINS_KEY, JSON.stringify(next));
      return next;
    });
  };

  const handleFeedbackSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);

    try {
      const response = await fetch("https://formsubmit.co/ajax/badminute@protonmail.com", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        alert("Feedback sent! Thank you.");
        form.reset();
        setShowChangelog(false);
      } else {
        alert("Error submitting form.");
      }
    } catch (err) {
      console.error("Failed to submit form:", err);
      alert("Failed to send feedback. Please try again.");
    }
  };

  const orderedOptions = useMemo(() => {
    return [...OPTIONS].sort((a, b) => a.label.localeCompare(b.label));
  }, []);

  const filteredOptions = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return orderedOptions;

    return orderedOptions.filter((option) => {
      const haystacks = [option.label, ...(option.aka ?? [])].join(" ").toLowerCase();
      return haystacks.includes(query);
    });
  }, [orderedOptions, searchQuery]);

  const pinnedOptions = useMemo(() => {
    return pins
      .map((id) => OPTIONS.find((option) => option.id === id))
      .filter((option): option is (typeof OPTIONS)[number] => Boolean(option));
  }, [pins]);

  const pinnedPositiveOptions = useMemo(() => {
    return pinnedOptions.filter((option) => {
      const selection = selections.find((item) => item.id === option.id);
      const reaction = selection?.value ?? "indifferent";
      return COLOR_NAMES.indexOf(reaction as (typeof COLOR_NAMES)[number]) >= 4;
    });
  }, [pinnedOptions, selections]);

  const pinnedNegativeOptions = useMemo(() => {
    return pinnedOptions.filter((option) => {
      const selection = selections.find((item) => item.id === option.id);
      const reaction = selection?.value ?? "indifferent";
      return [1, 2].includes(COLOR_NAMES.indexOf(reaction as (typeof COLOR_NAMES)[number]));
    });
  }, [pinnedOptions, selections]);

  return (
    <>
      <ChangelogFeedbackModal
        showChangelog={showChangelog}
        setShowChangelog={setShowChangelog}
        onFeedbackSubmit={handleFeedbackSubmit}
        hasNewUpdate={hasNewUpdate}
        setHasNewUpdate={setHasNewUpdate}
      />

      <GuideModal
        isOpen={showGuide}
        onClose={closeGuide}
        title="Pinboard"
        description="Pin a few interests here before you continue to roles."
        buttonLabel="CONTINUE"
        newTipIndices={hasNewGuide ? [0, 1] : []}
        onMarkSeen={markGuideSeen}
        tips={[
          { title: "Pinning Interests", images: ["images/pins.gif"] },
          { title: "Searching All Interests", images: ["images/search-interests.gif"] },
        ]}
      />

      <main className="min-h-screen px-6 pb-12" style={{ backgroundColor: "#1F2023" }}>
        <div className="mx-auto flex max-w-6xl flex-col gap-6 py-4">
          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={openChangelog}
              className={`rounded bg-neutral-900 px-4 py-2.5 text-sm font-semibold text-neutral-200 transition hover:bg-neutral-800 ${hasNewUpdate ? "ring-2 ring-violet-400" : ""}`}
            >
              Changelog & Feedback
            </button>
            <button
              type="button"
              onClick={openGuide}
              className={`rounded bg-neutral-900 px-4 py-2.5 text-sm font-semibold text-neutral-200 transition hover:bg-neutral-800 ${hasNewGuide ? "ring-2 ring-violet-400" : ""}`}
            >
              Guide
            </button>
            <SettingsButton />
            <Link
              href="/corruchart"
              className="rounded bg-neutral-900 px-4 py-2.5 text-sm font-semibold text-neutral-200 transition hover:bg-violet-500/30"
            >
              Back
            </Link>
            <Link
              href="/roles"
              className="rounded bg-neutral-900 px-4 py-2.5 text-sm font-semibold text-neutral-200 transition hover:bg-violet-500/30"
            >
              Next
            </Link>
            <button
              type="button"
              onClick={() => setShowSearchModal(true)}
              className="rounded bg-neutral-900 px-4 py-2.5 text-sm font-semibold text-neutral-200 transition hover:bg-violet-500/30"
            >
              Search
            </button>
          </div>

          <div className="text-center">
            <h1 className="text-3xl font-semibold text-white">Pinboard</h1>
            <p className="mt-2 text-sm text-neutral-400">
              Pin interests here before you continue to roles.
            </p>
          </div>

          <div className="rounded-2xl border border-neutral-600 bg-neutral-900/70 p-6">
            <section className="space-y-4">
              <div className="flex items-center justify-center gap-2">
                <h2 className="text-xl font-semibold text-neutral-300">Pinned</h2>
              </div>

              {pinnedOptions.length > 0 ? (
                <div className="space-y-3">
                  {pinnedPositiveOptions.length > 0 && (
                    <div className="flex flex-wrap justify-center gap-3">
                      {pinnedPositiveOptions.map((option) => {
                        const selection = selections.find((item) => item.id === option.id);
                        const reaction = selection?.value ?? "indifferent";
                        const colorIndex = COLOR_NAMES.indexOf(reaction as (typeof COLOR_NAMES)[number]);
                        const textColor = COLOR_HEX[colorIndex] ?? "#e5e7eb";

                        return (
                          <div
                            key={option.id}
                            className="flex items-center gap-2 rounded border border-neutral-700 bg-neutral-800 px-3 py-1 text-sm font-medium text-neutral-200 shadow-sm"
                          >
                            <span style={{ color: textColor }}>{option.label}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {pinnedNegativeOptions.length > 0 && (
                    <div className="flex flex-wrap justify-center gap-3">
                      {pinnedNegativeOptions.map((option) => {
                        const selection = selections.find((item) => item.id === option.id);
                        const reaction = selection?.value ?? "indifferent";
                        const colorIndex = COLOR_NAMES.indexOf(reaction as (typeof COLOR_NAMES)[number]);
                        const textColor = COLOR_HEX[colorIndex] ?? "#e5e7eb";

                        return (
                          <div
                            key={option.id}
                            className="flex items-center gap-2 rounded border border-neutral-700 bg-neutral-800 px-3 py-1 text-sm font-medium text-neutral-200 shadow-sm"
                          >
                            <span style={{ color: textColor }}>{option.label}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-center text-sm text-neutral-500">
                  No pins yet. Search to add some interests.
                </p>
              )}
            </section>
          </div>
        </div>
      </main>

      {showSearchModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setShowSearchModal(false)}
        >
          <div
            className="w-full max-w-md rounded-3xl border border-neutral-800 bg-neutral-900 p-4 text-white shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="text-2xl font-bold text-violet-300">Interests</h2>
              <input
                type="text"
                placeholder="Search options..."
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                className="flex-1 rounded bg-neutral-800 px-3 py-1.5 text-sm text-neutral-200 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
              />
              <button
                type="button"
                onClick={() => setShowSearchModal(false)}
                className="flex-shrink-0 text-xl text-gray-400 transition hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="max-h-[60vh] space-y-2 overflow-y-auto">
              {filteredOptions.map((option) => {
                const isPinned = pins.includes(option.id);

                return (
                  <div
                    key={option.id}
                    className="flex items-center justify-between gap-2 rounded bg-neutral-800 px-3 py-2"
                  >
                    <span className="text-sm text-neutral-200">{option.label}</span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => togglePin(option.id)}
                        disabled={isPinned}
                        className={`rounded px-2.5 py-1 text-xs font-semibold transition ${
                          isPinned
                            ? "cursor-not-allowed bg-neutral-700 text-neutral-500"
                            : "bg-violet-600 text-white hover:bg-violet-500"
                        }`}
                      >
                        Add Pin
                      </button>
                      <button
                        type="button"
                        onClick={() => togglePin(option.id)}
                        disabled={!isPinned}
                        className={`rounded px-2.5 py-1 text-xs font-semibold transition ${
                          isPinned
                            ? "bg-neutral-700 text-neutral-100 hover:bg-neutral-600"
                            : "cursor-not-allowed bg-neutral-800 text-neutral-500"
                        }`}
                      >
                        Remove Pin
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
