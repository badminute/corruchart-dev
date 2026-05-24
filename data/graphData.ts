export type NodeData = {
  id: string;
  label: string;
  x: number;
  y: number;
  children?: string[];
};

export const SCALE = 60;

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
  y: 4,
  children: ["footWorship", "dirtyFeet", "heels", "socks", "shoeSniffing"],
},

tits:  { id: "tits",  label: "Tits",  x: -6, y: 4 },
pecs:  { id: "pecs",  label: "Pecs",  x: -3, y: 4 },
hands: { id: "hands", label: "Hands", x: 2,  y: 4 },
thighs:{ id: "thighs",label: "Thighs",x: 3,  y: 4 },
legs:  { id: "legs",  label: "Legs",  x: 6,  y: 4 },

footWorship: { id: "footWorship", label: "Foot Worship", x: -4, y: 8 },
dirtyFeet:   { id: "dirtyFeet",   label: "Dirty Feet",   x: -2, y: 8 },
heels:       { id: "heels",       label: "Heels",        x: 0,  y: 8 },
socks:       { id: "socks",       label: "Socks",        x: 2,  y: 8 },
shoeSniffing:{ id: "shoeSniffing",label: "Shoe Sniffing",x: 4,  y: 8 },
};