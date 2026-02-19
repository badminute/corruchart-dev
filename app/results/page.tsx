"use client";

import { useEffect, useMemo, useState, useRef } from "react";
import Link from "next/link";
import html2canvas from "html2canvas-pro";
import type { CategoryId } from "@/data/scoring";
import { computeTagScores, TagBreakdown } from "@/lib/tagScores";
import { Reaction } from "@/data/scoring";
import { OPTIONS } from "@/data/options";
import { ROLES } from "@/data/roles";
import { computeScore, THRESHOLDS } from "@/data/scoring";
import { ROLE_SYMBOLS,  } from "@/data/roleSymbols";
import TagAffinityDrilldown from "@/components/tags/TagAffinityDrilldown";
import { narrowTagsCheck } from "@/lib/utils";
import { NARROW_TAGS } from "@/data/narrowTags";
import { WelcomeSlideshow } from "@/components/onboarding";


const broadOnlyIds = narrowTagsCheck(OPTIONS, NARROW_TAGS);
const METER_MAX_POINTS = 5000;
const PAGE_BACKGROUND_COLOR = "#1F2023";
const MAX_FAVORITES = 28;
const FAVORITES_KEY = "corruchart-favorites";


console.log("Broad-only option IDs:", broadOnlyIds);



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
    const warnedOptionsRef = useRef<Set<string>>(new Set());
    const [openDescription, setOpenDescription] = useState<string | null>(null);
    const clipIdRef = useRef(`wiggle-${Math.random().toString(36).slice(2)}`);
    const [clipId, setClipId] = useState<string | null>(null);
    const [feedbackOpen, setFeedbackOpen] = useState(false);
    const [popupPos, setPopupPos] = useState<{ x: number; y: number } | null>(null);
    const dragStartRef = useRef<{ x: number; y: number; mouseX: number; mouseY: number } | null>(null);
    const [isWelcomeOpen, setIsWelcomeOpen] = useState(true);
    const [isTagSearchOpen, setIsTagSearchOpen] = useState(false);
    const [tagSearchQuery, setTagSearchQuery] = useState("");


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


const tagSearchResults = useMemo(() => {
  const q = tagSearchQuery.trim().toLowerCase();
  if (!q) return [];

  return OPTIONS.filter(opt =>
    opt.tags?.some(tag => !HIDDEN_TAGS.has(tag)) &&
    opt.label.toLowerCase().includes(q) &&
    // Only include options that the user reacted to (not indifferent)
    selections.find(sel => sel.id === opt.id && sel.value !== "indifferent")
  ).slice(0, 100); // safety limit
}, [tagSearchQuery, selections]);


    const welcomeImages = [
    "/corruchart-dev/images/favourite-interests.gif",
    "/corruchart-dev/images/redact-favourites.gif",
    "/corruchart-dev/images/remove-favourites.gif",
    ];
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    // TIPS MODAL
    const [showWelcome, setShowWelcome] = useState(false);

    useEffect(() => {
    const hasSeenWelcome = localStorage.getItem("hasSeenWelcomeRoles");
    if (!hasSeenWelcome) {
        setShowWelcome(true);
    }
    }, []);


    // Update your close function
    const closeWelcome = () => {
        setShowWelcome(false);
        localStorage.setItem("hasSeenWelcomeRoles", "true");
    };
    // -----------------------


const startPress = (id: string) => {
  timerRef.current = setTimeout(() => {
    toggleRedact(id);
    // Optional: vibrate mobile devices for feedback
    if (window.navigator.vibrate) window.navigator.vibrate(50);
  }, 600); // 600ms = length of the hold
};

const cancelPress = () => {
  if (timerRef.current) clearTimeout(timerRef.current);
};

useEffect(() => {
  setClipId(`wiggle-${Math.random().toString(36).slice(2)}`);
}, []);
const [renderedAt, setRenderedAt] = useState<string>("");

useEffect(() => {
  setRenderedAt(new Date().toLocaleString());
}, []);

const [redactedIds, setRedactedIds] = useState<Set<string>>(new Set());

