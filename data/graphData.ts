export type NodeData = {
  id: string;
  label: string;
  x: number;
  y: number;
  children?: string[];
};

export const SCALE = 100;

export const NODE_MAP: Record<string, NodeData> = {
  lowerBody: {
    id: "lowerBody",
    label: "Lower Body",
    x: 0,
    y: 0,
    children: ["feet", "legs", "thighs"],
  },

  upperBody: {
    id: "upperBody",
    label: "Upper Body",
    x: 6,
    y: 0,
    children: ["tits", "pecs", "hands"],
  },

  feet: {
    id: "feet",
    label: "Feet",
    x: 0,
    y: 3,
    children: ["footWorship", "dirtyFeet", "heels", "socks", "shoeSniffing"],
  },

  tits: { id: "tits", label: "Tits", x: -4, y: 2 },

  hands: { id: "hands", label: "Hands", x: -4, y: 2 },

  pecs: { id: "pecs", label: "Pecs", x: -4, y: 2 },

  legs: { id: "legs", label: "Legs", x: -2, y: 2 },

  thighs: { id: "thighs", label: "Thighs", x: -4, y: 2 },

  footWorship: { id: "footWorship", label: "Foot Worship", x: -3, y: 6 },

  dirtyFeet: { id: "dirtyFeet", label: "Dirty Feet", x: -1, y: 6 },

  heels: { id: "heels", label: "Heels", x: 1, y: 6 },

  socks: { id: "socks", label: "Socks", x: 3, y: 6 },

  shoeSniffing: { id: "shoeSniffing", label: "Shoe Sniffing", x: 5, y: 6 },
};