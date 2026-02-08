import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
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
