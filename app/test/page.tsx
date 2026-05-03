"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, useRef } from "react";
import { deriveTopTagsFromOptionIds } from "@/lib/deriveSetTags";
import { GROUPS } from "@/data/groups";
import { OPTIONS } from "@/data/options";
import { DESCRIPTIONS } from "@/data/descriptions";
import { TEST_PAGE_SETS, DEFAULT_TEST_PAGE_CHUNK_SIZE, TEST_PAGE_OPTION_IDS } from "@/data/testPages";
import type { TestPageSet } from "@/data/testPages";
import SettingsButton from "@/components/SettingsButton";
import OptionsGrid from "@/components/OptionsGrid";
import { WelcomeSlideshow } from "@/components/onboarding";
import { useSettings } from "@/components/SettingsContext";
import ChangelogFeedbackModal from "@/components/ChangelogFeedbackModal";
import type { Option as BaseOption } from "@/types/option";
import { logMissingTestPageSetOptionIds } from "@/data/testPages";

logMissingTestPageSetOptionIds();
const COLOR_NAMES = [
  "indifferent/unset",
  "disgust",
  "dislike",
  "maybe",
  "like",
  "love",
  "lust",
] as const;

const STATE_TO_VALUE = [
  "indifferent",
  "disgust",
  "dislike",
  "maybe",
  "like",
  "love",
  "lust",
] as const;

const RESULTS_KEY = "combined-selections";
const GROUP_STATES_KEY = "test-mode-group-states";
const SET_STATES_KEY = "test-mode-set-states";
const CURRENT_SET_KEY = "test-mode-current-set-id";

function chunkArray<T>(arr: T[], size: number) {
  const result: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    result.push(arr.slice(i, i + size));
  }
  return result;
}

type OptionWithCategory = BaseOption & {
  category: number;
};

type Slot = {
  slotId: string;
  options: OptionWithCategory[];
};

type FilteredItem = {
  slot: Slot;
  option: OptionWithCategory;
  index: number;
};

function wholeWordSearch(query: string, text: string): boolean {
  const queryWords = query.toLowerCase().split(/\s+/).filter(Boolean);
  const textLower = text.toLowerCase();
  
  return queryWords.some((word) => {
    const wordBoundaryRegex = new RegExp(`\\b${word}`, "i");
    return wordBoundaryRegex.test(textLower);
  });
}

