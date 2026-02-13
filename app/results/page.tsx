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

const broadOnlyIds = narrowTagsCheck(OPTIONS, NARROW_TAGS);
const METER_MAX_POINTS = 5000;
const PAGE_BACKGROUND_COLOR = "#1F2023";
const MAX_FAVORITES = 25;
const FAVORITES_KEY = "corruchart-favorites";
const HIDDEN_TAGS = new Set<string>(["upper-body", "dynamics", "qualities", "acts", "lower-body", "themes", "dynamics"]);

console.log("Broad-only option IDs:", broadOnlyIds);

const LABEL_GRADIENTS: Record<string, string> = {
    "man-transgender": "linear-gradient(90deg, #5BCEFA, #F5A9B8, #FFFFFF, #F5A9B8, #5BCEFA)",
    "woman-transgender": "linear-gradient(90deg, #5BCEFA, #F5A9B8, #FFFFFF, #F5A9B8, #5BCEFA)",
    "non-binary-transgender": "linear-gradient(90deg, #FFF430 0% 33%, #FFFFFF 33% 66%, #9C59D1 66% 99%)",
    "gay": "linear-gradient(90deg, #2db99b 0% 33%, #d3d3d3 33% 66%, #6491c1 66% 99%)",
    "lesbian": "linear-gradient(90deg, #D62E00 0% 33%, #FF9A56 33% 66%, #D462A6 66% 99%)",
    "asexual": "linear-gradient(90deg, #646464 0% 33%, #A4A4A4 33% 66%, #810081 66% 99%)",
    "aromantic": "linear-gradient(90deg, #3DA63D 0% 33%, #B5E2B5 33% 66%, #646464 66% 99%)",
    "bisexual": "linear-gradient(90deg, #D60270 0% 33%, #9B4F96 33% 66%, #0038A8 66% 99%)",
    "pansexual": "linear-gradient(90deg, #FF218C 0% 33%, #FFD800 33% 66%, #21B1FF 66% 99%)",
    "queen-of-spades": "linear-gradient(90deg, #c2c2c2, #c2c2c2)",
    "demisexual": "linear-gradient(90deg, #c2c2c2, #8f078f)",
    "queen-of-hearts": "linear-gradient(90deg, #fa3e3e, #fa3e3e)",
    "sadomasochist": "linear-gradient(90deg, #3399ff 0% 33%, #fcac34 33% 100%)",
    "pony": "linear-gradient(90deg, #FF3B3B , #FFE066 , #4D96FF )",
    "pet-owner": "linear-gradient(90deg, #ba955d 0% 33%, #55a4f4 33% 100%)",
};


const SYMBOL_GRADIENTS: Record<string, string> = {
        "man-transgender": "linear-gradient(90deg, #5BCEFA 0% 33%, #F5A9B8 33% 66%, #5BCEFA 66% 99%)",
        "woman-transgender": "linear-gradient(90deg, #5BCEFA 0% 33%, #F5A9B8 33% 66%, #5BCEFA 66% 99%)",
        "non-binary-transgender": "linear-gradient(180deg, #d5d038 50%, #9C59D1 50%)",
        "non-binary": "linear-gradient(90deg, #FFF430 0% 33%, #FFFFFF 33% 66%, #9C59D1 66% 99%)",
        "lesbian": "linear-gradient(90deg, #D62E00 0% 33%, #FF9A56 33% 66%, #D462A6 66% 99%)",
        "gay": "linear-gradient(90deg, #2db99b 0% 33%, #d3d3d3 33% 66%, #6491c1 66% 99%)",
        "asexual": "linear-gradient(90deg, #8b8b8b 0% 33%, #bfbfbf 33% 66%, #8f078f 66% 99%)",
        "aromantic": "linear-gradient(90deg, #3DA63D 0% 33%, #B5E2B5 33% 66%, #646464 66% 99%)",
        "bisexual": "linear-gradient(90deg, #D60270 0% 33%, #9B4F96 33% 66%, #0038A8 66% 99%)",
        "pansexual": "linear-gradient(90deg, #FF218C 0% 33%, #FFD800 33% 66%, #21B1FF 66% 99%)",
        "demisexual": "linear-gradient(90deg, #c2c2c2, #8f078f",
        "queen-of-spades": "linear-gradient(90deg, #c2c2c2",
        "queen-of-hearts": "linear-gradient(90deg, #fa3e3e",
};


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

