"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";

import type { OptionData as Option } from "@/data/options";
import { GROUPS } from "@/data/groups";
import { OPTIONS } from "@/data/options";
import { DESCRIPTIONS } from "@/data/descriptions";
import SettingsButton from "@/components/SettingsButton";
import OptionsGrid from "@/components/OptionsGrid";
import { useSettings } from "@/components/SettingsContext";
import { useNewOptions } from "@/components/NewOptionsList";
import ChangelogFeedbackModal from "@/components/ChangelogFeedbackModal";
import GuideModal from "@/components/GuideModal";

// import base type
import type { OptionData as BaseOption } from "@/data/options";

// define extended type
type OptionWithCategory = BaseOption & {
    category: number;
    tags: string[];
    aka?: string[];
};

type GroupState = "include" | "exclude";

const COLOR_NAMES = [
  "indifferent/unset",
  "disgust",
  "dislike",
  "maybe",
  "like",
  "love",
  "lust",
] as const;

const RESULTS_KEY = "combined-selections";
const FILTERS_KEY = "corruchart-filters";
const GUIDE_VERSION = "0.35.0";
const GUIDE_TIPS_TO_HIGHLIGHT = []; // Empty array means all tips are considered "new"

type PersistedFilterState = {
  query?: string;
  colorFilter?: number[];
  colorFilterAnchored?: Record<number, string[]>;
  showNewFilter?: boolean;
  groupStates?: Record<string, GroupState>;
  showNarrowGroups?: boolean;
};

const STATE_TO_VALUE = [
  "indifferent",
  "disgust",
  "dislike",
  "maybe",
  "like",
  "love",
  "lust",
] as const;

