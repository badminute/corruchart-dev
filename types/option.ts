// ===== Option category (USED BY OPTIONS) =====
export type Category = {
  id: string;
  name: string;
};

// ===== Group scope for chart filters =====
export type GroupScope = "broad" | "narrow";

// ===== Group definition (USED BY groups.ts) =====
export type Group = {
  id: string;
  name: string;
  scope: GroupScope;
};

// ===== Option type =====
export type Option = {
  id: string;
  label: string;
  tags: string[];
  aka?: string[];

  /** Variant slot grouping (shared UI slot) */
  variantGroup?: string;

  /** Order inside the variant group */
  variantOrder?: number;
};
