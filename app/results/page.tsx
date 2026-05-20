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
import { encodeSelections, decodeSelections } from "@/lib/utils";
import { NARROW_TAGS } from "@/data/narrowTags";
import { useSettings } from "@/components/SettingsContext";
import GuideModal from "@/components/GuideModal";
import { 
  encryptMetadata, 
  decryptMetadata, 
  isEncrypted, 
  wrapEncrypted, 
  unwrapEncrypted 
} from "@/lib/metadataEncryption";
import { 
  addPngMetadata,
  readPngMetadata,
  encodeStegoOnCanvas,
  decodeStegoFromPngBlob,
} from "@/lib/imageMetadata";

const broadOnlyIds = narrowTagsCheck(OPTIONS, NARROW_TAGS);
const METER_MAX_POINTS = 9000;
const PAGE_BACKGROUND_COLOR = "#1F2023";
const MAX_FAVORITES = 30;
const FAVORITES_KEY = "corruchart-favorites";


console.log("Broad-only option IDs:", broadOnlyIds);



export default function ResultsPage() {
  const { colourblindMode } = useSettings();
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
    const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
    const exportMenuRef = useRef<HTMLDivElement | null>(null);
    const [isWelcomeOpen, setIsWelcomeOpen] = useState(true);
    const [isTagSearchOpen, setIsTagSearchOpen] = useState(true);
    const [tagSearchQuery, setTagSearchQuery] = useState("");
    const [drilldownCloseSignal, setDrilldownCloseSignal] = useState(0);

  useEffect(() => {
    if (!isExportMenuOpen) return;

    const handleOutsideClick = (event: MouseEvent) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(event.target as Node)) {
        setIsExportMenuOpen(false);
      }
    };

    window.addEventListener("mousedown", handleOutsideClick);
    return () => window.removeEventListener("mousedown", handleOutsideClick);
  }, [isExportMenuOpen]);

console.log("NEGATIVE TAGS:", negativeTags);

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

