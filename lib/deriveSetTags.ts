// lib/deriveSetTags.ts
import { OPTIONS } from "@/data/options";

export function deriveTopTagsFromOptionIds(
  optionIds: string[],
  topN: number = 4
): string[] {
  const counts: Record<string, number> = {};

  for (const id of optionIds) {
    const option = OPTIONS.find(o => o.id === id);
    if (!option) continue;

    for (const tag of option.tags) {
      counts[tag] = (counts[tag] ?? 0) + 1;
    }
  }

  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, topN)
    .map(([tag]) => tag);
}