const toggleRedact = (id: string) => {
  setRedactedIds(prev => {
    const next = new Set(prev);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    return next;
  });
};

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
        title: "Identities & Orientations",
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
          "BDSM Roles Misc.",
          "Sadism & Masochism",
        ],
      },
      {
        key: "experience",
        title: "Sex Experience",
        tags: [
        "Sex Experience",
        "Body Count",
        ],
      },
      {
        key: "porn",
        title: "Porn Experience",
        tags: [
        "Porn Experience",
        "Porn Stash",
        "Erotic Novels Read",
        "Hentai Games Played",
        "Hentai Anime Watched",
        "Hentai Doujinshi Read",
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
    "#828282ff", // Indifferent
    "#e74c3c",   // Disgust
    "#fc8d59",   // Dislike
    "#27ae60",   // Like
    "#37bdf6ff", // Love
    "#c88de8ff", // Lust
  ];

  const COLOR_NAMES = [
    "indifferent",
    "disgust",
    "dislike",
    "like",
    "love",
    "lust",
  ];

  // Custom messages for each threshold
  const CORRUPTION_MESSAGES: Record<number, string> = {
    0: "You are pure and untouched by corruption.", // no thresholds reached
    1: "A hint of corruption creeps in...",
    2: "You've thought some perverted thoughts before. Pervert.",
    3: "You are tainted with corruption...",
    4: "You are very corrupt. A real pervert.",
    5: "You are beyond corrupt.",
    6: "You are sick and twisted.",
  };

  // Custom colors for each corruption threshold/message
  const CORRUPTION_COLORS: Record<number, string> = {
    0: "#fffdc7", // angle
    1: "#cdcaff", //
    2: "#917fbf", // 
    3: "#917fbf", // 
    4: "#917fbf", // 
    5: "#7a66aa", // 
    6: "#624d92", // demen
  };


  // Helper to pick the correct message
  function getCorruptionMessage(total: number, category6Hit: boolean) {
    if (category6Hit) return { key: 6, message: CORRUPTION_MESSAGES[6] };

    const reached = THRESHOLDS.filter(t => t.points > 0 && total >= t.points);
    if (reached.length === 0) return { key: 0, message: CORRUPTION_MESSAGES[0] };

    const highest = reached[reached.length - 1];
    return { key: highest.key, message: CORRUPTION_MESSAGES[highest.key] }
  }
  
  const allTags = [...positiveTags, ...negativeTags];

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
    const updateTagsFromStorage = () => {
      const savedRaw = localStorage.getItem("combined-selections");
      if (!savedRaw) return;

      let userSelections: { id: string; tags: string[]; value: Reaction }[] = [];

      try {
        const parsed = JSON.parse(savedRaw);
        if (Array.isArray(parsed)) {
          userSelections = parsed;
        } else if (typeof parsed === "object" && parsed !== null) {
          userSelections = Object.entries(parsed).map(([id, value]) => ({
            id,
            tags: [], // fallback empty tags
            value: value as Reaction,
          }));
        }
      } catch {
        userSelections = [];
      }

      setSelections(userSelections);

      // Compute tag breakdown
      const selectionsRecord: Record<string, Reaction> = {};
      userSelections.forEach(sel => {
        selectionsRecord[sel.id] = sel.value;
      });

      const { positive, negative } = computeTagScores(selectionsRecord);
      setPositiveTags(positive);
      setNegativeTags(negative);
    };

    // Initial load
    updateTagsFromStorage();

    // Listen to storage changes (other tabs/windows)
    window.addEventListener("storage", updateTagsFromStorage);

    // Poll in same tab (storage events don't fire in the same tab)
    const interval = setInterval(updateTagsFromStorage, 500);

    return () => {
      window.removeEventListener("storage", updateTagsFromStorage);
      clearInterval(interval);
    };
  }, []);
  
  
