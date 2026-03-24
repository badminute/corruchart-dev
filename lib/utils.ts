import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// =========================
// Shareable URL helpers
// =========================
import { Reaction } from "@/data/scoring";
import { compressToEncodedURIComponent, decompressFromEncodedURIComponent } from "lz-string";

// Use lz-string's URL-encoded compression to produce short, URL-safe tokens.

/**
 * Encode a mapping of `id -> Reaction` into a compact, URL-safe seed string.
 * Only non-`indifferent` values are included to keep the string small.
 */
export type SeedPayload = {
  entries: [string, Reaction][];
  redacted?: string[];
  favorites?: string[];
};

/**
 * Encode a mapping of `id -> Reaction` plus optional `redacted` ids and `favorites` into a compact seed string.
 */
export function encodeSelections(
  input: Record<string, Reaction> | { id: string; value: Reaction }[],
  redacted?: string[],
  favorites?: string[]
) {
  const obj: Record<string, Reaction> = Array.isArray(input)
    ? Object.fromEntries(input.map((s) => [s.id, s.value]))
    : { ...input };

  const entries = Object.entries(obj)
    .filter(([, v]) => v && v !== "indifferent")
    .sort(([a], [b]) => a.localeCompare(b));

  const payload: SeedPayload = { entries };
  if (redacted && redacted.length > 0) payload.redacted = redacted.slice().sort();
  if (favorites && favorites.length > 0) payload.favorites = favorites.slice().sort();

  const json = JSON.stringify(payload);
  return compressToEncodedURIComponent(json);
}

/**
 * Decode a seed produced by `encodeSelections` back into a selections map and redacted list.
 */
export function decodeSelections(seed: string): { selections: Record<string, Reaction>; redacted: string[]; favorites: string[] } {
  const json = decompressFromEncodedURIComponent(seed);
  if (!json) return { selections: {}, redacted: [], favorites: [] };

  const payload: SeedPayload = JSON.parse(json);
  const selections = Object.fromEntries(payload.entries || []) as Record<string, Reaction>;
  const redacted = payload.redacted ?? [];
  const favorites = payload.favorites ?? [];
  return { selections, redacted, favorites };
}

/* =========================
   Narrow tags check
   ========================= */

type TaggedItem = {
  id: string;
  tags?: string[];
};

export function narrowTagsCheck(
  items: TaggedItem[],
  narrowTags: readonly string[]
): string[] {
  const narrow = new Set(narrowTags);

  return items
    .filter(item => !item.tags?.some(tag => narrow.has(tag)))
    .map(item => item.id);
}
