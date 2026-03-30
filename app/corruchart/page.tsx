"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";

import type { OptionData as Option } from "@/data/options";
import { GROUPS } from "@/data/groups";
import { OPTIONS } from "@/data/options";
import { DESCRIPTIONS } from "@/data/descriptions";
import SettingsButton from "@/components/SettingsButton";
import OptionsGrid from "@/components/OptionsGrid";
import { WelcomeSlideshow } from "@/components/onboarding";
import { useSettings } from "@/components/SettingsContext";
import { useNewOptions } from "@/components/NewOptionsList";

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
        }));
    }, [options]);

    // curated list of new options
    const newOptions = useNewOptions();

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
    const openChangelog = () => {
    setShowChangelog(true);

    if (hasNewUpdate) {
    localStorage.setItem("corruchart-changelog-seen", CHANGELOG_VERSION);
    setHasNewUpdate(false);
    }
    };


    // Update your close function
    const closeWelcome = () => {
        setShowWelcome(false);
        localStorage.setItem("corruchart-welcome-last-shown", Date.now().toString());
    };
    
    // Form submission handler
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
    const CHANGELOG_VERSION = "0.32.0";
    const [hasNewUpdate, setHasNewUpdate] = useState(false);
    const [showFeedback, setShowFeedback] = useState(false);
    const [feedbackPos, setFeedbackPos] = useState<{ x: number; y: number } | null>(null);
    const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  
    const feedbackDragRef = useRef<{ x: number; y: number; mouseX: number; mouseY: number } | null>(null);

  /** SET ALL TO (Forbidden only) */
  const [setAllState, setSetAllState] = useState(0);
  const [inResetMode, setInResetMode] = useState(false);

  const cycleSetAllState = () => {
    if (inResetMode) {
      // Cycle from reset mode back to state 0
      setInResetMode(false);
      setSetAllState(0);
    } else if (setAllState === COLOR_HEX.length - 1) {
      // Cycle from last state to reset mode
      setInResetMode(true);
    } else {
      // Cycle through normal states
      setSetAllState((prev) => (prev + 1) % COLOR_HEX.length);
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
    // Clear new filter when color filter is used
    if (showNewFilter) setShowNewFilter(false);
  };

  /** Toggle new filter */
  const toggleNewFilter = () => {
    setShowNewFilter(!showNewFilter);
    // Clear color filters and anchoring when new filter is activated
    if (!showNewFilter) {
      setColorFilter(new Set());
      setColorFilterAnchored({});
    }
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
    const hasActiveFilters =
        q ||
        colorFilter.size > 0 ||
        Object.keys(groupStates).length > 0 ||
        !showCategory6 ||
        showNewFilter;

    return slots.flatMap((slot) => {
        // Step 1: find ALL variants in this slot that match filters
        const matchingVariants = slot.options.filter((option) => {
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
            !showNewFilter ||
            newOptions.includes(option.id);

        return (
            matchesText &&
            matchesColor &&
            matchesGroup &&
            matchesCategory6 &&
            matchesNew
        );
        });

        // Step 2: if filters are active and nothing matched, hide slot
        if (hasActiveFilters && matchingVariants.length === 0) {
        return [];
        }

        // Step 3: decide which variant to show
        let optionToShow: OptionWithCategory;

        if (matchingVariants.length > 0) {
        // Prefer the currently active variant if it matches
        const activeIndex = activeVariant[slot.slotId] ?? 0;
        const active = slot.options[activeIndex % slot.options.length];

        optionToShow = matchingVariants.includes(active)
            ? active
            : matchingVariants[0];
        } else {
        // No filters → normal behavior
        const activeIndex = activeVariant[slot.slotId] ?? 0;
        optionToShow = slot.options[activeIndex % slot.options.length];
        }

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

  if (!states.length) return null;

  return (
<>

   {/* CHANGELOG MODAL */}
{showChangelog && (
  <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4">
    <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-2xl w-full max-w-6xl h-[650px] shadow-2xl flex flex-row gap-6">
      
     {/* LEFT SIDE */}
        <div className="flex-1 flex flex-col">
        {/* Header */}
        <h2 className="text-2xl font-bold text-center text-violet-400 mb-4">
          Changelog
        </h2>

        {/* Description */}
        <div className="text-gray-400 text-center text-lg mb-4">
          <p>Recent changes, additions, and improvements.</p>
        </div>

        {/* CHANGELOG CONTENT */}
        <div className="flex-1 overflow-y-auto pr-2 space-y-6 text-gray-300">
        <div>
          <h3 className="text-lg font-semibold text-white">
            v0.32.0 — QOL Update 2
          </h3>
          <ul className="list-disc ml-6 mt-2 space-y-1">
            <li>The indifferent/unset filter actually helps now.</li>
            <li>Added a reverse color cycling toggle and scroll cycling toggle to the settings menu.</li>
            <li>Added a new SET ALL VISIBLE TO cycle to RESET ALL interests regardless of filter.</li>
          </ul>
        </div>
        <div>
          <h3 className="text-lg font-semibold text-white">
            v0.31.0 — Results Sharing
          </h3>
          <ul className="list-disc ml-6 mt-2 space-y-1">
            <li>Results are now stored in the metadata of the exported image. This image file can be imported on the Results page to give you interactive results. All information and redactions within the image metadata are secured using AES-GCM encryption, with XOR encryption as a fallback. Here's hoping that platforms don't scrub the metadata of shared image files.</li>
            <li>Added a feedback button to the changelog modal on the chart page itself.</li>
          </ul>
        </div>
        <div>
          <h3 className="text-lg font-semibold text-white">
            v0.30.0 — QOL Update 1
          </h3>
          <ul className="list-disc ml-6 mt-2 space-y-1">
            <li>Added these interests: Amateur Porn, Autofootjobs (Pussies), Autofootjobs (Cocks), Bratty Domination, Chasers, Chasing, Dykebreaking, Fat Femboys, Flat Thighs, Foot Fucking, Futanari Facefucking, Futanari Facesitting, Grossdom, Hyper Nipples, Karate Gi, Ladypots, Litter Pregnancies, Living Clothes, Male Omorashi, Manure, Milking Table, Monster Pregnancies, Muscular Thighs, Mutual Weight Gain, OTK Spanking, Overfull Balls, Pro-Amateur Porn, Professional Porn, Sloppy Blowjobs, Sloppy Blowjobs (Receiving), Soft Thighs, Tentaclothes, TERFbreaking, Through The Clothes, TNWO, and Twerking!</li>
            <li>Number of variants are shown next to each interest.</li>
            <li>A new star to indicate maybe/interested.</li>
            <li>A warning is now shown when applied filter is preventing variants from being swapped.</li>
            <li>A filter for newly added interests so you can easily weigh on new additions instead of having to look for them.</li>
          </ul>
        </div>
        <div>
          <h3 className="text-lg font-semibold text-white">
            v0.29.8 — The Futa Update
          </h3>
          <ul className="list-disc ml-6 mt-2 space-y-1">
            <li>Added these futa interests: Casual Erections (Futa), Centaur Futas, Embarrassed Nude Futa, Futa Autopaizuri, Futa Cock Comparison, Futa Daddies, Futa Doms, Futa Heat Transformation, Futa Masturbation Desperation, Futa Mommies, Futa NTR, Futa Pregnancies, Futa Rape, Futa Sex Toys, Futa Shame Transformation, Futa Subs, Futa Underwear Transformation, Futa Virus, Hyper Futas, Loli Futas, Magic Onaholes, Male Futas, Masturbation Desperation, Masturbation (Futa), Needy Futas, Small Futas, and Werefutas!</li>
            <li>Added 'receiving' versions to these: Assjobs, Ballbusting, Blowjobs, and Deepthroat.</li>
            <li>Added these interests: Adult Comics, Adult Games, Animal Ears, Animated Porn, Auctioning, Autofootjobs, Casual Erections, Clothed Female Nude Female, Cock Births, Cock Comparison, Deepthroating, Denim, Needy Girls, Needy Guys, Pelvic Curtain Dresses, Polynesian Sex, Self Impregnation, Stuck In A Floor, Stuck In A Wall, Womb Tattoo (Arousal), and Womb Tattoo (Curse)!</li>
            <li>Adjusted the corruption score thresholds to account for score inflation.</li>
          </ul>
        </div>
        <div>
          <h3 className="text-lg font-semibold text-white">
            v0.29.7 — The Batch Update
          </h3>
          <ul className="list-disc ml-6 mt-2 space-y-1">
            <li>Added these interests: Alien Impregnation, Anal Birthing, Aphrodisiac Spores, Bodily Fluids Into Food/Drinks, Bodily Fluids Into Food/Drinks (NC), Brain Fucking, Budding Breasts, Cigarette Burns, Clothes Theft, Cockroaches, Doll Anatomy, Ear Fucking (Pleasure), Ear Fucking (Gore), Ear Whispers & Blowing, Eyesocket Fucking, Face Play & Distortion, Femdom (Brutal), Finger Lacing, Finger-Toe Lacing, Foot Gagging, Forced Detransition, Fractionation Hypnosis, Frilly Clothing, Gothic Lolita, Heterochromia, Hothusbanding, Human Ashtray, Human Incubator, Hypnotic Eyes, Loli Pregnancies, Mastectomy, Nipple Births, Nudism, Nullification, Ovary Removal, Penis Flies, Piss Drinking, Plant Vore, Pre-Trans Selfcest, Split Tongues, Stomach Growling, Stranded Island Theme, Throat Impregnation, and Toe Lacing!</li>
            <li>Added these censorship interests: Humiliation Censorship (Cocks), Humiliation Censorship (General), Humiliation Censorship (Silhouettes & Bars), and Humiliation Censorship (Text & Symbols)</li>
            <li>Added these macrophilia interests: Giant (Unaware), Giant (Cruel), Giant (Gentle), and Giant (Growth)</li>
            <li>Added various 'receiving' versions of acts.</li>
            <li>Added these roles: Tiny, Princess, Sugar Baby, Nudist, and Giantess</li>
            <li>Cleaned up Macrophilia tag.</li>
          </ul>
        </div>
        <div>
          <h3 className="text-lg font-semibold text-white">
            v0.29.6 — The Incest Update
          </h3>
          <ul className="list-disc ml-6 mt-2 space-y-1">
            <li>Added these interests: Younger Brother x Older Sister Incest, Younger Sister x Older Brother Incest, Second Cousin Incest, Same Sex Incest, Same Age Incest, Half Sibling Incest, Full Blooded Incest, Age Gaps (Siblings), and Stranded Island Incest!</li>
          </ul>
        </div>
        <div>
          <h3 className="text-lg font-semibold text-white">
            v0.29.5 — The Men's Update
          </h3>
          <ul className="list-disc ml-6 mt-2 space-y-1">
            <li>Added these interests: Slim Pecs, Jacked Pecs, Shelf Pecs, Soft Pecs, Princes, Bifauxnen, Bishounen, Bishie Princes, Chest Scars, Clothed Male Nude Male, Embarrassed Nude Male, Femboy Pregancies, Genderbend Servitude, Blueberry Boys, Shota Pregnancies, T-Dick Pumping, Magical Boys, Maledom (Brutal), and Distressed Dudes!</li>
            <li>Added a Colorblind Mode in Options.</li>
          </ul>
        </div>
        <div>
          <h3 className="text-lg font-semibold text-white">
            v0.29.4 — The Poop Update
          </h3>
          <ul className="list-disc ml-6 mt-2 space-y-1">
            <li>Added a Poop tag!</li>
            <li>Added these interests: Coprophagia, Fecal Transfer, Hyperscat, Hypermess, Scat Smearing, Scat Cooking, Candy Scat, Soiling, Messing, Septic Tanks, and Scat Sex!</li>
            <li>A new colourscheme for forbidden corruption reached.</li>
            <li>Increased corruption amounts for several interests.</li>
          </ul>
        </div>

        <div>
          <h3 className="text-lg font-semibold text-white">
            v0.29.3 — The Changelog Update
          </h3>
          <ul className="list-disc ml-6 mt-2 space-y-1">
            <li>Added a changelog, expect plenty of new things to show here!</li>
            <li>Added these interests: Pillow Humping, Gumjobs, and Wide Tongues.</li>
            <li>Separated BBW/BHM, SSBW/SSBHM</li>
            <li>Description and label chiseling.</li>
          </ul>
        </div>

        <div>
          <h3 className="text-lg font-semibold text-white">
            v0.29.2
          </h3>
          <ul className="list-disc ml-6 mt-2 space-y-1">
            <li>Added a legend for tag affinities.</li>
          </ul>
        </div>

        <div>
          <h3 className="text-lg font-semibold text-white">
            v0.29.1
          </h3>
          <ul className="list-disc ml-6 mt-2 space-y-1">
            <li>Little bits and bobs of chiseling.</li>
          </ul>
        </div>

        <div>
          <h3 className="text-lg font-semibold text-white">
            v0.29.0
          </h3>
          <ul className="list-disc ml-6 mt-2 space-y-1">
            <li>Added a search button for tag affinities.</li>
          </ul>
        </div>
      </div>

      {/* Button — identical to Guide modal */}

        <div className="flex gap-2 mt-4">
          <button
            onClick={() => setShowFeedbackModal(true)}
            className="flex-1 py-3 bg-neutral-800 hover:bg-violet-500/30 cursor-pointer text-white font-semibold rounded-xl transition-colors"
          >
            Give Feedback
          </button>

          <button
            onClick={() => setShowChangelog(false)}
            className="flex-1 py-3 bg-neutral-800 hover:bg-violet-500/30 cursor-pointer text-white font-semibold rounded-xl transition-colors"
          >
            CLOSE
          </button>
        </div>
      </div>

      {/* Feedback Modal */}
      {showFeedbackModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-neutral-900 border border-neutral-700 rounded-xl p-6 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-violet-400 mb-4">Send Feedback</h3>

            <form
              id="feedbackForm"
              onSubmit={submitFeedbackForm}
              action="https://formsubmit.co/badminute@protonmail.com"
              method="POST"
              className="flex flex-col gap-2"
            >
              {/* FormSubmit Configuration */}
              <input type="hidden" name="_subject" value={`Corruchart Feedback - ${new Date().toLocaleDateString()}`} />
              <input type="hidden" name="_captcha" value="false" />
              <input type="hidden" name="_template" value="table" />

              <input type="text" name="name" placeholder="Nickname" className="px-2 py-1 rounded text-white bg-neutral-800 text-sm" required />
              <input type="email" name="email" placeholder="Email (Possibly Get a Reply)" className="px-2 py-1 rounded text-white bg-neutral-800 text-sm" />
              <input type="text" name="honeypot" style={{ display: "none" }} />
              <textarea
                name="message"
                placeholder="Your feedback (suggestions, typos, improvements, adjustments, ideas, kisses, etc.)"
                className="px-2 py-1 rounded text-white bg-neutral-800 text-sm resize-y min-h-[10rem] max-h-96 overflow-y-auto"
                required
              />

              <div className="flex gap-2 mt-4">
                <button
                  type="button"
                  onClick={() => setShowFeedbackModal(false)}
                  className="flex-1 px-3 py-2 rounded cursor-pointer bg-neutral-700 text-white hover:bg-neutral-600 transition-colors text-sm font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-3 py-2 rounded cursor-pointer bg-green-800 text-white hover:bg-green-600 transition-colors text-sm font-semibold"
                >
                  Send
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    
    </div>
  </div>
)}


      {/* MODAL OVERLAY */}
{showWelcome && (
  <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4">
    <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-2xl w-full max-w-4xl h-[650px] shadow-2xl flex flex-col">
      
      {/* Header */}
      <h2 className="text-2xl font-bold text-center text-violet-400 mb-4">
        Corruchart Section
      </h2>

      {/* Description */}
      <div className="text-gray-400 text-center text-lg mb-4">
        <p>Here are some usage tips to make things smoother.</p>
      </div>

      {/* Slideshow */}
      <div className="flex-1">
        <WelcomeSlideshow 
          images={[
            "images/potion-tips.png", 
            "images/cycle.gif",
            "images/descriptions.gif",
            "images/variants.gif",
            "images/variants-continued.gif",
            "images/filters-preventing.gif",
            "images/interests-bulk.gif",
            "images/dark-reader.gif", 
            "images/scroll.gif",
            "images/resetting-interests.gif",

          ]} 
        />
      </div>

      {/* Button */}
      <button
        onClick={closeWelcome}
        className="w-full py-3 mt-4 bg-neutral-800 hover:bg-violet-500/30 cursor-pointer text-white font-semibold rounded-xl transition-colors"
            >
                CHART
            </button>

            </div>
        </div>
        )}



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
                onClick={() => setShowWelcome(true)}
                className="px-4 py-2.5 rounded bg-neutral-900 text-neutral-400 hover:bg-neutral-800 cursor-pointer flex items-center justify-center text-sm gap-1"
            >
                <span className="font-bold text-neutral-200">Guide</span>
            </button>

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
                onClick={cycleSetAllState}
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
                  {inResetMode ? "RESET ALL" : "SET ALL VISIBLE TO"}
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
            <span className="text-sm">v0.29.6-0.31.0</span>
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
              openDescription={openDescription}
              setOpenDescription={setOpenDescription}
              setActiveVariant={setActiveVariant}
              cycleColor={cycleColor}
          />
    </main>
    </>
  );
}