export default function TestPage() {
  const { colourblindMode, reverseColorCycle, scrollCycling } = useSettings();
  const [showWelcome, setShowWelcome] = useState(false);
  const [showChangelog, setShowChangelog] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [showSetsModal, setShowSetsModal] = useState(false);
  const [setsSearchQuery, setSetsSearchQuery] = useState("");
  const [groupStates, setGroupStates] = useState<Record<string, Record<string, number>>>({});
  const [starStates, setStarStates] = useState<Record<string, number>>({});
  const [states, setStates] = useState<number[]>([]);
  const [activePluses, setActivePluses] = useState<{ index: number; id: string; state: number }[]>([]);
  const [activeVariant, setActiveVariant] = useState<Record<string, number>>({});
  const [currentPage, setCurrentPage] = useState(0);
  const [openDescription, setOpenDescription] = useState<string | null>(null);
  const [openTagDescription, setOpenTagDescription] = useState<string | null>(null);

  const COLOR_HEX = useMemo(
    () =>
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

  const options = useMemo(() => {
    return OPTIONS.map((option) => ({
      ...option,
      tags: (option.tags as (string | number)[] | undefined)?.map((tag) =>
        typeof tag === "number" ? GROUPS[tag - 1]?.id || "general" : tag
      ) || ["general"],
      aka: option.aka?.map((a) => a.toUpperCase()) || [],
    }));
  }, []);

  const optionIndexById = useMemo(() => {
    const map: Record<string, number> = {};
    options.forEach((option, i) => {
      map[option.id] = i;
    });
    return map;
  }, [options]);

  const slots = useMemo(() => {
    return options.map((option) => ({
      slotId: option.id,
      options: [option],
    }));
  }, [options]);

const mergedTestPages = useMemo<TestPageSet[]>(() => {
  const baseSets =
    TEST_PAGE_SETS.length > 0
      ? TEST_PAGE_SETS
      : chunkArray(TEST_PAGE_OPTION_IDS, DEFAULT_TEST_PAGE_CHUNK_SIZE).map(
          (optionIds, index) => ({
            id: `alpha-${index + 1}`,
            name: `Alphabetical ${index + 1}`,
            tags: ["A-Z"],
            optionIds,
          })
        );

  return baseSets.map((set) => {
    if (set.id !== "newly-added-set") return set;

    return {
      ...set,
      tags: deriveTopTagsFromOptionIds(set.optionIds),
    };
  });
}, []);

  const currentPageIds = mergedTestPages[currentPage]?.optionIds ?? [];
  const currentPageName = mergedTestPages[currentPage]?.name ?? `Set ${currentPage + 1}`;
  const currentPageTags = mergedTestPages[currentPage]?.tags ?? [];
  const currentPageId = mergedTestPages[currentPage]?.id ?? `page-${currentPage}`;

  const tagMetaById = useMemo(() => {
    const map: Record<string, { id: string; name: string; scope: string }> = {};
    GROUPS.forEach((group) => {
      map[group.id] = group;
    });
    return map;
  }, []);

  const filtered: FilteredItem[] = useMemo(() => {
    const ids = new Set(currentPageIds);

    return slots.flatMap((slot) => {
      const option = slot.options[0];
      if (!ids.has(option.id)) return [];

      return [
        {
          slot,
          option,
          index: optionIndexById[option.id],
        },
      ];
    });
  }, [slots, currentPageIds, optionIndexById]);

  // TIPS MODAL
  useEffect(() => {
    const key = "test-welcome-last-shown";
    const lastShown = localStorage.getItem(key);
    const now = Date.now();
    const SIX_HOURS = 6 * 60 * 60 * 1000;

    if (!lastShown || now - Number(lastShown) >= SIX_HOURS) {
      setShowWelcome(true);
    }
  }, []);

  useEffect(() => {
    const savedRaw = localStorage.getItem(RESULTS_KEY);
    if (!savedRaw) {
      setStates(Array(options.length).fill(0));
      return;
    }

    try {
      const saved: Record<string, string> = JSON.parse(savedRaw);
      setStates(
        options.map((option) => {
          const reaction = saved[option.id] ?? "indifferent";
          switch (reaction) {
            case "disgust":
              return 1;
            case "dislike":
              return 2;
            case "maybe":
              return 3;
            case "like":
              return 4;
            case "love":
              return 5;
            case "lust":
              return 6;
            default:
              return 0;
          }
        })
      );
    } catch {
      setStates(Array(options.length).fill(0));
    }
  }, [options]);

  useEffect(() => {
    const savedRaw = localStorage.getItem(GROUP_STATES_KEY);
    if (!savedRaw) return;

    try {
      const parsed = JSON.parse(savedRaw);
      if (
        parsed &&
        typeof parsed === "object" &&
        !Array.isArray(parsed)
      ) {
        const isFlat = Object.values(parsed).every((value) => typeof value === "number");
        if (isFlat) {
          setGroupStates({ [mergedTestPages[0]?.id ?? "default"]: parsed as Record<string, number> });
        } else {
          setGroupStates(parsed as Record<string, Record<string, number>>);
        }
      }
    } catch {
      // ignore invalid saved state
    }
  }, [mergedTestPages]);

    useEffect(() => {
    localStorage.setItem(GROUP_STATES_KEY, JSON.stringify(groupStates));
    }, [groupStates]);

    useEffect(() => {
    const savedRaw = localStorage.getItem(SET_STATES_KEY);
    if (!savedRaw) return;

    try {
        const parsed = JSON.parse(savedRaw);
        if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        setStarStates(parsed as Record<string, number>);
        }
    } catch {
        // ignore invalid saved state
    }
    }, []);

    useEffect(() => {
    const savedSetId = localStorage.getItem(CURRENT_SET_KEY);
    if (!savedSetId) return;

    const index = mergedTestPages.findIndex(s => s.id === savedSetId);
    if (index >= 0) {
    setCurrentPage(index);
    }
    }, [mergedTestPages]);

    useEffect(() => {
    localStorage.setItem(SET_STATES_KEY, JSON.stringify(starStates));
    }, [starStates]);

    useEffect(() => {
    const setId = mergedTestPages[currentPage]?.id;
    if (setId) {
        localStorage.setItem(CURRENT_SET_KEY, setId);
    }
    }, [currentPage, mergedTestPages]);

    useEffect(() => {
    if (!states.length) return;
    const existingRaw = localStorage.getItem(RESULTS_KEY);
    const existing: Record<string, string> = existingRaw ? JSON.parse(existingRaw) : {};
    const selections = options.reduce((acc, option, i) => {
        acc[option.id] = STATE_TO_VALUE[states[i]];
        return acc;
    }, {} as Record<string, string>);
    localStorage.setItem(RESULTS_KEY, JSON.stringify({ ...existing, ...selections }));
    }, [states, options]);

  const updateOptionState = (index: number, direction: 1 | -1 = 1) => {
    const finalDir = reverseColorCycle ? (-direction as 1 | -1) : direction;
    setStates((prev) => {
      const next = [...prev];
      next[index] = (next[index] + finalDir + COLOR_HEX.length) % COLOR_HEX.length;

      if (next[index] >= 3) {
        const id = `${index}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
        setActivePluses((prevPluses) => [...prevPluses, { index, id, state: next[index] }]);
        setTimeout(() => {
          setActivePluses((prevPluses) => prevPluses.filter((item) => item.id !== id));
        }, 800);
      }

      return next;
    });
  };

  const cycleGroupState = (groupId: string, direction: 1 | -1 = 1) => {
    const currentState = groupStates[currentPageId]?.[groupId] ?? 0;
    const nextState = ((currentState + direction + COLOR_HEX.length) % COLOR_HEX.length) as number;

    setGroupStates((prev) => {
      const next = { ...prev };
      const pageState = { ...(next[currentPageId] ?? {}) };

      if (nextState === 0) {
        delete pageState[groupId];
      } else {
        pageState[groupId] = nextState;
      }

      if (Object.keys(pageState).length === 0) {
        delete next[currentPageId];
      } else {
        next[currentPageId] = pageState;
      }

      return next;
    });

    setStates((prev) => {
      const next = [...prev];
      const currentPageIdSet = new Set(currentPageIds);
      options.forEach((option, index) => {
        if (currentPageIdSet.has(option.id) && option.tags.includes(groupId)) {
          next[index] = nextState;
        }
      });
      return next;
    });
  };

  const cycleSetState = (direction: 1 | -1 = 1) => {
    const currentState = starStates[currentPageId] ?? 0;
    const nextState = ((currentState + direction + COLOR_HEX.length) % COLOR_HEX.length) as number;

    setStarStates((prev) => {
      const next = { ...prev };
      if (nextState === 0) {
        delete next[currentPageId];
      } else {
        next[currentPageId] = nextState;
      }
      return next;
    });

    setStates((prev) => {
      const next = [...prev];
      const currentPageIdSet = new Set(currentPageIds);
      options.forEach((option, index) => {
        if (currentPageIdSet.has(option.id)) {
          next[index] = nextState;
        }
      });
      return next;
    });
  };

  const prevPage = () => setCurrentPage((prev) => Math.max(0, prev - 1));
  const nextPage = () => setCurrentPage((prev) => Math.min(mergedTestPages.length - 1, prev + 1));

  const totalInterests = mergedTestPages.reduce((sum, page) => sum + page.optionIds.length, 0);
  const shownInterests = mergedTestPages.slice(0, currentPage).reduce((sum, page) => sum + page.optionIds.length, 0);
  const remainingInterests = Math.max(0, totalInterests - shownInterests);

  const groupButtons = GROUPS.filter((group) => group.scope === "broad");
  const narrowGroupButtons = GROUPS.filter((group) => group.scope === "narrow");

  const getPlusImage = (option: OptionWithCategory) => {
    if (option.category === 5 || option.category === 6) return "/images/corruption-potion-large.png";
    if (option.category === 4) return "/images/corruption-potion-medium.png";
    return "/images/corruption-potion-small.png";
  };

  const setMatches = useMemo(() => {
    const matches: Record<string, { labels: string[]; count: number }> = {};
    
    mergedTestPages.forEach((set) => {
      if (!setsSearchQuery.trim()) {
        matches[set.id] = { labels: [], count: set.optionIds.length };
      } else {
        const matchedLabels = set.optionIds
          .filter((optionId) => {
            const option = options.find((o) => o.id === optionId);
            if (!option) return false;
            
            const searchableFields = [
              option.id,
              option.label,
              ...(option.aka || []),
              ...option.tags
            ];
            
            return searchableFields.some((field) => wholeWordSearch(setsSearchQuery, field));
          })
          .map((optionId) => options.find((o) => o.id === optionId)?.label || optionId);
        
        matches[set.id] = { labels: matchedLabels, count: matchedLabels.length };
      }
    });
    
    return matches;
  }, [setsSearchQuery, mergedTestPages, options]);

// Change <h1> and <p> tags to say something at the top.
  return (
    <>
      <main className="min-h-screen px-4 pb-8 bg-[#1F2023] text-white">
        <div className="max-w-6xl mx-auto py-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between mb-6">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold text-violet-300"></h1>
              <p className="mt-1 max-w-2xl text-gray-300 text-xs sm:text-sm leading-snug">
                
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => setShowWelcome(true)}
                className="px-4 py-2 rounded bg-neutral-900 text-neutral-200 cursor-pointer hover:bg-violet-500/30 transition"
              >
                Guide
              </button>
            <button
            type="button"
            onClick={() => {
                const idx = mergedTestPages.findIndex(s => s.id === "newly-added-set");
                if (idx >= 0) setCurrentPage(idx);
            }}
            className="px-4 py-2.5 rounded bg-neutral-900 text-neutral-400 hover:bg-neutral-800 cursor-pointer flex items-center justify-center text-sm gap-1"
            >
            <span className="font-bold text-violet-400">NEW!</span>
            <span className="text-gray-400 text-xs">(v0.33-)</span>
            </button>
              <button
                type="button"
                onClick={() => setShowChangelog(true)}
                className="px-4 py-2 rounded bg-neutral-900 text-neutral-200 cursor-pointer hover:bg-violet-500/30 transition"
              >
                Changelog & Feedback
              </button>
              <SettingsButton />
              <Link
                href="/corruchart"
                className="px-4 py-2 rounded bg-neutral-900 text-neutral-200 hover:bg-violet-500/30 transition"
              >
                Chart Mode
              </Link>
              <Link
                href="/roles"
                className="px-4 py-2 rounded bg-neutral-900 text-neutral-200 hover:bg-violet-500/30 transition"
              >
                Next
              </Link>
            </div>
          </div>

          <section className="p-6 mb-8">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <button
                type="button"
                onClick={() => setShowSetsModal(true)}
                className="px-4 py-2 rounded bg-neutral-900 text-neutral-200 cursor-pointer hover:bg-violet-500/30 transition text-left"
              >
                <h2 className="text-xl text-violet-300 font-semibold">Set {currentPage} — {currentPageName}</h2>
              </button>
              <div className="text-right text-xs text-purple-300 space-y-0.5">
                <p>{remainingInterests} Remain</p>
              </div>
            </div>

            <div className="mt-4 flex flex-col items-center gap-4">
              <div className="flex flex-wrap justify-center gap-2" style={{ overscrollBehavior: "contain" }}>
                {/* Set Star Cycler */}
                <div className="relative flex items-center gap-2 rounded transition-all">
                  <button
                    type="button"
                    onClick={() => cycleSetState()}
                    onContextMenu={(e) => {
                      e.preventDefault();
                      cycleSetState(-1);
                    }}
                    className="relative"
                  >
                    <svg
                      className="cursor-pointer"
                      width="32"
                      height="32"
                      viewBox="0 0 24 24"
                      fill={COLOR_HEX[starStates[currentPageId] ?? 0]}
                      stroke="#000"
                      strokeWidth="0.5"
                    >
                      <path d="M12 2.5l2.9 6.1 6.7.6-5 4.4 1.5 6.5L12 16.8 5.9 20.1l1.5-6.5-5-4.4 6.7-.6L12 2.5z" />
                    </svg>
                  </button>

                  <div
                    className={`group relative text-left text-lg px-2 py-1 rounded cursor-default select-none transition-all duration-100 ${
                      (starStates[currentPageId] ?? 0) > 0 ? "text-white" : "text-gray-300"
                    }`}
                  >
                    Set {currentPage + 1}
                    <span className="block text-[10px] tracking-wide text-gray-100/80">
                      {(starStates[currentPageId] ?? 0) > 0 ? COLOR_NAMES[starStates[currentPageId] ?? 0] : "neutral"}
                    </span>
                  </div>
                </div>

                {currentPageTags.length > 0 ? (
                  currentPageTags.map((tag) => {
                    const state = groupStates[currentPageId]?.[tag] ?? 0;
                    const active = state > 0;
                    return (
                      <div
                        key={tag}
                        className="relative flex items-center gap-2 rounded transition-all"
                      >
                        <button
                          type="button"
                          onClick={() => cycleGroupState(tag)}
                          onContextMenu={(e) => {
                            e.preventDefault();
                            cycleGroupState(tag, -1);
                          }}
                          className="relative"
                        >
                          <svg
                            className="cursor-pointer"
                            width="32"
                            height="32"
                            viewBox="0 0 24 24"
                            fill={COLOR_HEX[state]}
                            stroke="#000"
                            strokeWidth="0.5"
                          >
                            <path d="M12 2.5l2.9 6.1 6.7.6-5 4.4 1.5 6.5L12 16.8 5.9 20.1l1.5-6.5-5-4.4 6.7-.6L12 2.5z" />
                          </svg>
                        </button>

                        <button
                          type="button"
                          onClick={() => setOpenTagDescription(openTagDescription === tag ? null : tag)}
                          className={`group relative text-left text-lg px-2 py-1 rounded cursor-pointer select-none transition-all duration-100 hover:bg-violet-400/10 ${
                            active ? "text-white" : "text-gray-300"
                          }`}
                        >
                          {tagMetaById[tag]?.name ?? tag}
                          <span className="block text-[10px] tracking-wide text-gray-100/80">
                            {active ? COLOR_NAMES[state] : "neutral"}
                          </span>
                        </button>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-sm text-gray-400">No tags assigned to this set. Add tags in <code className="font-mono">data/testPages.ts</code>.</p>
                )}
              </div>

              {openTagDescription && (
                <div className="max-w-3xl w-full rounded-3xl border border-neutral-800 bg-neutral-900/90 p-4 text-sm text-gray-200">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-semibold text-white">{tagMetaById[openTagDescription]?.name ?? openTagDescription}</p>
                      <p className="text-xs text-gray-400">Tag key: {openTagDescription}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setOpenTagDescription(null)}
                      className="px-2 py-1 rounded bg-neutral-800 text-neutral-200 hover:bg-violet-500/30 cursor-pointer transition text-xs"
                    >
                      Close
                    </button>
                  </div>
                  <p className="mt-3 text-gray-300">
                    {tagMetaById[openTagDescription]?.name
                      ? `This tag represents the ${tagMetaById[openTagDescription]!.name} category.`
                      : "No description available for this tag."}
                  </p>
                </div>
              )}

              <div className="flex flex-wrap justify-center gap-2">
                <button
                  type="button"
                  disabled={currentPage === 0}
                  onClick={prevPage}
                  className="px-3 py-1.5 rounded bg-neutral-900 text-neutral-200 hover:bg-violet-500/30 transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed text-sm"
                >
                  Previous Set
                </button>
                <button
                  type="button"
                  disabled={currentPage >= mergedTestPages.length - 1}
                  onClick={nextPage}
                  className="px-3 py-1.5 rounded bg-neutral-900 text-neutral-200 hover:bg-violet-500/30 transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed text-sm"
                >
                  Next Set
                </button>
              </div>
            </div>
          </section>

          <OptionsGrid
            filtered={filtered}
            states={states}
            options={options}
            activePluses={activePluses}
            activeVariant={activeVariant}
            isOptionVisible={() => true}
            getFilterBlockReasons={() => []}
            openDescription={openDescription}
            setOpenDescription={setOpenDescription}
            setActiveVariant={setActiveVariant}
            cycleColor={updateOptionState}
            compact
          />
        </div>
      </main>

      {showWelcome && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
    <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-2xl w-full max-w-4xl h-[650px] shadow-2xl flex flex-col">

      {/* Header */}
      <h2 className="text-2xl font-bold text-center text-violet-400 mb-4">
        Assessment Section
      </h2>

      {/* Description */}
      <div className="text-gray-400 text-center text-lg mb-4">
        <p>Here are some usage tips to make things smoother.</p>
      </div>

      {/* Slideshow */}
     <div className="flex-1 min-h-0 h-full">
        <WelcomeSlideshow
          images={[
            "images/potion-tips.png",
            "images/cycle.gif",
            "images/descriptions.gif",
          ]}
        />
      </div>

      {/* Button */}
      <button
        type="button"
        onClick={() => {
          setShowWelcome(false);
          localStorage.setItem("test-welcome-last-shown", Date.now().toString());
        }}
        className="w-full py-3 mt-4 bg-neutral-800 hover:bg-violet-500/30 cursor-pointer text-white font-semibold rounded-xl transition-colors"
      >
        ASSESS
      </button>

    </div>
  </div>
)}

      {showSetsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <div className="bg-neutral-900 border border-neutral-800 p-4 rounded-3xl w-full max-w-md shadow-2xl text-white">
            <div className="flex items-center justify-between mb-4 gap-3">
              <h2 className="text-2xl font-bold text-violet-300">Sets</h2>
              <input
                type="text"
                placeholder="Search options..."
                value={setsSearchQuery}
                onChange={(e) => setSetsSearchQuery(e.target.value)}
                className="flex-1 px-3 py-1.5 rounded bg-neutral-800 text-neutral-200 text-sm placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
              />
              <button
                type="button"
                onClick={() => {
                  setShowSetsModal(false);
                }}
                className="text-gray-400 text-xl cursor-pointer hover:text-white transition flex-shrink-0"
              >
                ✕
              </button>
            </div>
            <div className="space-y-2 max-h-[60vh] overflow-y-auto">
              {mergedTestPages
                .map((set, index) => ({ set, index }))
                .filter(({ set }) => !setsSearchQuery.trim() || setMatches[set.id].count > 0)
                .map(({ set, index: displayIndex }) => {
                  // Find the actual index in mergedTestPages for state management
                  const actualIndex = mergedTestPages.findIndex(s => s.id === set.id);
                  const matchData = setMatches[set.id];
                  
                  return (
                    <button
                      key={set.id}
                      type="button"
                      onClick={() => {
                        setCurrentPage(actualIndex);
                        setShowSetsModal(false);
                      }}
                      className={`w-full text-left cursor-pointer px-3 py-2.5 rounded transition-colors ${
                        currentPage === actualIndex
                          ? "bg-violet-500/40 text-white"
                          : "bg-neutral-800 text-neutral-200 hover:bg-neutral-700"
                      }`}
                    >
                      <div className="font-semibold">{displayIndex} - {set.name}</div>
                      {setsSearchQuery.trim() && matchData.count > 0 ? (
                        <div className="text-xs text-gray-300">
                          {matchData.labels.join(", ")}
                        </div>
                      ) : (
                        <div className="text-xs text-gray-400">{matchData.count} interests</div>
                      )}
                    </button>
                  );
                })}
            </div>
          </div>
        </div>
      )}

      <ChangelogFeedbackModal
        showChangelog={showChangelog}
        setShowChangelog={setShowChangelog}
        isTestMode={true}
      />
    </>
  );
}