// ----------------------------
// Form submission handler (FormSubmit.co implementation)
// ----------------------------
const submitForm = async (event: React.FormEvent<HTMLFormElement>) => {
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
      setFeedbackOpen(false); // Closes the popup on success
    } else {
      alert("Error submitting form.");
    }
  } catch (err) {
    console.error("Network error:", err);
    alert("Network error. Please try again.");
  }
};


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
    if (e.key !== "combined-selections" || !e.newValue) return;

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
  // Load identity / roles from combined-selections
  // ----------------------------
  useEffect(() => {
    const updateRolesFromStorage = () => {
      const savedRaw = localStorage.getItem("combined-selections");
      if (!savedRaw) return;

      try {
        const saved: Record<string, string> = JSON.parse(savedRaw);

        const selectedRoles = ROLES.filter(role => {
          const reaction = saved[role.id] ?? "indifferent";
          return reaction !== "indifferent";
        });

        setIdentityOptions(selectedRoles);
      } catch {
        setIdentityOptions([]);
      }
    };

    // Initial load
    updateRolesFromStorage();

    // Listen to storage events (other tabs/windows)
    window.addEventListener("storage", updateRolesFromStorage);

    // Optional: listen in same tab whenever combined-selections changes
    const interval = setInterval(updateRolesFromStorage, 500); // polls every 0.5s

    return () => {
      window.removeEventListener("storage", updateRolesFromStorage);
      clearInterval(interval);
    };
  }, []);
  
  // ----------------------------

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
    // Favorite options (positive)
    const favoritePositiveOptions = useMemo(() => {
    return favorites
        .map(id => OPTIONS.find(o => o.id === id))
        .filter(Boolean)
        .filter(option => {
        const sel = selections.find(s => s.id === option!.id);
        return sel && COLOR_NAMES.indexOf(sel.value) >= 3; // like/love/lust
        });
    }, [favorites, selections]);

    // Favorite options (negative)
    const favoriteNegativeOptions = useMemo(() => {
    return favorites
        .map(id => OPTIONS.find(o => o.id === id))
        .filter(Boolean)
        .filter(option => {
        const sel = selections.find(s => s.id === option!.id);
        return sel && [1, 2].includes(COLOR_NAMES.indexOf(sel.value)); 
    // 1 = disgust, 2 = dislike
        });
    }, [favorites, selections]);


  // ----------------------------
  // Map selections for scoring (combined-selections only)
  // ----------------------------
  const scoredSelections = useMemo(() => {
    // selections is already loaded from combined-selections
    return selections
      .map(sel => {
        const option = OPTIONS.find(o => o.id === sel.id) ?? ROLES.find(r => r.id === sel.id);
        if (!option) return null;

        return {
          category: option.category as CategoryId,
          value: sel.value as string,
        };
      })
      .filter(Boolean) as { category: CategoryId; value: string }[];
  }, [selections]);

  const scoreData = useMemo(() => computeScore(scoredSelections), [scoredSelections]);

  const isTainted = scoreData.category6Hit;

  const fillPercent = useMemo(() => {
    if (scoreData.category6Hit) return 100;
    return Math.min((scoreData.total / METER_MAX_POINTS) * 100, 100);
  }, [scoreData]);

  // ----------------------------
  // Corruption animation intensity (depends on fillPercent)
  // ----------------------------
  const corruption = Math.min(fillPercent / 100, 1);
  const amplitude = 2 + corruption * 4;   // wave height
  const speed = 5 - corruption * 2.5;     // animation speed

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

              // 1️⃣ Close the tag search
            setIsTagSearchOpen(false);

              // Wait a frame so DOM updates
            await new Promise(requestAnimationFrame);

            // Clone the container
            const clone = container.cloneNode(true) as HTMLElement;

            // Force maximum width for large-screen layout
            clone.style.width = "1200px"; // or whatever max width you want
            clone.style.maxWidth = "1200px";
            
            // Force all role sections to 2 columns (or more if desired)
            const roleSections = clone.querySelectorAll<HTMLElement>("[class*='columns-']");
            roleSections.forEach(section => {
                section.style.columnCount = "2";  // or 3 for larger
                section.style.columnGap = "1.5rem";
            });

            // Wrap in temporary div for styling/padding
            const wrapper = document.createElement("div");
            wrapper.style.padding = "40px";
            wrapper.style.backgroundColor = PAGE_BACKGROUND_COLOR;
            wrapper.style.display = "inline-block"; // shrink to content
            wrapper.className = "text-neutral-200";
            wrapper.appendChild(clone);

            document.body.appendChild(wrapper);

            // Render screenshot
            const canvas = await html2canvas(wrapper, { 
                scale: 2, 
                backgroundColor: PAGE_BACKGROUND_COLOR,
                useCORS: true,
            });

            document.body.removeChild(wrapper);

            // Trigger download
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
            // DEV CHECK: positive options whose tags never appear in Tag Affinities
            // ----------------------------
            useEffect(() => {
            if (process.env.NODE_ENV !== "development") return;

            // Tags that actually made it into the Tag Affinities section
            const visibleTagSet = new Set(
                allVisibleTags.map(t => t.tag)
            );

            // Positively reacted options
            const positiveOptions = selections.filter(sel => {
                const idx = COLOR_NAMES.indexOf(sel.value);
                return idx >= 3; // like / love / lust
            });

            positiveOptions.forEach(sel => {
                const option = OPTIONS.find(o => o.id === sel.id);
                if (!option) return;

                const optionTags = option.tags ?? [];

                const hasVisibleTag = optionTags.some(tag =>
                visibleTagSet.has(tag)
                );

                if (!hasVisibleTag && !warnedOptionsRef.current.has(option.id)) {
            warnedOptionsRef.current.add(option.id);

                console.warn(
                    "⚠️ Positive option contributes NO tags to Tag Affinities:",
                    option.id,
                    optionTags
                );
                }
            });
            }, [selections, allVisibleTags]);



            // ----------------------------
            // RENDER
            // ----------------------------
            return (
                <main
                className="min-h-screen text-neutral-200 px-6 py-10"
                style={{ backgroundColor: PAGE_BACKGROUND_COLOR }}
                >
            {/* Actions */}
            <div className="flex gap-2 -mt-6 mb-6 items-center flex-wrap relative">
                {/* Export Screenshot */}
                <button
                    type="button"
                    onClick={exportScreenshot}
                    className="px-3 py-1 rounded bg-neutral-900 text-neutral-200 text-sm hover:bg-neutral-800 cursor-pointer flex items-center justify-center h-8"
                >
                    Export Screenshot
                </button>

                {/* Info/Help button (Standardized size) */}
                <button
                    type="button"
                    onClick={() => setShowWelcome(true)}
                    className="px-4 py-1 rounded bg-neutral-900 text-neutral-200 text-sm hover:bg-neutral-800 cursor-pointer flex items-center justify-center h-8 gap-1"
                >
                    <span className="font-bold">Guide</span>
                </button>

                {/* Feedback button (In Back's old spot) */}
                <button
                    type="button"
                    onClick={() => setFeedbackOpen(prev => !prev)}
                    className="px-3 py-1 rounded bg-neutral-900 text-white text-sm hover:bg-neutral-800 transition-colors cursor-pointer flex items-center justify-center h-8"
                >
                    Feedback
                </button>

            {/* Feedback Form Popup */}
            {feedbackOpen && (
            <div
                className="absolute z-50 max-w-md w-full max-h-[80vh] overflow-y-auto p-4 bg-neutral-900 border border-neutral-700 rounded shadow-lg"
                style={{
                top: popupPos?.y ?? window.innerHeight / 2, // center vertically
                left: popupPos?.x ?? window.innerWidth / 2,  // center horizontally
                transform: popupPos ? "translate(0,0)" : "translate(-50%, -50%)",
                }}
            >
            {/* Draggable header */}
            <div
                className="cursor-move mb-2 text-center text-white font-semibold"
                onPointerDown={(e) => {
                e.preventDefault();
                dragStartRef.current = {
                    x: popupPos?.x ?? e.currentTarget.parentElement!.getBoundingClientRect().left,
                    y: popupPos?.y ?? e.currentTarget.parentElement!.getBoundingClientRect().top,
                    mouseX: e.clientX,
                    mouseY: e.clientY,
                };
                e.currentTarget.setPointerCapture(e.pointerId);
                }}
                onPointerMove={(e) => {
                if (!dragStartRef.current) return;
                const dx = e.clientX - dragStartRef.current.mouseX;
                const dy = e.clientY - dragStartRef.current.mouseY;
                setPopupPos({
                    x: dragStartRef.current.x + dx,
                    y: dragStartRef.current.y + dy,
                });
                }}
                onPointerUp={(e) => {
                dragStartRef.current = null;
                e.currentTarget.releasePointerCapture(e.pointerId);
                }}
            >
                Anonymous Feedback
            </div>

            {/* Feedback form */}
            <form
                id="contactForm"
                onSubmit={submitForm}
                action="https://formsubmit.co/badminute@protonmail.com"
                method="POST"
                className="flex flex-col gap-2"
            >
                {/* FormSubmit Configuration */}
                <input type="hidden" name="_subject" value="New Corruchart Feedback!" />
                <input type="hidden" name="_captcha" value="false" />
                <input type="hidden" name="_template" value="table" />

                <input type="text" name="name" placeholder="Nickname" className="px-2 py-1 rounded text-white" required />
                <input type="email" name="email" placeholder="Email (Possibly Get a Reply)" className="px-2 py-1 rounded text-white" />
                <input type="text" name="honeypot" style={{ display: "none" }} />
                <textarea
                    name="message"
                    placeholder="Your feedback (suggestions, typos, improvements, adjustments, ideas, kisses, etc.)"
                    className="px-2 py-1 rounded text-white resize-y min-h-[5rem] max-h-64 overflow-y-auto"
                    required
                />

                <div className="flex justify-between items-center">
                    <button
                    type="button"
                    onClick={() => setFeedbackOpen(false)}
                    className="px-3 py-1 rounded cursor-pointer bg-neutral-800 text-white hover:bg-red-700 transition-colors text-sm"
                    >
                    Close
                    </button>
                    <button
                    type="submit"
                    className="px-3 py-1 rounded cursor-pointer bg-green-800 text-white hover:bg-green-600 transition-colors text-sm"
                    >
                            Submit
                    </button>
                </div>
            </form>
        </div>
    )}
            {/* Mini Ko-fi button */}
                <a
                    href="https://ko-fi.com/badminute"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1 rounded bg-neutral-900 text-neutral-200 font-semibold text-sm shadow hover:bg-neutral-800 transition-colors cursor-pointer flex items-center justify-center h-8"
                >
                    ˗ˋˏ$ˎˊ˗
                </a>

            {/* Back Button (In Feedback's old spot) */}
                <Link
                    href="/corruchart"
                    className="px-3 py-1 rounded bg-neutral-900 text-neutral-200 text-sm hover:bg-violet-500/30 cursor-pointer flex items-center justify-center h-8"
                >
                    Back
                </Link>

            </div>

      <div id="results-container" className="max-w-3xl mx-auto space-y-15">
        <header className="space-y-2 text-center">
          <div className="relative inline-block">
            {/* Header text */}
            <h1
              className="text-3xl font-semibold text-violet-400"
              style={{ textShadow: "0px 3px 0px rgba(0,0,0,0.7)" }}
            >
              Corruchart
            </h1>
            <h2
              className="text-3xl font-semibold"
              style={{ textShadow: "0px 3px 0px rgba(0,0,0,0.7)" }}
            >
              Results
            </h2>

            {/* Version number in top-right corner of text */}
            <span
              className="absolute text-sm text-neutral-400 font-medium"
              style={{
                top: 0,
                right: 0,
                transform: "translate(110%, -35%)", // adjust as needed
                textShadow: "0px 1px 0px rgba(0,0,0,0.6)",
              }}
            >
              v0.29.3
            </span>
          </div>

          {/* Current date/time */}
            <p className="text-neutral-400" style={{ textShadow: "0px 2px 0px rgba(0,0,0,0.7)" }}>
            {renderedAt && `Taken at ${renderedAt}`}
            </p>
        </header>

        <section className="space-y-3">

          {/* 2️⃣ Score Display */}
          <div className="flex justify-between text-xl text-violet-400">
            <span style={{ textShadow: "0px 4px 0px rgba(0,0,0,0.3)" }}>Corruption</span>
            <span style={{ textShadow: "0px 4px 0px rgba(0,0,0,0.3)" }}>
              {scoreData.total} / {METER_MAX_POINTS}
            </span>
          </div>

          {/* 3️⃣ Meter Bar with left/right icons */}
          <div className="flex items-center gap-2">
            {/* Left icon */}
            <img
              src="/images/anglefinal.png"
              alt="left icon"
              className="w-10 h-10"
              style={{ filter: "drop-shadow(1px 3px 0px rgba(0,0,0,1))" }}
              
            />

            {/* Meter + threshold markers container */}
            <div className="relative flex-1">
              {/* Meter */}
              <div
                className="h-4 rounded overflow-hidden relative"
                style={{ backgroundColor: "#2c2e33" }}
              >
                {clipId && (
                <div className="absolute left-0 top-0 h-full transition-[width] duration-1000 ease-out" style={{ width: `${fillPercent}%` }}>
                    <div className="absolute inset-0" style={{ backgroundColor: "#7752cd" }} />
                    <svg
                    viewBox="0 0 100 16"
                    preserveAspectRatio="none"
                    className="w-full h-full relative z-10"
                    >
                    <defs>
                        <clipPath id={clipIdRef.current}>
                        <path>
                            <animate
                            attributeName="d"
                            dur={`${speed}s`}
                            repeatCount="indefinite"
                            values={`
                                M0,6
                                Q10,${6 - amplitude} 20,6
                                T40,6 T60,6 T80,6 T100,6
                                V16 H0 Z;

                                M0,6
                                Q10,${6 + amplitude} 20,6
                                T40,6 T60,6 T80,6 T100,6
                                V16 H0 Z;

                                M0,6
                                Q10,${6 - amplitude} 20,6
                                T40,6 T60,6 T80,6 T100,6
                                V16 H0 Z
                            `}
                            />
                        </path>
                        </clipPath>
                    </defs>
                    <rect
                        x="0"
                        y="0"
                        width="100"
                        height="16"
                        fill="#8b5cf6"
                        clipPath={`url(#${clipIdRef.current})`}
                    />
                    </svg>
                </div>
                )}
              </div>

              {/* Threshold markers, visually above the meter */}
              <div className="absolute top-0 left-0 w-full h-6 pointer-events-none z-20">
                {THRESHOLDS.filter(t => t.points > 0).map((t, i) => {
                  const leftPercent = (t.points / METER_MAX_POINTS) * 100;
                  const reached = isTainted || scoreData.total >= t.points;

                  return (
                    <div
                      key={i}
                      className="absolute text-center"
                      style={{
                        left: `${leftPercent}%`,
                        transform: "translateX(-50%)",
                        top: "-0rem", // move above the bar visually
                      }}
                    >
                      <div
                        className={`w-0.75 h-4 mx-auto transition-colors duration-300 ${reached ? "bg-neutral-800" : "bg-neutral-500"
                          }`}
                      />
                      <span
                        className={`text-xl block mt-1 transition-colors duration-300 ${reached ? "text-violet-500" : "text-neutral-400"
                          }`}
                      >
                        {i + 1}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right icon */}
            <img
              src="/images/demenfinal.png"
              alt="right icon"
              className="w-10 h-10"
              style={{ filter: "drop-shadow(1px 3px 0px rgba(0,0,0,1))" }}
            />
          </div>
      </section>

        {/* Main corruption message */}
        {(() => {
          const { key, message } = getCorruptionMessage(scoreData.total, scoreData.category6Hit);
          const color = CORRUPTION_COLORS[key] ?? "#8b5cf6";

          return (
            <div
              className="text-center text-lg font-semibold mb-2"
              style={{ 
                color, 
                textShadow: "2px 2px 0px rgba(0,0,0,0.6)" 
              }}
            >
              {message}
            </div>
          );
        })()}

{/* IDENTITY & ROLES */}
{rolesBySection.length > 0 && (
  <section className="mt-6 space-y-6">
    <div className="w-full max-w-3xl mx-auto columns-1 sm:columns-2 gap-6">
      {rolesBySection.map((section) => (
        <div
          key={section.key}
          className="break-inside-avoid mb-6"
        >
          <h3 className="text-lg text-center font-semibold text-neutral-300 mb-2">
            {section.title}
          </h3>
          <div className="flex flex-wrap gap-2 justify-center">
            {section.roles.map((role) => {
              const isRedacted = redactedIds.has(role.id);
              return (
                <div
                  key={role.id}
                  onPointerDown={() => startPress(role.id)}
                  onPointerUp={cancelPress}
                  onPointerLeave={cancelPress}
                  className="flex items-center gap-1.5 text-sm bg-neutral-800 px-3 py-1 rounded border border-neutral-700 shadow-sm break-inside-avoid whitespace-nowrap cursor-pointer hover:brightness-110 transition-all select-none active:scale-95 active:opacity-75"
                >
                  {/* Symbol / Emoji Logic */}
                  <span
                    className="flex-shrink-0 w-6 text-center font-bold"
                    style={{
                      fontSize: "18px",
                      display: "inline-block",
                      backgroundColor: "transparent",
                      lineHeight: "1.25em",
                      paddingBottom: "0.1em",
                      color: isRedacted
                        ? "#525252"
                        : ROLE_SYMBOLS[role.id]?.color ?? "#e5e7eb",
                    }}
                  >
                    {isRedacted ? (
                      "█"
                    ) : (() => {
                      const symbol = ROLE_SYMBOLS[role.id]?.symbol;
                      const FLAG_MAP: Record<string, string> = {
                        TRANS_FLAG: "/icons/trans-flag.svg",
                        NONBINARY_FLAG: "/icons/nonbinary-flag.svg",
                        STRAIGHT_FLAG: "/icons/straight-flag.svg",
                        GAY_FLAG: "/icons/gay-flag.svg",
                        LESBIAN_FLAG: "/icons/lesbian-flag.svg",
                        BI_FLAG: "/icons/bisexual-flag.svg",
                        PAN_FLAG: "/icons/pansexual-flag.svg",
                        ACE_FLAG: "/icons/asexual-flag.svg",
                        ARO_FLAG: "/icons/aromantic-flag.svg",
                        DEMI_FLAG: "/icons/demisexual-flag.svg",
                      };
                      if (symbol && FLAG_MAP[symbol]) {
                        return (
                          <img
                            src={FLAG_MAP[symbol]}
                            alt={symbol.replace("_FLAG", "").toLowerCase()}
                            style={{
                              width: 18,
                              height: 12,
                              display: "inline-block",
                              verticalAlign: "middle",
                            }}
                          />
                        );
                      }
                      return symbol ?? "★";
                    })()}
                  </span>



                            {/* Label Text Logic */}
                            <span
                                className="flex-shrink-0 text-sm leading-tight"
                                style={{
                                    display: "inline-block",
                                    backgroundColor: "transparent",
                                    whiteSpace: "nowrap",
                                    color: (() => {
                                        if (isRedacted) return "#525252";

                                        const symbol = ROLE_SYMBOLS[role.id]?.symbol;

                                        // Override specific roles
                                        if (symbol === "TRANS_FLAG") {
                                            if (role.id === "man-transgender") return "#55CDFC"; // light blue
                                            if (role.id === "woman-transgender") return "#d792d7"; // pink
                                            // default trans color for other trans roles
                                            return "#A3A3A3";
                                        }

                                        // Other flag-based colors
                                        switch (symbol) {
                                            case "NONBINARY_FLAG": return "#9C59D1";
                                            case "GAY_FLAG": return "#26CEAA";
                                            case "LESBIAN_FLAG": return "#d52d00";
                                            case "BI_FLAG": return "#d60270";
                                            case "PAN_FLAG": return "#ff218c";
                                            case "ACE_FLAG": return "#800080";
                                            case "ARO_FLAG": return "#3eb489";
                                            case "DEMI_FLAG": return "#800080";
                                            default: return ROLE_SYMBOLS[role.id]?.color ?? "#e5e7eb";
                                        }
                                    })(),

                                }}
                            >
                                {isRedacted ? "█████" : role.label}
                            </span>

                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </section>
)}


    {/* FAVORITE OPTIONS */}
{(favoritePositiveOptions.length > 0 || favoriteNegativeOptions.length > 0) && (
  <section className="mt-8 relative">
  <div className="flex items-center justify-center gap-2 mb-4">
    <h3 className="text-xl font-semibold text-neutral-300" style={{ textShadow: "2px 2px 0px rgba(0,0,0,0.3)" }}>
      Pinned
    </h3>
    <span
      onClick={() =>
        setOpenTagInfo(prev =>
          prev?.tag === "__fav_help" ? null : { tag: "__fav_help", type: "positive" }
        )
      }
      className="w-4 h-4 flex items-center justify-center rounded-full text-[9px] font-bold bg-neutral-800 text-gray-300 border border-neutral-600 cursor-pointer"
      title="How to manage pins"
    >
      ?
    </span>
  </div>

  {openTagInfo?.tag === "__fav_help" && (
    <div className="absolute -top-28 left-1/2 transform -translate-x-1/2 z-50 w-64 p-3 bg-neutral-900 text-gray-200 rounded shadow-lg text-center text-sm border border-neutral-700">
      Double-click a label to remove it from your pinned. Click and hold a label to redact it.
    </div>
  )}

  {/* Positive Favorites Row */}
  {favoritePositiveOptions.length > 0 && (
    <div className="flex flex-wrap gap-3 justify-center mb-2">
      {favoritePositiveOptions
  .sort((a, b) => {
    const aVal = COLOR_NAMES.indexOf(selections.find(s => s.id === a.id)?.value ?? "indifferent");
    const bVal = COLOR_NAMES.indexOf(selections.find(s => s.id === b.id)?.value ?? "indifferent");
    return bVal - aVal; // flipped: strongest → weakest
  })
        .map(option => {
          const sel = selections.find(s => s.id === option.id);
          const reaction = sel?.value ?? "indifferent";
          const colorIdx = COLOR_NAMES.indexOf(reaction);
          const textColor = COLOR_HEX[colorIdx] ?? "#e5e7eb";

          return (
            <div
              key={option.id}
              onClick={() => setOpenDescription(option.id)}
              onDoubleClick={() => toggleFavorite(option.id)}
              onPointerDown={() => startPress(option.id)}
              onPointerUp={cancelPress}
              onPointerLeave={cancelPress}
              className="px-3 py-1 rounded cursor-pointer select-none shadow-sm text-sm font-medium transition-transform active:scale-95 active:opacity-75 flex items-center gap-2 bg-neutral-800 border border-neutral-700"
              title="Double-click to remove • Hold to redact"
            >
              <span
                style={{
                  whiteSpace: "nowrap",
                  color: redactedIds.has(option.id) ? "#525252" : textColor,
                }}
              >
                {redactedIds.has(option.id) ? "█████" : option.label}
              </span>
            </div>
          );
        })}
    </div>
  )}

  {/* Negative Favorites Row */}
  {favoriteNegativeOptions.length > 0 && (
    <div className="flex flex-wrap gap-3 justify-center">
      {favoriteNegativeOptions
  .sort((a, b) => {
    const aVal = COLOR_NAMES.indexOf(selections.find(s => s.id === a.id)?.value ?? "indifferent");
    const bVal = COLOR_NAMES.indexOf(selections.find(s => s.id === b.id)?.value ?? "indifferent");
    return bVal - aVal; // flipped: strongest → weakest
  })
        .map(option => {
          const sel = selections.find(s => s.id === option.id);
          const reaction = sel?.value ?? "indifferent";
          const colorIdx = COLOR_NAMES.indexOf(reaction);
          const textColor = COLOR_HEX[colorIdx] ?? "#e5e7eb";

          return (
            <div
              key={option.id}
              onClick={() => setOpenDescription(option.id)}
              onDoubleClick={() => toggleFavorite(option.id)}
              onPointerDown={() => startPress(option.id)}
              onPointerUp={cancelPress}
              onPointerLeave={cancelPress}
              className="px-3 py-1 rounded cursor-pointer select-none shadow-sm text-sm font-medium transition-transform active:scale-95 active:opacity-75 flex items-center gap-2 bg-neutral-800 border border-neutral-700"
              title="Double-click to remove • Hold to redact"
            >
              <span
                style={{
                  whiteSpace: "nowrap",
                  color: redactedIds.has(option.id) ? "#525252" : textColor,
                }}
              >
                {redactedIds.has(option.id) ? "█████" : option.label}
              </span>
            </div>
    );
  })}
</div>


  )}
</section>
)}


       {/* TAG AFFINITIES */}
          <section className="space-y-6 relative">

<div className="flex items-center justify-center gap-2 mb-4">
  <h3 className="text-xl font-semibold" style={{ textShadow: "2px 2px 0px rgba(0,0,0,0.3)" }}>
    Tag Affinities
  </h3>


  {/* Help button */}
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

  {/* Search button */}
  <button
    onClick={() => setIsTagSearchOpen(v => !v)}
    className="text-neutral-400 cursor-pointer hover:text-white text-lg px-2"
    aria-label="Search tags"
  >
    🔍
  </button>

  {/* Search Input — only shows when open, positioned to the right */}
  {isTagSearchOpen && (
    <input
      autoFocus
      value={tagSearchQuery}
      onChange={e => setTagSearchQuery(e.target.value)}
      placeholder="Search tag options…"
      className="ml-2 px-2 py-1 rounded bg-neutral-800 text-white outline-none"
      style={{ height: "28px" }} // match buttons' height for alignment
    />
  )}
</div>

{/* Tag Affinity Legend */}
<div className="flex justify-center flex-wrap gap-4 text-sm text-neutral-300 mt-2">
  {[
    { name: "Lust", color: "#c88de8ff" },
    { name: "Love", color: "#37bdf6ff" },
    { name: "Like", color: "#27ae60" },
    { name: "Dislike", color: "#fc8d59" },
    { name: "Disgust", color: "#e74c3c" },
  ].map((item) => (
    <div key={item.name} className="flex items-center gap-1.5">
      <span
        className="w-3 h-3 rounded-full inline-block"
        style={{ backgroundColor: item.color }}
      />
      <span>{item.name}</span>
    </div>
  ))}
</div>
            {openTagInfo?.tag === "__positive_help" && (
              <div className="absolute -top-32 left-1/2 transform -translate-x-1/2 z-50 w-64 p-3 bg-neutral-900 text-gray-200 rounded shadow-lg text-center text-sm border border-neutral-700">
                These are the tags you reacted most positively to. From here you can add and remove up to 28 interests to your favorites.
              </div>
            )}

            {/* TagAffinityDrilldown */}
            <TagAffinityDrilldown
            tags={visiblePositiveTags} // or negative
            favorites={favorites}
            toggleFavorite={toggleFavorite}
            searchQuery={tagSearchQuery}
            />


      {/* MODAL OVERLAY */}
        {showWelcome && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4">
        <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-2xl w-full max-w-4xl + max-h-[90vh] shadow-2xl flex flex-col">
  
  {/* Header */}
  <h2 className="text-2xl font-bold text-center text-violet-400 mb-4">
    Results Section
  </h2>

  {/* Scrollable Content Area */}
  <div className="flex-1 overflow-y-auto">
    
    {/* Description */}
    <div className="text-gray-400 text-center text-xl mb-4">
      <p>
        Your results are computed based on your responses to specific interests. Your affinities
        are based on the tags that the interests are in. You can customize your results a bit more, here are ways to do that.
      </p>
    </div>

    {/* Slideshow */}
    <WelcomeSlideshow 
      images={[
        "images/favourite-interests.gif",
        "images/search-interests.gif",
        "images/redact-favourites.gif",
        "images/remove-favourites.gif",
      ]} 
    />
  </div>

  {/* Button — always visible */}
  <button
    onClick={closeWelcome}
    className="w-full py-3 mt-4 bg-neutral-800 hover:bg-violet-500/30 cursor-pointer text-white font-semibold rounded-xl transition-colors"
  >
    RESULTS
  </button>
</div>

  </div>
)}

          </section>
      </div>
    </main>
  );
}
