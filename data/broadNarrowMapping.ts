export const BROAD_NARROW_MAPPING: Record<string, string[]> = {
  "upper-body": [
    "tits", 
    "hands",
    "armpits",
  ],
  "lower-body": [
    "legs",
    "feet",
    "thighs",
  ],
  // Add more broad categories as needed
};

// Helper function to check if a narrow tag belongs to a broad tag
export function belongsToBroad(narrowId: string, broadId: string): boolean {
  return BROAD_NARROW_MAPPING[broadId]?.includes(narrowId) || false;
}