export default function Page() {
  const { colourblindMode, reverseColorCycle } = useSettings();
  const searchInputRef = useRef<HTMLInputElement>(null);

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


    const broadGroups = useMemo(
    () => GROUPS.filter(g => g.scope === "broad"),
    []
    );

    const narrowGroups = useMemo(
    () => GROUPS.filter(g => g.scope === "narrow"),
    []
    );


  useEffect(() => {
      const handler = (e: KeyboardEvent) => {
          const isMac = navigator.platform.toUpperCase().includes("MAC");
          const modifier = isMac ? e.metaKey : e.ctrlKey;

          if (!modifier) return;
          if (e.key.toLowerCase() !== "f") return;

          e.preventDefault(); // stop browser find
          e.stopPropagation(); // extra safety
          searchInputRef.current?.focus();
          searchInputRef.current?.select();
      };

      document.addEventListener("keydown", handler);
      return () => document.removeEventListener("keydown", handler);
}, []);

  /** Normalize OPTIONS tags */
    const options: OptionWithCategory[] = useMemo(
        () =>
            OPTIONS.map((opt) => ({
                ...opt,
                tags:
                    (opt.tags as (string | number)[] | undefined)?.map((tag) => {
                        if (typeof tag === "number") return GROUPS[tag - 1]?.id || "general";
                        return tag;
                    }) || ["general"],
                aka: opt.aka?.map((a) => a.toUpperCase()) || [],
            })),
        []
    );

    type OptionSlot = {
        slotId: string;
        options: OptionWithCategory[];
    };

    const slots: OptionSlot[] = useMemo(() => {
        const map = new Map<string, OptionWithCategory[]>();

        options.forEach((opt) => {
            const key = opt.variantGroup ?? opt.id;
            if (!map.has(key)) map.set(key, []);
            map.get(key)!.push(opt);
        });

        return Array.from(map.entries()).map(([slotId, opts]) => ({
            slotId,
            options: opts.sort(
                (a, b) => (a.variantOrder ?? 0) - (b.variantOrder ?? 0)
            ),
        })).sort((slotA, slotB) => {
            const labelA = slotA.options[0]?.label ?? "";
            const labelB = slotB.options[0]?.label ?? "";
            return labelA.localeCompare(labelB);
        });
    }, [options]);

    // curated list of new options
    const newOptions = useNewOptions();
    const [seenGuideTips, setSeenGuideTips] = useState<number[]>([]);
    const [isWelcomeOpen, setIsWelcomeOpen] = useState(true);
    const [showNarrowGroups, setShowNarrowGroups] = useState(false);
    const [isHolding, setIsHolding] = useState<string | null>(null);
    const holdTimerRef = useRef<NodeJS.Timeout | null>(null);
    const didLongPressRef = useRef(false);
    const [states, setStates] = useState<number[]>([]);
    const [query, setQuery] = useState("");
    const [colorFilter, setColorFilter] = useState<Set<number>>(new Set());
    const [colorFilterAnchored, setColorFilterAnchored] = useState<Record<number, Set<string>>>({});
    const [showNewFilter, setShowNewFilter] = useState(false);
    const [groupStates, setGroupStates] = useState<Record<string, GroupState>>({});
    const [showCategory6, setShowCategory6] = useState(false);
    const [openDescription, setOpenDescription] = useState<string | null>(null);
    const [activeVariant, setActiveVariant] = useState<Record<string, number>>({});
    type ActivePlus = { index: number; id: string; state: number }; // ✅ must include state
    const [activePluses, setActivePluses] = useState<ActivePlus[]>([]);
    const optionIndexById = useMemo(() => {
        const map: Record<string, number> = {};
        options.forEach((opt, i) => {
            map[opt.id] = i;
        });
        return map;
    }, [options]);

    const parseAnchoredFilters = (value: any): Record<number, Set<string>> => {
      const anchored: Record<number, Set<string>> = {};
      if (!value || typeof value !== "object") return anchored;

      Object.entries(value).forEach(([key, ids]) => {
        const index = Number(key);
        if (Number.isNaN(index) || !Array.isArray(ids)) return;
        anchored[index] = new Set(ids.filter((id) => typeof id === "string"));
      });

      return anchored;
    };

    useEffect(() => {
      const savedRaw = localStorage.getItem(FILTERS_KEY);
      if (!savedRaw) return;

      try {
        const saved = JSON.parse(savedRaw) as PersistedFilterState;

        if (typeof saved.query === "string") setQuery(saved.query);
        if (Array.isArray(saved.colorFilter)) setColorFilter(new Set(saved.colorFilter.filter((value) => typeof value === "number")));
        if (saved.colorFilterAnchored) setColorFilterAnchored(parseAnchoredFilters(saved.colorFilterAnchored));
        if (typeof saved.showNewFilter === "boolean") setShowNewFilter(saved.showNewFilter);
        if (saved.groupStates && typeof saved.groupStates === "object") setGroupStates(saved.groupStates);
        if (typeof saved.showNarrowGroups === "boolean") setShowNarrowGroups(saved.showNarrowGroups);
      } catch {
        // Ignore invalid persisted filter state
      }
    }, []);

    useEffect(() => {
      const persisted: PersistedFilterState = {
        query,
        colorFilter: Array.from(colorFilter),
        colorFilterAnchored: Object.fromEntries(
          Object.entries(colorFilterAnchored).map(([key, value]) => [key, Array.from(value)])
        ) as Record<number, string[]>,
        showNewFilter,
        groupStates,
        showNarrowGroups,
      };

      localStorage.setItem(FILTERS_KEY, JSON.stringify(persisted));
    }, [query, colorFilter, colorFilterAnchored, showNewFilter, groupStates, showNarrowGroups]);

    // TIPS MODAL
    const [showWelcome, setShowWelcome] = useState(false);

    useEffect(() => {
      const key = "corruchart-welcome-last-shown";
      const lastShown = localStorage.getItem(key);
      const now = Date.now();
      const SIX_HOURS = 6 * 60 * 60 * 1000;

      if (!lastShown || now - Number(lastShown) >= SIX_HOURS) {
        setShowWelcome(true);
      }
    }, []);

    // HAS USER SEEN THE UPDATES?
    useEffect(() => {
    const seen = localStorage.getItem("corruchart-changelog-seen");
    if (seen !== CHANGELOG_VERSION) {
    setHasNewUpdate(true);
    }
    }, []);

    // HAS USER SEEN THE GUIDE?
    useEffect(() => {
    // No highlighted tips = no NEW state
    if (GUIDE_TIPS_TO_HIGHLIGHT.length === 0) {
        setHasNewGuide(false);
        return;
    }

    const seen = localStorage.getItem("corruchart-guide-seen");

    if (seen !== GUIDE_VERSION) {
        setHasNewGuide(true);
    } else {
        setHasNewGuide(false);
    }
    }, []);

    const openChangelog = () => {
    setShowChangelog(true);

    if (hasNewUpdate) {
    localStorage.setItem("corruchart-changelog-seen", CHANGELOG_VERSION);
    setHasNewUpdate(false);
    }
    };

    const openGuide = () => {
    setShowWelcome(true);
    };

    const markGuideSeen = () => {
    localStorage.setItem("corruchart-guide-seen", GUIDE_VERSION);
    setHasNewGuide(false);
    };


    // Update your close function
    const closeWelcome = () => {
        setShowWelcome(false);
        localStorage.setItem("corruchart-welcome-last-shown", Date.now().toString());
    };

    const parseCsvLine = (line: string) => {
      const values: string[] = [];
      let current = "";
      let inQuotes = false;

      for (let i = 0; i < line.length; i++) {
        const char = line[i];

        if (char === '"') {
          if (inQuotes && i + 1 < line.length && line[i + 1] === '"') {
            current += '"';
            i += 1;
          } else {
            inQuotes = !inQuotes;
          }
        } else if (char === "," && !inQuotes) {
          values.push(current);
          current = "";
        } else {
          current += char;
        }
      }

      values.push(current);
      return values;
    };

    const parseCsv = (csvText: string) => {
      const rows: Record<string, string>[] = [];
      const lines = csvText
        .trim()
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean);

      if (lines.length <= 1) return rows;

      const headers = parseCsvLine(lines[0]);
      for (let i = 1; i < lines.length; i++) {
        const values = parseCsvLine(lines[i]);
        const row: Record<string, string> = {};
        headers.forEach((header, index) => {
          row[header.trim()] = values[index] ?? "";
        });
        rows.push(row);
      }
      return rows;
    };

    const importSelectionsFromFile = async (file: File | null) => {
      if (!file) return;
      let raw = "";

      try {
        raw = await file.text();
      } catch (e) {
        alert("Unable to read the import file.");
        return;
      }

      const allowedValues = new Set(["indifferent", "disgust", "dislike", "maybe", "like", "love", "lust"]);
      const importedSelections: Record<string, string> = {};
      let importedFavorites: string[] = [];
      let importedRoles: string[] = [];

      if (file.name.toLowerCase().endsWith(".json") || file.type.includes("json")) {
        let payload: any;
        try {
          payload = JSON.parse(raw);
        } catch {
          alert("Invalid JSON file.");
          return;
        }

        if (payload && typeof payload === "object") {
          if (payload.selections && typeof payload.selections === "object") {
            Object.entries(payload.selections).forEach(([key, value]) => {
              if (typeof value === "string") importedSelections[key] = value.trim().toLowerCase();
            });
          } else {
            Object.entries(payload).forEach(([key, value]) => {
              if (typeof value === "string") importedSelections[key] = value.trim().toLowerCase();
            });
          }

          if (Array.isArray(payload.favorites)) {
            importedFavorites = payload.favorites.filter((item: any): item is string => typeof item === "string");
          }

          if (Array.isArray(payload.roles)) {
            importedRoles = payload.roles.filter((item: any): item is string => typeof item === "string");
          }
        }
      } else if (file.name.toLowerCase().endsWith(".csv") || file.type.includes("csv")) {
        const rows = parseCsv(raw);
        rows.forEach((row) => {
          if (!row.id) return;
          const value = row.value?.trim().toLowerCase();
          if (value && allowedValues.has(value)) {
            importedSelections[row.id] = value;
          }
        });
      } else {
        alert("Unsupported import file type. Use JSON or CSV.");
        return;
      }

      const normalizedSelections: Record<string, string> = {};
      Object.entries(importedSelections).forEach(([id, value]) => {
        if (allowedValues.has(value)) {
          normalizedSelections[id] = value;
        }
      });

      if (Object.keys(normalizedSelections).length === 0 && importedRoles.length === 0) {
        alert("No valid selections or roles found in the import file.");
        return;
      }

      const existingRaw = localStorage.getItem(RESULTS_KEY);
      const existingFavoritesRaw = localStorage.getItem("corruchart-favorites");
      if ((existingRaw && existingRaw !== "{}") || existingFavoritesRaw) {
        const confirmed = window.confirm(
          "Importing this file will overwrite your current Corruchart selections and favorites. Continue?"
        );
        if (!confirmed) return;
      }

      const roleSelections = importedRoles.reduce((acc, roleId) => {
        acc[roleId] = "like";
        return acc;
      }, {} as Record<string, string>);

      const mergedSelections = {
        ...normalizedSelections,
        ...roleSelections,
      };

      localStorage.setItem(RESULTS_KEY, JSON.stringify(mergedSelections));

      if (importedFavorites.length > 0) {
        localStorage.setItem("corruchart-favorites", JSON.stringify(importedFavorites));
      } else {
        localStorage.removeItem("corruchart-favorites");
      }

      const nextStates = options.map((option) => {
        const reaction = mergedSelections[option.id] ?? "indifferent";
        switch (reaction) {
          case "disgust": return 1;
          case "dislike": return 2;
          case "maybe": return 3;
          case "like": return 4;
          case "love": return 5;
          case "lust": return 6;
          default: return 0;
        }
      });

      setStates(nextStates);
      alert("Imported selections successfully.");
    };

    // Form submission handler for feedback
    const submitFeedbackForm = async (event: React.FormEvent<HTMLFormElement>) => {
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
          setShowFeedback(false);
          setShowFeedbackModal(false);
        } else {
          alert("Error submitting form.");
        }
      } catch (err) {
        console.error("Failed to submit form:", err);
        alert("Failed to send feedback. Please try again.");
      }
    };
    // -----------------------

    const [showChangelog, setShowChangelog] = useState(false);
    const CHANGELOG_VERSION = "0.34.1";
    const [hasNewUpdate, setHasNewUpdate] = useState(false);
    const [showFeedbackModal, setShowFeedbackModal] = useState(false);
    const [showFeedback, setShowFeedback] = useState(false);
    const [feedbackPos, setFeedbackPos] = useState<{ x: number; y: number } | null>(null);
    const [hasNewGuide, setHasNewGuide] = useState(false);
  
    const feedbackDragRef = useRef<{ x: number; y: number; mouseX: number; mouseY: number } | null>(null);

  /** SET ALL TO (Forbidden only) */
  const [setAllState, setSetAllState] = useState(0);
  const [inResetMode, setInResetMode] = useState(false);

  const cycleSetAllState = (dir: 1 | -1 = 1) => {
    const currentIndex = inResetMode ? COLOR_HEX.length : setAllState;
    const nextIndex = currentIndex + dir;
    const normalizedIndex =
      nextIndex < 0
        ? COLOR_HEX.length
        : nextIndex > COLOR_HEX.length
        ? 0
        : nextIndex;

    if (normalizedIndex === COLOR_HEX.length) {
      setInResetMode(true);
      setSetAllState(0);
    } else {
      setInResetMode(false);
      setSetAllState(normalizedIndex);
    }
  };

  const applySetAllState = () => {
    if (inResetMode) {
      if (
        !confirm(
          `Reset ALL interests to INDIFFERENT?\n\nThis cannot be undone.`
        )
      ) {
        return;
      }

      setStates((prev) => {
        return new Array(prev.length).fill(0); // Reset all to indifferent
      });
    } else {
      const colorName = COLOR_NAMES[setAllState];

      if (
        !confirm(
          `Set ALL VISIBLE interests to "${colorName.toUpperCase()}"?\n\nThis cannot be undone.`
        )
      ) {
        return;
      }

      setStates((prev) => {
        const next = [...prev];

        filtered.forEach(({ index }) => {
          next[index] = setAllState;
        });

        return next;
      });
    }
  };

  // Auto-hide tooltip after 20 seconds
  useEffect(() => {
    if (openDescription) {
      const timer = setTimeout(() => setOpenDescription(null), 7500);
      return () => clearTimeout(timer); // cleanup if tooltip closes early
    }
  }, [openDescription]);

  /** Load persisted numeric state from combined-selections safely */
  useEffect(() => {
    const savedRaw = localStorage.getItem("combined-selections");
    if (!savedRaw) {
      setStates(Array(options.length).fill(0));
      return;
    }

    try {
      const saved: Record<string, string> = JSON.parse(savedRaw);

      const initialStates = options.map((option) => {
        const reaction = saved[option.id] ?? "indifferent";

        switch (reaction) {
          case "disgust": return 1;
          case "dislike": return 2;
          case "maybe": return 3;
          case "like": return 4;
          case "love": return 5;
          case "lust": return 6;
          default: return 0; // indifferent
        }
      });

      setStates(initialStates);
    } catch {
      setStates(Array(options.length).fill(0));
    }
  }, [options]);
  


  /** Persist numeric state safely, merging with existing selections */
  useEffect(() => {
    if (!states.length) return;

    const existingRaw = localStorage.getItem(RESULTS_KEY);
    const existing: Record<string, string> = existingRaw ? JSON.parse(existingRaw) : {};

    const pageSelections = options.reduce((acc, option, i) => {
      acc[option.id] = STATE_TO_VALUE[states[i]];
      return acc;
    }, {} as Record<string, string>);

    // Merge: existing roles + CorruChart current page
    const merged = { ...existing, ...pageSelections };

    localStorage.setItem(RESULTS_KEY, JSON.stringify(merged));
  }, [states, options]);

  const cycleColor = (index: number, dir: 1 | -1 = 1) => {
    const finalDir = reverseColorCycle ? (-dir as 1 | -1) : dir;
    setStates(prev => {
      const next = [...prev];
      next[index] =
        (next[index] + finalDir + COLOR_HEX.length) % COLOR_HEX.length;

      // Trigger "+" for positive states
      if (next[index] >= 3) {
        const id = `${index}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
        setActivePluses(prev => [...prev, { index, id, state: next[index] }]);
        setTimeout(() => {
          setActivePluses(prev => prev.filter(p => p.id !== id));
        }, 800);
      }
      

      // Load existing selections from localStorage
      const existingRaw = localStorage.getItem("combined-selections");
      const existing: Record<string, string> = existingRaw ? JSON.parse(existingRaw) : {};

      // Build current page selections
      const pageSelections = options.reduce((acc, opt, i) => {
        acc[opt.id] = STATE_TO_VALUE[next[i]];
        return acc;
      }, {} as Record<string, string>);

      // Merge with existing (preserves Roles selections)
      const merged = { ...existing, ...pageSelections };

      localStorage.setItem("combined-selections", JSON.stringify(merged));

      return next;
    });
  };

    // PERSIST FORBIDDEN INTERESTS TOGGLE
    useEffect(() => {
    if (typeof window !== "undefined") {
        const saved = localStorage.getItem("showCategory6");
        if (saved === "true") setShowCategory6(true);
    }
    }, []);

    // SAVE TOGGLE
    useEffect(() => {
    localStorage.setItem("showCategory6", showCategory6 ? "true" : "false");
    }, [showCategory6]);

  /** Toggle color filter */
  const toggleColor = (colorIndex: number) => {
    setColorFilter((prev) => {
      const next = new Set(prev);
      const togglingOn = !next.has(colorIndex);

      if (togglingOn) {
        next.add(colorIndex);
        setColorFilterAnchored((prevAnchored) => {
          const anchored = { ...prevAnchored };
          const matchingIds = new Set(
            options
              .map((option, i) => ({ option, state: states[i] % COLOR_HEX.length }))
              .filter((item) => item.state === colorIndex)
              .map((item) => item.option.id)
          );
          anchored[colorIndex] = matchingIds;
          return anchored;
        });
      } else {
        next.delete(colorIndex);
        setColorFilterAnchored((prevAnchored) => {
          const anchored = { ...prevAnchored };
          delete anchored[colorIndex];
          return anchored;
        });
      }

      return next;
    });
  };

  /** Toggle new filter */
  const toggleNewFilter = () => {
    setShowNewFilter(!showNewFilter);
  };

useEffect(() => {
  const missing = options.filter(
    opt => !DESCRIPTIONS[opt.id]
  );

  if (missing.length) {
    console.group("❌ Options missing descriptions");
    missing.forEach(opt => {
      console.log(opt.id, opt.label);
    });
    console.groupEnd();
  } else {
    console.log("✅ All options have descriptions");
  }
}, [options]);

useEffect(() => {
  const checkSize = () => {
    // threshold ~ when right panel starts feeling cramped
    const hasRoom = window.innerWidth >= 1100;
  };

  checkSize();
  window.addEventListener("resize", checkSize);
  return () => window.removeEventListener("resize", checkSize);
}, []);

  const toggleGroup = (groupId: string) => {
    setGroupStates((prev) => {
      const next = { ...prev };

      if (!next[groupId]) {
        // NEUTRAL → INCLUDE
        next[groupId] = "include";
      } else if (next[groupId] === "include") {
        // INCLUDE → EXCLUDE
        next[groupId] = "exclude";
      } else {
        // EXCLUDE → NEUTRAL
        delete next[groupId];
      }

      return next;
    });
    // Clear new filter when group filter is used
    if (showNewFilter) setShowNewFilter(false);
  };

  /** Filtered options */
        const filtered = useMemo(() => {
  const q = query.trim().toLowerCase();

  const matchesAllFilters = (option: OptionWithCategory) => {
    const index = optionIndexById[option.id];

    const matchesText =
      !q ||
      option.label.toLowerCase().includes(q) ||
      option.aka.some((a) => a.toLowerCase().includes(q));

    const matchesColor =
      colorFilter.size === 0 ||
      Array.from(colorFilter).some((filterIndex) => {
        const anchored = colorFilterAnchored[filterIndex];
        const currentState = states[index] % COLOR_HEX.length;
        return (anchored?.has(option.id) ?? false) || currentState === filterIndex;
      });

    const matchesGroup =
      (!Object.values(groupStates).includes("include") ||
        option.tags.some((cat) => groupStates[cat] === "include")) &&
      !option.tags.some((cat) => groupStates[cat] === "exclude");

    const matchesCategory6 =
      showCategory6 || option.category !== 6;

    const matchesNew =
      !showNewFilter || newOptions.includes(option.id);

    return (
      matchesText &&
      matchesColor &&
      matchesGroup &&
      matchesCategory6 &&
      matchesNew
    );
  };

  // ⭐⭐⭐ KEY PART ⭐⭐⭐
  // If New filter is on → IGNORE SLOTS COMPLETELY
  if (showNewFilter) {
    return options
      .filter(matchesAllFilters)
      .map((option) => ({
        slot: { slotId: option.id, options: [option] },
        option,
        index: optionIndexById[option.id],
      }));
  }

  // Normal (variant-aware) behavior
  return slots.flatMap((slot) => {
    const matchingVariants = slot.options.filter(matchesAllFilters);

    if (matchingVariants.length === 0) return [];

    const activeIndex = activeVariant[slot.slotId] ?? 0;
    const active = slot.options[activeIndex % slot.options.length];

    const optionToShow = matchingVariants.includes(active)
      ? active
      : matchingVariants[0];

    return [
      {
        slot,
        option: optionToShow,
        index: optionIndexById[optionToShow.id],
      },
    ];
  });
}, [
  slots,
  options,
  activeVariant,
  optionIndexById,
  query,
  states,
  colorFilter,
  colorFilterAnchored,
  groupStates,
  showCategory6,
  showNewFilter,
  newOptions,
]);

  const isOptionVisible = (option: OptionWithCategory) => {
    const index = optionIndexById[option.id];

    const matchesText =
      !query ||
      option.label.toLowerCase().includes(query.trim().toLowerCase()) ||
      option.aka.some((a) => a.toLowerCase().includes(query.trim().toLowerCase()));

    const matchesColor =
      colorFilter.size === 0 ||
      Array.from(colorFilter).some((filterIndex) => {
        const anchored = colorFilterAnchored[filterIndex];
        const currentState = states[index] % COLOR_HEX.length;
        return (anchored?.has(option.id) ?? false) || currentState === filterIndex;
      });

    const matchesGroup =
      (!Object.values(groupStates).includes("include") ||
        option.tags.some((cat) => groupStates[cat] === "include")) &&
      !option.tags.some((cat) => groupStates[cat] === "exclude");

    const matchesCategory6 = showCategory6 || option.category !== 6;

    const matchesNew = !showNewFilter || newOptions.includes(option.id);

    return (
      matchesText &&
      matchesColor &&
      matchesGroup &&
      matchesCategory6 &&
      matchesNew
    );
  };

  const getFilterBlockReasons = (option: OptionWithCategory) => {
    const reasons: string[] = [];
    const index = optionIndexById[option.id];
    const queryTrimmed = query.trim().toLowerCase();

    const matchesText =
      !query ||
      option.label.toLowerCase().includes(queryTrimmed) ||
      (option.aka ?? []).some((a) => a.toLowerCase().includes(queryTrimmed));

    if (!matchesText) {
      reasons.push("search query");
    }

    const matchesColor =
      colorFilter.size === 0 ||
      Array.from(colorFilter).some((filterIndex) => {
        const anchored = colorFilterAnchored[filterIndex];
        const currentState = states[index] % COLOR_HEX.length;
        return (anchored?.has(option.id) ?? false) || currentState === filterIndex;
      });

    if (!matchesColor) {
      const activeColorNames = Array.from(colorFilter).map(
        (filterIndex) => COLOR_NAMES[filterIndex] ?? `state ${filterIndex}`
      );
      reasons.push(`color filter (${activeColorNames.join(", ")})`);
    }

    const hasIncludeFilters = Object.values(groupStates).includes("include");
    const excludedTags = option.tags.filter((cat) => groupStates[cat] === "exclude");
    const includedTags = option.tags.filter((cat) => groupStates[cat] === "include");

    if (excludedTags.length > 0) {
      reasons.push(`excluded tags: ${excludedTags.join(", ")}`);
    } else if (hasIncludeFilters && includedTags.length === 0) {
      const activeIncludes = Object.entries(groupStates)
        .filter(([, state]) => state === "include")
        .map(([cat]) => cat);
      if (activeIncludes.length > 0) {
        reasons.push(`required tags: ${activeIncludes.join(", ")}`);
      }
    }

    if (!showCategory6 && option.category === 6) {
      reasons.push("forbidden interests filter");
    }

    if (showNewFilter && !newOptions.includes(option.id)) {
      reasons.push("new options filter");
    }

    return reasons;
  };

  if (!states.length) return null;

  return (
<>

      <ChangelogFeedbackModal
        showChangelog={showChangelog}
        setShowChangelog={setShowChangelog}
        onFeedbackSubmit={submitFeedbackForm}
        hasNewUpdate={hasNewUpdate}
        setHasNewUpdate={setHasNewUpdate}
      />


      <GuideModal
        isOpen={showWelcome}
        onClose={closeWelcome}
        title="Corruchart Section"
        description="Here are some usage tips to make things smoother."
        buttonLabel="CHART"
        newTipIndices={hasNewGuide ? GUIDE_TIPS_TO_HIGHLIGHT : []}
        onMarkSeen={markGuideSeen}
        tips={[
          { title: "Corruption Values and Potion Types", images: ["images/potion-tips.png"] },
          { title: "Cycling Interests from Disgust to Lust", images: ["images/cycle.gif"] },
          { title: "Descriptions", images: ["images/descriptions.gif"] },
          { title: "Cycling Variants", images: ["images/variants.gif", "images/variants-continued.gif"] },
          { title: "Filters Can Prevent Variant Swapping", images: ["images/filters-preventing.gif"] },
          { title: "Setting Interests in Bulk", images: ["images/interests-bulk.gif"] },
          { title: "Dark Reader Is Incompatible", images: ["images/dark-reader.gif"] },
          { title: "Mouse Scroll Cycling", images: ["images/scroll.gif"] },
          { title: "Resetting Interests", images: ["images/resetting-interests.gif"] },
        ]}
      />



      <main className="min-h-screen px-8 pb-12" style={{ backgroundColor: "#1F2023" }}>
      {/* Controls */}
      <div className="py-4 space-y-3">
        <div className="flex items-center gap-4 flex-wrap">
          <input
            ref={searchInputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search options…"
            className="px-3 py-2 rounded bg-neutral-900 text-gray-100 placeholder-gray-400 outline-none w-64"
          />


            {/* Info/Help button */}
            <button
                type="button"
                onClick={openGuide}
                className={`px-4 py-2.5 rounded bg-neutral-900 text-neutral-400 hover:bg-neutral-800 cursor-pointer flex items-center justify-center text-sm gap-1 ${
                  hasNewGuide ? "ring-2 ring-violet-400" : ""
                }`}
            >
                <span className="font-bold text-neutral-200">Guide</span>
                {hasNewGuide && (
                  <span className="text-[10px] font-bold text-violet-300 ml-1">
                    NEW!
                  </span>
                )}
            </button>

            <label
              className="px-4 py-2.5 rounded bg-neutral-900 text-neutral-400 hover:bg-neutral-800 cursor-pointer flex items-center justify-center text-sm gap-1"
            >
              <span className="font-bold text-neutral-200">Import</span>
              <input
                type="file"
                accept=".json,.csv,application/json,text/csv"
                onChange={(event) => importSelectionsFromFile(event.target.files?.[0] ?? null)}
                className="hidden"
              />
            </label>


            <button
            type="button"
            onClick={openChangelog}
            className={`
                px-4 py-2.5 rounded bg-neutral-900 text-neutral-400
                hover:bg-neutral-800 cursor-pointer flex items-center justify-center text-sm gap-1
                ${hasNewUpdate ? "ring-2 ring-violet-400" : ""}
            `}
            >
            <span className="font-bold text-neutral-200">
                Changelog & Feedback
            </span>

            {hasNewUpdate && (
                <span className="text-[10px] font-bold text-violet-300 ml-1">
                NEW!
                </span>
            )}
            </button>

          <div className="flex items-center gap-2">
              {/* Forbidden toggle */}
              <button
                onClick={() => setShowCategory6((prev) => !prev)}
                className="px-4 py-2 rounded bg-neutral-900 text-neutral-400 hover:bg-neutral-800 cursor-pointer"
              >
                {showCategory6 ? "Forbidden Interests: ON" : "Forbidden Interests: OFF"}
              </button>

            <div
              className="
                flex items-center gap-1
                px-1 py-1
                rounded-md
                bg-neutral-900/60
                border border-neutral-800
              "
            >
              {/* SET ALL TO star */}
              <button
                onClick={() => cycleSetAllState(1)}
                onContextMenu={(e) => {
                  e.preventDefault();
                  cycleSetAllState(-1);
                }}
                className="
                  flex items-center gap-2
                  px-3 py-2
                  rounded-sm
                  bg-neutral-900
                  hover:bg-neutral-800
                  cursor-pointer
                "
              >
                <span className="text-sm font-semibold text-gray-300">
                  {inResetMode ? "RESET ALL TO ★" : "SET ALL VISIBLE TO"}
                </span>

                {!inResetMode && (
                  <svg
                    className="cursor-pointer"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill={COLOR_HEX[setAllState]}
                    stroke="#000"
                    strokeWidth="0.5"
                  >
                    <path d="M12 2.5l2.9 6.1 6.7.6-5 4.4 1.5 6.5L12 16.8 5.9 20.1l1.5-6.5-5-4.4 6.7-.6L12 2.5z" />
                  </svg>
                )}
              </button>

              {/* Apply button */}
              <button
                onClick={applySetAllState}
                className="
                  px-3 py-2
                  rounded-sm
                  text-sm font-semibold
                  bg-neutral-900
                  text-neutral-300
                  hover:bg-neutral-700/50
                  hover:text-white
                  transition-colors
                  cursor-pointer
                "
              >
                Apply
              </button>
             
            </div>
          </div>

                <div className="flex items-center gap-2 flex-wrap">
                <SettingsButton />
                </div>

          <Link
            href="/test"
            className="px-4 py-2 rounded bg-neutral-900 text-neutral-200 hover:bg-violet-500/30 hover:text-neutral-300 cursor-pointer"
          >
            Sets Mode
          </Link>

          <Link
            href="/roles"
            className="px-4 py-2 rounded bg-neutral-900 text-neutral-200 hover:bg-violet-500/30 hover:text-neutral-300 cursor-pointer"
          >
            Next
          </Link>


          <span className="text-gray-400">
            Showing {filtered.length} / {slots.length}
          </span>
        </div>

        {/* Broad group filter */}
        <div className="flex items-center gap-1 py-0 flex-wrap">
        <span className="text-gray-400 mr-2">Broad Tags:</span>

  {broadGroups.map(group => {
    const state = groupStates[group.id];

    return (
      <button
        key={group.id}
        onClick={() => toggleGroup(group.id)}
        className={`px-3 py-1 rounded font-medium transition cursor-pointer ${
          state === "include"
            ? "bg-green-700 text-green-100"
            : state === "exclude"
            ? "bg-red-700 text-red-100 line-through"
            : "bg-neutral-900 text-gray-400 hover:bg-neutral-800"
        }`}
      >
        {group.name}
      </button>
    );
  })}

  {/* Show / Hide Narrow Tags button */}
  <button
    onClick={() => setShowNarrowGroups(v => !v)}
    className="
      ml-2
      px-3 py-1
      rounded
      bg-neutral-800
      text-gray-300
      hover:bg-neutral-700
      transition
      cursor-pointer
      whitespace-nowrap
    "
  >
    {showNarrowGroups ? "Hide Narrow Tags" : "Show Narrow Tags"}
  </button>
</div>

        {showNarrowGroups && (
        <div className="flex items-center gap-1 py-0 flex-wrap">

            {narrowGroups.map(group => {
            const state = groupStates[group.id];

            return (
                <button
                key={group.id}
                onClick={() => toggleGroup(group.id)}
                className={`px-3 py-1 rounded font-medium transition cursor-pointer ${
                    state === "include"
                    ? "bg-green-700 text-green-100"
                    : state === "exclude"
                    ? "bg-red-700 text-red-100 line-through"
                    : "bg-neutral-900 text-gray-400 hover:bg-neutral-800"
                }`}
                >
                {group.name}
                </button>
            );
            })}
        </div>
        )}

        {/* Color filter */}
        <div className="flex items-center gap-1 flex-wrap">
          {COLOR_HEX.map((hex, i) => {
            const active = colorFilter.has(i);
            return (
              <button
                key={i}
                onClick={() => toggleColor(i)}
                className={`flex items-center gap-2 px-2 py-1 rounded cursor-pointer ${active ? "bg-neutral-700" : "bg-neutral-900"
                  }`}
              >
                <span
                  style={{
                    width: 14,
                    height: 14,
                    borderRadius: "50%",
                    backgroundColor: hex,
                    border: "1px solid #000",
                  }}
                />
                <span className={`text-sm ${active ? "text-gray-100" : "text-gray-400"}`}>
                  {COLOR_NAMES[i]}
                </span>
              </button>
            );
          })}
          {/* New! button */}
          <button
            onClick={toggleNewFilter}
            className={`flex items-center gap-2 px-3 py-1 rounded cursor-pointer font-bold ${
              showNewFilter ? "bg-purple-600 text-white" : "bg-neutral-900 text-purple-400 hover:bg-neutral-800"
            }`}
          >
            <span className="text-sm">v0.33.0-0.34.1(NEW!)</span>
          </button>
        </div>
      </div>

          <OptionsGrid
              filtered={filtered}
              states={states}
              options={options}
              activePluses={activePluses}
              activeVariant={activeVariant}
              isOptionVisible={isOptionVisible}
              getFilterBlockReasons={getFilterBlockReasons}
              openDescription={openDescription}
              setOpenDescription={setOpenDescription}
              setActiveVariant={setActiveVariant}
              cycleColor={cycleColor}
          />
    </main>
    </>
  );
}
