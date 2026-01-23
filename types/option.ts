export type Category = {
  id: string;
  name: string;
};

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