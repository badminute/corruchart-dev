"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import html2canvas from "html2canvas-pro";

import { computeTagScores, TagBreakdown } from "@/lib/tagScores";
import { Reaction } from "@/data/scoring";
import { OPTIONS } from "@/data/options";
import { ROLES } from "@/data/roles";
import { computeScore, THRESHOLDS } from "@/data/scoring";
import { ROLE_SYMBOLS } from "@/data/roleSymbols";
import TagAffinityDrilldown from "@/components/tags/TagAffinityDrilldown";

const METER_MAX_POINTS = 3000;
const PAGE_BACKGROUND_COLOR = "#1F2023";
const MAX_FAVORITES = 25;
const FAVORITES_KEY = "corruchart-favorites";
const HIDDEN_TAGS = new Set<string>(["upper-body", "dynamics", "qualities", "acts", "lower-body", "misc", "roles-themes"]);

export default function ResultsPage() {
  // ----------------------------
  // STATE
  // ----------------------------
  const [selections, setSelections] = useState<any[]>([]);
  const [identityOptions, setIdentityOptions] = useState<typeof ROLES>([]);
  const [positiveTags, setPositiveTags] = useState<TagBreakdown[]>([]);
  const [negativeTags, setNegativeTags] = useState<TagBreakdown[]>([]);
  const [openTag, setOpenTag] = useState<string | null>(null);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [openTagInfo, setOpenTagInfo] = useState<{ tag: string; type: "positive" | "negative" } | null>(null);
  const [openDescription, setOpenDescription] = useState<string | null>(null);

  const ROLE_SECTION_SYMBOLS: Record<
    string,
    {
      symbol: string;
      color: string;
    }
  > = {
    identity: {
      symbol: "◆", // replace with your unicode
      color: "text-sky-400",
    },
    roles: {
      symbol: "▲",
      color: "text-red-400",
    },
    fun: {
      symbol: "●",
      color: "text-purple-400",
    },
  };
  

  const ROLE_SECTIONS: {
    key: string;
    title: string;
    tags: string[];
  }[] = [
      {
        key: "identity",
        title: "Identities",
        tags: [
          "Sex",
          "Gender",
          "Gender Expression",
          "Sexual Orientation",
        ],
      },
      {
        key: "roles",
        title: "BDSM & Sex Roles",
        tags: [
          "Sex Roles",
          "Bondage & Discipline",
          "Domination & Submission",
          "BDSM Roles Cont.",
          "Sadism & Masochism",
        ],
      },
      {
        key: "fun",
        title: "Fun Roles",
        tags: ["Fun Roles"],
      },
  ];

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
    "indifferent",
    "disgust",
    "dislike",
    "like",
    "love",
    "lust",
  ];

  const METER_MAX_POINTS = 3000;
  const PAGE_BACKGROUND_COLOR = "#1F2023";

  // === Tags you want to hide from results ===
  const HIDDEN_TAGS = new Set<string>([
    "upper-body",
    "dynamics",
    "qualities",
    "acts",
    "lower-body",
    "misc",
    "roles-themes"
  ]);

  const allTags = [...positiveTags, ...negativeTags]; // or however you combine them

  // filter out the hidden tags
  const visibleTags = allTags.filter(tag => !HIDDEN_TAGS.has(tag.tag));
  

  // ----------------------------
  // Allow ESCAPE key to close tag info
  // ----------------------------
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpenTagInfo(null); // clear the tuple state
      }
    };

    window.addEventListener("keydown", handleEscape);
    return () => {
      window.removeEventListener("keydown", handleEscape);
    };
  }, []);


  // ----------------------------
  // Organize roles by section
  // ----------------------------  
  const rolesBySection = useMemo(() => {
    return ROLE_SECTIONS.map(section => {
      const roles = identityOptions.filter(role =>
        role.tags?.some(tag => section.tags.includes(tag))
      );

      return {
        ...section,
        roles,
      };
    }).filter(section => section.roles.length > 0);
  }, [identityOptions]);

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

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpenTag(null);
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, []);

  // ----------------------------
  // Load favorites
  // ----------------------------
  useEffect(() => {
  const saved = localStorage.getItem(FAVORITES_KEY);
  if (!saved) return;

  try {
    const parsed = JSON.parse(saved);
    if (Array.isArray(parsed)) {
      setFavorites(parsed.slice(0, MAX_FAVORITES));
    }
  } catch {
    setFavorites([]);
  }
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

  const isFavorite = (id: string) => favorites.includes(id);

  const toggleFavorite = (id: string) => {
    setFavorites(prev => {
      let next: string[];

      if (prev.includes(id)) {
        next = prev.filter(f => f !== id);
      } else {
        if (prev.length >= MAX_FAVORITES) return prev;
        next = [...prev, id];
      }

      localStorage.setItem(FAVORITES_KEY, JSON.stringify(next));
      return next;
    });
  };


    const favoriteOptions = useMemo(() => {
    return favorites
      .map(id => OPTIONS.find(o => o.id === id))
      .filter(Boolean);
  }, [favorites]);

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
  const allVisibleTags = useMemo(() => {
    const combined = [...visiblePositiveTags, ...visibleNegativeTags];
    // Deduplicate by tag name
    return Array.from(new Map(combined.map(t => [t.tag, t])).values());
  }, [visiblePositiveTags, visibleNegativeTags]);

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
          <div className="flex justify-between text-xl text-violet-400">
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
                  <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity z-50">
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
        {rolesBySection.length > 0 && (
          <section className="mt-6 space-y-6">
            <div className="flex flex-col md:flex-row md:justify-center md:gap-6 gap-6">
              {rolesBySection.map((section) => (
                <div key={section.key} className="md:flex-1 md:max-w-sm">
                  <h3 className="text-lg text-center font-semibold text-neutral-300 mb-2">
                    {section.title}
                  </h3>

                  <div className="flex flex-wrap gap-2 justify-center">
                    {section.roles.map((role) => (
                      <div
                        key={role.id}
                        className="flex items-center gap-1 text-white text-sm bg-neutral-800 px-2 py-1 rounded shadow-sm"
                      >
                        {/* Per-role symbol */}
                        <span
                          className="flex-shrink-0 w-6 text-center font-bold"
                          style={{
                            color: ROLE_SYMBOLS[role.id]?.color ?? "#fff",
                            fontSize: "18px",
                          }}
                        >
                          {ROLE_SYMBOLS[role.id]?.symbol ?? "★"}
                        </span>

                        <span>{role.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}



        {/* FAVORITE OPTIONS */}
        <section className="mt-6">
          <h2
            className="text-xl text-center font-semibold text-yellow-400 mb-3"
            style={{ textShadow: "0px 3px 2px rgba(0,0,0,0.6)" }}
          >
            Favorites
          </h2>

          {favoriteOptions.length === 0 ? (
            <p className="text-neutral-400 text-center">
              No favorites selected. 
            </p>
          ) : (
            <div className="flex flex-wrap gap-2 justify-center">
              {favoriteOptions.map(opt => (
                <div
                  key={opt!.id}
                  className="flex items-center gap-1 bg-neutral-800 text-sm text-white px-2 py-1 rounded shadow-sm"
                >
                  <span>{opt!.label}</span>
                  <button
                    onClick={() => toggleFavorite(opt!.id)}
                    className="text-yellow-400 text-sm ml-1 cursor-pointer hover:text-yellow-300 transition-colors"
                    title="Remove favorite"
                  >
                    ★
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>


        {/* TAG AFFINITIES */}
        <section className="space-y-6 relative">
          <div className="flex items-center justify-center gap-2 mb-4">
            <h3 className="text-xl font-semibold" style={{ textShadow: "0 2px 4px rgba(0,0,0,0.3)" }}>
              Tag Affinities
            </h3>
            <span
              onClick={() =>
                setOpenTagInfo(prev =>
                  prev?.tag === "__positive_help" ? null : { tag: "__positive_help", type: "positive" }
                )
              }
              className="w-4 h-4 flex items-center justify-center rounded-full text-[9px] font-bold bg-neutral-800 text-gray-300 border border-neutral-600 cursor-pointer"
              title="Show help for positive tags"
            >
              ?
            </span>
          </div>

          {openTagInfo?.tag === "__positive_help" && (
            <div className="absolute -top-32 left-1/2 transform -translate-x-1/2 z-50 w-64 p-3 bg-neutral-900 text-gray-200 rounded shadow-lg text-center">
              These are the tags you reacted most positively to. From here you can add and remove up to 25 interests to your favorites.
            </div>
          )}

          {/* ✅ Replaced old Positive/Negative tags section with TagAffinityDrilldown */}
          <TagAffinityDrilldown
            tags={allVisibleTags}
            favorites={favorites}
            toggleFavorite={toggleFavorite}
          />
        </section>
      </div>
    </main>
  );
}
