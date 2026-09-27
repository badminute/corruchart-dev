export type InterestBranch = {
    id: string;
    label: string;
    eyebrow?: string;
    description?: string;
    children: string[];
};

export const INTEREST_ROOTS = ["vanilla", "oral", "vore"];

export const INTEREST_BRANCHES: Record<string, InterestBranch> = {
    vanilla: {
        id: "vanilla",
        label: "VANILLA",
        eyebrow: "ROOT / EVERYDAY",
        description: "Familiar gestures and low-intensity closeness.",
        children: ["hand-holding", "cuddling", "kissing"],
    },
    oral: {
        id: "oral",
        label: "ORAL",
        eyebrow: "ROOT / SENSATION",
        description: "Interests organized around the mouth and sound.",
        children: ["gum-chewing", "blowjobs", "oral-vore"],
    },
    vore: {
        id: "vore",
        label: "VORE",
        eyebrow: "ROOT / SENSATION",
        description: "Interests organized around the mouth and sound.",
        children: ["oral-vore"],
    },






    "hand-holding": {
        id: "hand-holding",
        label: "HAND HOLDING",
        eyebrow: "VANILLA",
        description: "A small point of contact that opens into closeness.",
        children: [],
    },
    cuddling: {
        id: "cuddling",
        label: "CUDDLING",
        eyebrow: "VANILLA",
        children: [],
    },
    kissing: {
        id: "kissing",
        label: "KISSING",
        eyebrow: "VANILLA / ORAL",
        children: ["making-out"],
    },
    "gum-chewing": {
        id: "gum-chewing",
        label: "GUM CHEWING",
        eyebrow: "ORAL",
        description: "A rhythmic, audible branch of oral sensation.",
        children: [],
    },
    asmr: {
        id: "asmr",
        label: "ASMR",
        eyebrow: "AURAL",
        children: ["gum-chewing"],
    },
    biting: {
        id: "biting",
        label: "BITING",
        eyebrow: "SENSATION",
        children: [],
    },
    blowjobs: {
        id: "blowjobs",
        label: "BLOWJOBS",
        eyebrow: "ORAL SEX",
        description: "A deeper branch connected to oral contact.",
        children: ["deepthroating", "deepthroat-r"],
    },
    "oral-vore": {
        id: "oral-vore",
        label: "ORAL VORE",
        eyebrow: "ORAL / FANTASY",
        children: [],
    },
};