const timerRef = useRef<NodeJS.Timeout | null>(null);

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
          "BDSM Roles Cont.",
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

  // Custom messages for each threshold
  const CORRUPTION_MESSAGES: Record<number, string> = {
    0: "You are pure and untouched by corruption.", // no thresholds reached
    1: "A hint of corruption creeps in...",
    2: "You've thought some perverted thoughts before. Pervert.",
    3: "You are tainted with corruption...",
    4: "You are very corrupt. A real pervert.",
    5: "You are beyond corrupt.",
    6: "You should probably be in prison.",
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
  // Drag & Drop Handlers
  // ----------------------------
  const handleDragStart = (e: React.DragEvent, index: number) => {
    // Save the index of the item being dragged
    e.dataTransfer.setData("dragIndex", index.toString());
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    const dragIndex = Number(e.dataTransfer.getData("dragIndex"));
    
    // Don't do anything if dropped on itself
    if (dragIndex === dropIndex) return;

    // Reorder array
    const updated = [...favorites];
    const [movedItem] = updated.splice(dragIndex, 1);
    updated.splice(dropIndex, 0, movedItem);

    // Save state and localStorage
    setFavorites(updated);
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(updated));
  };

  const handleDragOver = (e: React.DragEvent) => {
    // Strictly necessary to allow dropping
    e.preventDefault();
  };

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

            {/* Back Button */}
            <Link
                href="/corruchart"
                className="px-3 py-1 rounded bg-neutral-900 text-neutral-200 text-sm hover:bg-neutral-800 cursor-pointer flex items-center justify-center h-8"
            >
                Back
            </Link>

            {/* Mini Ko-fi button */}
            <a
                href="https://ko-fi.com/badminute"
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1 rounded bg-neutral-900 text-neutral-200 font-semibold text-sm shadow hover:bg-violet-500/30 transition-colors cursor-pointer flex items-center justify-center h-8"
            >
                ˗ˋˏ$ˎˊ˗
            </a>

            {/* Feedback button */}
            <button
                type="button"
                onClick={() => setFeedbackOpen(prev => !prev)}
                className="px-2 py-1 rounded bg-neutral-900 text-white text-sm hover:bg-neutral-500 transition-colors cursor-pointer flex items-center justify-center h-8"
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

                <input type="text" name="name" placeholder="Name" className="px-2 py-1 rounded text-white" required />
                <input type="email" name="email" placeholder="Email" className="px-2 py-1 rounded text-white" required />
                <input type="text" name="honeypot" style={{ display: "none" }} />
                <textarea
                    name="message"
                    placeholder="Your message"
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
              v0.25.0
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
              src="/corruchart-dev/images/anglefinal.png"
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
              src="/corruchart-dev/images/demenfinal.png"
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
            <div className="flex flex-col md:flex-row md:justify-center md:gap-6 gap-6">
              {rolesBySection.map((section) => (
                <div key={section.key} className="md:flex-1 md:max-w-sm">
                  <h3 className="text-lg text-center font-semibold text-neutral-300 mb-2">
                    {section.title}
                  </h3>

                  <div className="flex flex-wrap gap-2 justify-center">
                    {section.roles.map((role) => {
                const isRedacted = redactedIds.has(role.id);
                return (
                    <div
                    key={role.id}
                    // Replaced onDoubleClick with Hold triggers
                    onPointerDown={() => startPress(role.id)}
                    onPointerUp={cancelPress}
                    onPointerLeave={cancelPress}
                    className="flex items-center gap-1.5 text-sm bg-neutral-800 px-3 py-1 rounded border border-neutral-700 shadow-sm break-inside-avoid whitespace-nowrap cursor-pointer hover:brightness-110 transition-all select-none"
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

                        /* Redaction override: if redacted, hide colors and show block */
                        ...(isRedacted
                            ? { color: "#525252", background: "none", WebkitTextFillColor: "initial" }
                            : ["🐕‍🦺", "🎭", "🪅"].includes(ROLE_SYMBOLS[role.id]?.symbol ?? "")
                            ? {
                                color: ROLE_SYMBOLS[role.id]?.color ?? "#e5e7eb",
                                WebkitTextFillColor: undefined,
                                WebkitBackgroundClip: undefined,
                                background: undefined,
                            }
                            : SYMBOL_GRADIENTS[role.id]
                            ? {
                                background: SYMBOL_GRADIENTS[role.id],
                                WebkitBackgroundClip: "text",
                                WebkitTextFillColor: "transparent",
                                color: undefined,
                            }
                            : {
                                color: ROLE_SYMBOLS[role.id]?.color ?? "#e5e7eb",
                                WebkitTextFillColor: undefined,
                                WebkitBackgroundClip: undefined,
                                background: undefined,
                            }),
                        }}
                    >
                        {isRedacted ? "█" : (ROLE_SYMBOLS[role.id]?.symbol ?? "★")}

                            </span>

                            {/* Label Text Logic */}
                            <span
                                className="flex-shrink-0 text-sm leading-tight"
                                style={{
                                    display: "inline-block",
                                    backgroundColor: "transparent",
                                    whiteSpace: "nowrap",

                                    /* Redaction override for text */
                                    ...(isRedacted 
                                      ? { color: "#525252", background: "none", WebkitTextFillColor: "initial" }
                                      : {
                                        background: LABEL_GRADIENTS[role.id] ?? undefined,
                                        WebkitBackgroundClip: LABEL_GRADIENTS[role.id] ? "text" : undefined,
                                        WebkitTextFillColor: LABEL_GRADIENTS[role.id] ? "transparent" : undefined,
                                        color: LABEL_GRADIENTS[role.id]
                                            ? undefined
                                            : ROLE_SYMBOLS[role.id]?.color ?? "#e5e7eb",
                                      })
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
        {favorites.length > 0 && (
          <section className="mt-8 relative">
            <div className="flex items-center justify-center gap-2 mb-4">
              <h3 className="text-xl font-semibold text-neutral-300" style={{ textShadow: "2px 2px 0px rgba(0,0,0,0.3)" }}>
                Favourites
              </h3>
              <span
                onClick={() =>
                  setOpenTagInfo(prev =>
                    prev?.tag === "__fav_help" ? null : { tag: "__fav_help", type: "positive" }
                  )
                }
                className="w-4 h-4 flex items-center justify-center rounded-full text-[9px] font-bold bg-neutral-800 text-gray-300 border border-neutral-600 cursor-pointer"
                title="How to manage favourites"
              >
                ?
              </span>
            </div>

            {openTagInfo?.tag === "__fav_help" && (
              <div className="absolute -top-32 left-1/2 transform -translate-x-1/2 z-50 w-64 p-3 bg-neutral-900 text-gray-200 rounded shadow-lg text-center text-sm border border-neutral-700">
                Click and drag labels left or right to reorder them. <br/> 
                Double-click a label to remove it from your favourites. Click and hold a label to redact it.
              </div>
            )}

            <div className="flex flex-wrap gap-3 justify-center">
              {favoriteOptions.map((option, index) => {
                const isGradient = LABEL_GRADIENTS[option.id];
                const style = isGradient
                  ? { background: LABEL_GRADIENTS[option.id], color: "#000", border: "none" }
                  : { backgroundColor: "#262626", color: "#e5e5e5", border: "1px solid #404040" };

                return (
                    <div
                        key={option.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, index)}
                        onDragOver={handleDragOver}
                        onDrop={(e) => handleDrop(e, index)}
                        onClick={() => setOpenDescription(option.id)}
                        onDoubleClick={() => toggleFavorite(option.id)}
                        onPointerDown={() => startPress(option.id)}
                        onPointerUp={cancelPress}
                        onPointerLeave={cancelPress}
                        className={`px-3 py-1 rounded cursor-move select-none shadow-sm text-sm font-medium transition-transform active:scale-95 active:opacity-75 hover:brightness-110 flex items-center gap-2 ${
                        redactedIds.has(option.id) ? "bg-black border-black shadow-none" : ""
                        }`}
                        style={style}
                        title="Drag to reorder • Double-click to remove • Hold to redact"
                    >

                        {/* Label Text Logic */}
                        <span
                        className="flex-shrink-0 text-sm leading-tight"
                        style={{
                            display: "inline-block",
                            backgroundColor: "transparent",
                            whiteSpace: "nowrap",
                            /* Redaction override for text */
                            ...(redactedIds.has(option.id)
                            ? { color: "#525252", background: "none", WebkitTextFillColor: "initial" }
                            : {
                                background: LABEL_GRADIENTS[option.id] ?? undefined,
                                WebkitBackgroundClip: LABEL_GRADIENTS[option.id] ? "text" : undefined,
                                WebkitTextFillColor: LABEL_GRADIENTS[option.id] ? "transparent" : undefined,
                                color: LABEL_GRADIENTS[option.id]
                                    ? undefined
                                    : ROLE_SYMBOLS[option.id]?.color ?? "#e5e7eb",
                                }),
                        }}
                        >
                        {redactedIds.has(option.id) ? "█████" : option.label}
                        </span>
                    </div>
                    );
              })}
            </div>
          </section>
        )}


       {/* TAG AFFINITIES */}
          <section className="space-y-6 relative">
            <div className="flex items-center justify-center gap-2 mb-4">
              <h3 className="text-xl font-semibold" style={{ textShadow: "2px 2px 0px rgba(0,0,0,0.3)" }}>
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
              <div className="absolute -top-32 left-1/2 transform -translate-x-1/2 z-50 w-64 p-3 bg-neutral-900 text-gray-200 rounded shadow-lg text-center text-sm border border-neutral-700">
                These are the tags you reacted most positively to. From here you can add and remove up to 25 interests to your favorites.
              </div>
            )}

            {/* TagAffinityDrilldown */}
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
