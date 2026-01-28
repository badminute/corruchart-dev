import type { Option as BaseOption } from "@/types/option";

export type CorruchartOption = BaseOption & {
    tags: string[];
    category: number;
};