// Master list of ALL tags from OPTIONS (excluding hidden)
const ALL_TAGS = Array.from(
  new Set(
    OPTIONS.flatMap(o => o.tags ?? []).filter(tag => !HIDDEN_TAGS.has(tag))
  )
).sort();


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
        const key = "results-welcome-last-shown";
        const lastShown = localStorage.getItem(key);
        const now = Date.now();
        const SIX_HOURS = 6 * 60 * 60 * 1000;

        if (!lastShown || now - Number(lastShown) >= SIX_HOURS) {
            setShowWelcome(true);
        }
    }, []);


    // Update your close function
    const closeWelcome = () => {
        setShowWelcome(false);
        localStorage.setItem("results-welcome-last-shown", Date.now().toString());
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

const [renderedAt, setRenderedAt] = useState<string>("");

const [redactedIds, setRedactedIds] = useState<Set<string>>(new Set());

  // When viewing a shared seed we enter a non-destructive "seed mode".
  // In this mode we do not modify the user's `combined-selections` in localStorage.
  const [seedMode, setSeedMode] = useState(false);
  // When true, redactions are read from the seed and cannot be changed by the viewer.
  const [seedRedactionsLocked, setSeedRedactionsLocked] = useState(false);

useEffect(() => {
  setClipId(`wiggle-${Math.random().toString(36).slice(2)}`);
}, [seedMode]);

useEffect(() => {
  setRenderedAt(new Date().toLocaleString());
}, []);

const toggleRedact = (id: string) => {
  if (seedRedactionsLocked) return; // locked when viewing a shared seed
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
  const COLOR_HEX = useMemo(() => colourblindMode ? [
    "#828282ff", // Indifferent
    "#d62728",   // Disgust (red to darker red)
    "#ff7f0e",   // Dislike (orange to brighter orange)
    "#ffb347",   // Maybe (light orange/peach)
    "#1f77b4",   // Like (green to blue)
    "#aec7e8",   // Love (blue to light blue)
    "#9467bd",   // Lust (purple to darker purple)
  ] : [
    "#828282ff", // Indifferent
    "#e74c3c",   // Disgust
    "#fc8d59",   // Dislike
    "#ffd700",   // Maybe (gold/yellow)
    "#27ae60",   // Like
    "#37bdf6ff", // Love
    "#c88de8ff", // Lust
  ], [colourblindMode]);

  const COLOR_NAMES = [
    "indifferent",
    "disgust",
    "dislike",
    "maybe",
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
    5: "You are fully corrupt.",
    6: "You are into some sick and twisted things.",
  };

  // Custom colors for each corruption threshold/message
    const CORRUPTION_COLORS: Record<number, string> = {
    0: "#fffdc7", // angle
    1: "#cdcaff", //
    2: "#917fbf", // 
    3: "#917fbf", // 
    4: "#917fbf", // 
    5: "#7a66aa", // 
    6: "#7980c2", // demen
  };

  // Legend colors for tag affinities (affected by colorblind mode)
  const legendItems = useMemo(() => colourblindMode ? [
    { name: "Lust", color: "#9467bd" },
    { name: "Love", color: "#aec7e8" },
    { name: "Like", color: "#1f77b4" },
    { name: "Maybe", color: "#ffb347" },
    { name: "Dislike", color: "#ff7f0e" },
    { name: "Disgust", color: "#d62728" },
  ] : [
    { name: "Lust", color: "#c88de8ff" },
    { name: "Love", color: "#37bdf6ff" },
    { name: "Like", color: "#27ae60" },
    { name: "Maybe", color: "#ffd700" },
    { name: "Dislike", color: "#fc8d59" },
    { name: "Disgust", color: "#e74c3c" },
  ], [colourblindMode]);


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
      // If a seed is present in the URL, decode it and enter non-destructive seed mode.
      try {
        const params = new URLSearchParams(window.location.search);
        const seed = params.get("s");
        if (seed) {
          try {
            const { selections: seedSelections, redacted } = decodeSelections(seed);

            // Build selections array for rendering (do NOT write to localStorage)
            const userSelections = Object.entries(seedSelections).map(([id, value]) => ({
              id,
              tags: [],
              value: value as Reaction,
            }));

            setSelections(userSelections);
            setSeedMode(true);
            setSeedRedactionsLocked(true);
            setRedactedIds(new Set(redacted || []));

            // Keep the seed param in the URL so refresh preserves seed view.
            // (Do not write seed-derived selections to localStorage.)

            // Compute tag breakdown from the seed selections and exit
            const selectionsRecord: Record<string, Reaction> = {};
            userSelections.forEach(sel => {
              selectionsRecord[sel.id] = sel.value;
            });

            const { positive, negative } = computeTagScores(selectionsRecord);
            setPositiveTags(positive);
            setNegativeTags(negative);
            return;
          } catch (e) {
            // malformed seed — fall back to localStorage
            console.warn("Malformed seed in URL", e);
          }
        }
      } catch (e) {
        // ignore URL parsing errors
      }

      // No seed present; load user's normal combined-selections from localStorage
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
    if (seedMode) return; // ignore storage events when viewing a shared seed
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
      // If we're in seed mode, derive roles from `selections` state instead of localStorage
      if (seedMode) {
        const selectedRoles = ROLES.filter(role => {
          const sel = selections.find(s => s.id === role.id);
          const reaction = sel?.value ?? "indifferent";
          return reaction !== "indifferent";
        });

        setIdentityOptions(selectedRoles);
        return;
      }

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

    // Poll in same tab whenever combined-selections changes
    const interval = setInterval(updateRolesFromStorage, 500); // polls every 0.5s

    return () => {
      window.removeEventListener("storage", updateRolesFromStorage);
      clearInterval(interval);
    };
  }, [seedMode, selections]);
  
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
  return selections
    .map(sel => {
      const option =
        OPTIONS.find(o => o.id === sel.id) ??
        ROLES.find(r => r.id === sel.id);

      if (!option) return null;

      return {
        category: option.category as CategoryId,
        value: sel.value as string,
        points: (option as any).points, // ⭐ ADD THIS
      };
    })
    .filter(Boolean) as {
      category: CategoryId;
      value: string;
      points?: number;
    }[];
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

            // 1️⃣ Close overlays
            setIsTagSearchOpen(false);
            setDrilldownCloseSignal(s => s + 1);

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

            // Render screenshot (hides drilldowns)
            document.body.classList.add("screenshot-mode");

            // Render screenshot
            const canvas = await html2canvas(wrapper, { 
                scale: 2, 
                backgroundColor: PAGE_BACKGROUND_COLOR,
                useCORS: true,
            });

            // 🔓 Exit screenshot mode
            document.body.classList.remove("screenshot-mode");

            document.body.removeChild(wrapper);

            // Collect metadata for embedding
            const metadata = {
              selections: selections.reduce((acc, sel) => {
                if (sel.value && sel.value !== "indifferent") {
                  acc[sel.id] = sel.value;
                }
                return acc;
              }, {} as Record<string, Reaction>),
              redacted: Array.from(redactedIds),
              favorites,
              roles: identityOptions.map(role => role.id),
              score: scoreData.total,
              timestamp: renderedAt,
              version: "v0.34.1"
            };

            console.log('Embedding metadata:', metadata);

            // Convert metadata to JSON
            const metadataJson = JSON.stringify(metadata);

            // Encrypt metadata before embedding
            let encryptedMetadata: string;
            try {
              const encrypted = await encryptMetadata(metadataJson);
              encryptedMetadata = wrapEncrypted(encrypted);
              console.log('Metadata encrypted successfully');
            } catch (error) {
              console.error('Failed to encrypt metadata:', error);
              alert('Failed to encrypt metadata. Please try again.');
              return;
            }

            // Apply steganographic fallback payload before encoding the PNG.
            try {
              encodeStegoOnCanvas(canvas, encryptedMetadata);
            } catch (error) {
              console.error('Failed to encode steganography payload:', error);
              alert('Failed to encode hidden image metadata. Please try again.');
              return;
            }

            // Get PNG data from canvas
            const pngDataUrl = canvas.toDataURL("image/png");
            console.log('PNG data URL length:', pngDataUrl.length);
            
            // Convert data URL to Uint8Array
            const base64Data = pngDataUrl.split(',')[1];
            console.log('Base64 data length:', base64Data.length);
            
            const binaryString = atob(base64Data);
            const uint8Array = new Uint8Array(binaryString.length);
            for (let i = 0; i < binaryString.length; i++) {
              uint8Array[i] = binaryString.charCodeAt(i);
            }
            console.log('Uint8Array length:', uint8Array.length);
            console.log('PNG signature bytes:', Array.from(uint8Array.slice(0, 8)).map(b => b.toString(16).padStart(2, '0')).join(' '));

            // Add encrypted metadata as PNG text chunk
            const modifiedArray = addPngMetadata(uint8Array, 'corruchart-data', encryptedMetadata);
            console.log('Modified array length:', modifiedArray.length);

            // Create final blob
            const finalBlob = new Blob([modifiedArray as any], { type: 'image/png' });
            console.log('Final blob size:', finalBlob.size);

            // Trigger download
            const link = document.createElement("a");
            link.download = "corruchart-results.png";
            link.href = URL.createObjectURL(finalBlob);
            link.click();
            };

            const collectExportMetadata = () => ({
              selections: selections.reduce((acc, sel) => {
                if (sel.value && sel.value !== "indifferent" && !redactedIds.has(sel.id)) {
                  acc[sel.id] = sel.value;
                }
                return acc;
              }, {} as Record<string, Reaction>),
              redactedCount: redactedIds.size,
              favorites,
              roles: identityOptions.map(role => role.id),
              score: scoreData.total,
              timestamp: renderedAt,
              version: "v0.33.0"
            });

            const downloadBlob = (blob: Blob, filename: string) => {
              const url = URL.createObjectURL(blob);
              const link = document.createElement("a");
              link.href = url;
              link.download = filename;
              document.body.appendChild(link);
              link.click();
              link.remove();
              URL.revokeObjectURL(url);
            };

            const exportResultsAsJson = () => {
              const payload = collectExportMetadata();
              downloadBlob(new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" }), "corruchart-results.json");
              setIsExportMenuOpen(false);
            };

            const exportResultsAsCsv = () => {
              const rows = selections
                .filter(sel => sel.value && sel.value !== "indifferent" && !redactedIds.has(sel.id))
                .map(sel => {
                  const option = OPTIONS.find(o => o.id === sel.id);
                  return {
                    id: sel.id,
                    label: option?.label ?? sel.id,
                    value: sel.value,
                  };
                });

              if (rows.length === 0) {
                alert("No selections to export.");
                return;
              }

              const escapeCsv = (value: string) => `"${value.replace(/"/g, '""')}"`;
              const csv = ["id,label,value", ...rows.map(row => [escapeCsv(row.id), escapeCsv(row.label), escapeCsv(row.value)].join(","))].join("\n");
              downloadBlob(new Blob([csv], { type: "text/csv" }), "corruchart-results.csv");
              setIsExportMenuOpen(false);
            };

            const importFromImage = async (event: React.ChangeEvent<HTMLInputElement>) => {
              const file = event.target.files?.[0];
              if (!file) return;

              console.log('Importing file:', file.name, 'size:', file.size, 'type:', file.type);

              try {
                const arrayBuffer = await file.arrayBuffer();
                console.log('ArrayBuffer size:', arrayBuffer.byteLength);
                
                const uint8Array = new Uint8Array(arrayBuffer);
                console.log('Uint8Array length:', uint8Array.length);
                console.log('First 8 bytes (PNG signature):', Array.from(uint8Array.slice(0, 8)).map(b => b.toString(16).padStart(2, '0')).join(' '));
                
                // Check if it's a valid PNG file
                const pngSignature = [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A];
                const isValidPng = uint8Array.length >= 8 && pngSignature.every((byte, i) => uint8Array[i] === byte);
                console.log('Is valid PNG:', isValidPng);
                
                if (!isValidPng) {
                  alert("Selected file is not a valid PNG image.");
                  return;
                }
                
                // Extract metadata from PNG
                const extractedData = readPngMetadata(uint8Array, 'corruchart-data');
                console.log('Extracted data from PNG:', extractedData?.substring(0, 50) + '...');

                let metadataJson: string | null = null;
                if (extractedData) {
                  if (isEncrypted(extractedData)) {
                    try {
                      const encryptedData = unwrapEncrypted(extractedData);
                      metadataJson = await decryptMetadata(encryptedData);
                      console.log('Metadata decrypted successfully');
                    } catch (decryptError) {
                      console.warn('Encrypted metadata failed to decrypt, falling back to steganography:', decryptError);
                    }
                  } else {
                    console.warn('Metadata is not encrypted. This is a legacy image.');
                    metadataJson = extractedData;
                  }
                }

                if (!metadataJson) {
                  console.log('Attempting steganography fallback decode');
                  try {
                    const stegoBlob = new Blob([uint8Array], { type: 'image/png' });
                    const stegoData = await decodeStegoFromPngBlob(stegoBlob);
                    console.log('Steganography payload found:', stegoData?.substring(0, 50) + '...');

                    if (!stegoData) {
                      alert('No corruchart data found in this image.');
                      return;
                    }

                    if (isEncrypted(stegoData)) {
                      const encryptedData = unwrapEncrypted(stegoData);
                      metadataJson = await decryptMetadata(encryptedData);
                      console.log('Steganography metadata decrypted successfully');
                    } else {
                      metadataJson = stegoData;
                    }
                  } catch (stegoError) {
                    console.error('Steganography fallback failed:', stegoError);
                    alert('Failed to read results from the image. Please check the file and try again.');
                    return;
                  }
                }
                
                const metadata = JSON.parse(metadataJson);
                console.log('Parsed metadata:', metadata);
                
                // Encode imported data as seed and redirect to imported page
                const importedSelections = Object.fromEntries(
                  Object.entries(metadata.selections).map(([id, value]) => [id, value as Reaction])
                );
                
                const seed = encodeSelections(importedSelections, metadata.redacted || [], metadata.favorites || []);
                window.sessionStorage.setItem("importedSeed", seed);
                const importedUrl = `/results/imported`;
                
                console.log('Redirecting to imported results:', importedUrl);
                window.location.href = importedUrl;
              } catch (e) {
                console.error("Failed to import from image:", e);
                alert("Failed to import results from image. Please check the file and try again.");
              }

              // Reset file input
              event.target.value = '';
            };

            // ----------------------------
            // Generate share URL
            // ----------------------------
            const generateShareUrl = async () => {
              try {
                const map: Record<string, string> = {};
                selections.forEach(s => {
                  if (s?.value && s.value !== "indifferent") map[s.id] = s.value;
                });

                if (Object.keys(map).length === 0) {
                  alert("No selections to share.");
                  return;
                }

                const seed = encodeSelections(map as any, Array.from(redactedIds));
                const url = `${window.location.origin}${window.location.pathname}?s=${seed}`;

                if (navigator.clipboard && navigator.clipboard.writeText) {
                  await navigator.clipboard.writeText(url);
                  alert("Share URL copied to clipboard.");
                } else {
                  // Fallback
                  window.prompt("Copy this URL to share:", url);
                }
              } catch (e) {
                console.error("Failed to generate share URL:", e);
                alert("Failed to generate share URL.");
              }
            };


            /** Filter visible tags based on HIDDEN_TAGS */
            const visiblePositiveTags = positiveTags.filter(tag => !HIDDEN_TAGS.has(tag.tag));
            const visibleNegativeTags = negativeTags.filter(tag => !HIDDEN_TAGS.has(tag.tag));
            const allVisibleTags = useMemo(() => {
            return [...visiblePositiveTags, ...visibleNegativeTags];
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
              <div ref={exportMenuRef} className="relative inline-flex">
                <button
                  type="button"
                  onClick={exportScreenshot}
                  className="px-3 py-1 rounded-l bg-neutral-900 text-neutral-200 text-sm hover:bg-neutral-800 cursor-pointer flex items-center justify-center h-8"
                >
                  Export Image
                </button>
                <button
                  type="button"
                  onClick={() => setIsExportMenuOpen(prev => !prev)}
                  className="px-2 py-1 rounded-r bg-neutral-900 text-neutral-200 text-sm hover:bg-neutral-800 border-l border-neutral-700 cursor-pointer flex items-center justify-center h-8"
                  aria-expanded={isExportMenuOpen}
                  aria-label="More export options"
                >
                  <span className="text-xs">▾</span>
                </button>

                {isExportMenuOpen && (
                  <div className="absolute left-4 mt-9 w-44 rounded border cursor-pointer border-neutral-700 bg-neutral-900 z-20">
                    <button
                      type="button"
                      onClick={exportResultsAsCsv}
                      className="w-full text-left px-3 py-2 text-sm cursor-pointer text-neutral-200 hover:bg-neutral-800"
                    >
                      Export CSV
                    </button>
                    <button
                      type="button"
                      onClick={exportResultsAsJson}
                      className="w-full text-left px-3 py-2 text-sm cursor-pointer text-neutral-200 hover:bg-neutral-800"
                    >
                      Export JSON
                    </button>
                  </div>
                )}
              </div>

                {/* Import from Image */}
                <label className="px-3 py-1 rounded bg-neutral-900 text-neutral-200 text-sm hover:bg-neutral-800 cursor-pointer flex items-center justify-center h-8">
                    Import from Image
                    <input
                        type="file"
                        accept="image/png"
                        onChange={importFromImage}
                        className="hidden"
                    />
                </label>

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
                <input type="hidden" name="_subject" value={`Corruchart Feedback - ${new Date().toLocaleDateString()}`} />
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
              v0.34.1
            </span>
          </div>

          {/* Current date/time */}
            <p className="text-neutral-400" style={{ textShadow: "0px 2px 0px rgba(0,0,0,0.7)" }}>
            {renderedAt && `Taken at ${renderedAt}`}
            </p>
        </header>

        <section className="space-y-3">

          {/* 2️⃣ Score Display */}
          <div
            className="flex justify-between text-xl"
            style={{
                color: isTainted ? "#737ab9" : "#a78bfa",
            }}
            >
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
                <div
                className="absolute left-0 top-0 h-full transition-[width] duration-1000 ease-out"
                style={{ width: `${fillPercent}%` }}
                >
                    <div className="absolute inset-0" style={{
                    backgroundColor: isTainted ? "#2f3358" : "#7752cd"
                    }} />
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
                        fill={isTainted ? "#6770c2" : "#9672e8"}
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
                        className="text-xl block mt-1 transition-colors duration-300"
                        style={{
                            color: scoreData.category6Hit
                            ? "#6770c2" // cat6 reached all tick numbers
                            : reached
                            ? "#ae9ae7"  // reached tick number
                            : "#a78bfa", // unreached tick number
                        }}
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
            className="text-center text-lg font-semibold mt-1 mb-6"
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
      {seedMode ? (
        "Viewing shared results: pinned items cannot be modified here."
      ) : (
        "Double-click a label to remove it from your pinned. Click and hold a label to redact it."
      )}
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
              onDoubleClick={() => { if (!seedMode) toggleFavorite(option.id); }}
              onPointerDown={() => startPress(option.id)}
              onPointerUp={cancelPress}
              onPointerLeave={cancelPress}
              className="px-3 py-1 rounded cursor-pointer select-none shadow-sm text-sm font-medium transition-transform active:scale-95 active:opacity-75 flex items-center gap-2 bg-neutral-800 border border-neutral-700"
              title={seedMode ? "Pinned (locked in shared view)" : "Double-click to remove • Hold to redact"}
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
{/* Header row */}
<div className="flex items-center justify-center gap-2 mb-2">
  <h3
    className="text-xl font-semibold"
    style={{ textShadow: "2px 2px 0px rgba(0,0,0,0.3)" }}
  >
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
    title="Show help for tag affinities"
  >
    ?
  </span>

  {/* Search toggle button */}
  <button
    onClick={() => setIsTagSearchOpen(v => !v)}
    className="text-neutral-400 cursor-pointer hover:text-white text-lg px-2"
    aria-label="Search tags"
  >
    🔍
  </button>
</div>

{/* Search Input — now below header */}
{isTagSearchOpen && (
  <div className="flex justify-center mb-3">
    <input
      autoFocus
      value={tagSearchQuery}
      onChange={e => setTagSearchQuery(e.target.value)}
      placeholder="Search interests and pin..."
      className="w-64 px-3 py-1.5 rounded bg-neutral-800 text-white outline-none"
    />
  </div>
)}

    {/* Tag Affinity Legend */}
    <div className="flex justify-center flex-wrap gap-4 text-sm text-neutral-300 mt-2">
    {legendItems.map((item) => (
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
                These are the interests you reacted to. From here you can pin up to 28 interests both positive and negative.
              </div>
            )}

            {/* TagAffinityDrilldown */}
            <TagAffinityDrilldown
            tags={visiblePositiveTags} // or negative
            favorites={favorites}
            toggleFavorite={toggleFavorite}
            searchQuery={tagSearchQuery}
            forceCloseSignal={drilldownCloseSignal}
            seedMode={seedMode}
            redacted={Array.from(redactedIds)}
            />


      {/* MODAL OVERLAY */}
        {showWelcome && (
        <GuideModal
          isOpen={showWelcome}
          onClose={closeWelcome}
          title="Results Section"
          description="Your results are computed based on your responses to specific interests. Your affinities are based on the tags that the interests are in. You can customize your results a bit more, here are ways to do that."
          buttonLabel="RESULTS"
          tips={[
            { title: "IMPORTANT: Export Image (with Results Embedded)", images: ["images/export-image.gif"] },
            { title: "Pinning Noteworthy Interests", images: ["images/pins.gif"] },
            { title: "Searching Affinities to Pin", images: ["images/search-interests.gif"] },
            { title: "Redacting Pins", images: ["images/redact.gif"] },
            { title: "Removing Pins", images: ["images/remove-favourites.gif"] },
            { title: "Export CSV and JSON: Save For Later & Transfer Progress (PC -> Mobile, etc.)", images: ["images/empty-chart-import-now.gif"] },
            { title: "Import Results via CSV & JSON", images: ["images/export-csv-and-json.gif"] },
          ]}
        />
        )}

          </section>
      </div>
    </main>
  );
}
