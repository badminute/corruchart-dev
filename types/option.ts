export type Category = {
  id: string;
  name: string;
};

export type Option = {
  id: string;
  label: string;
  category: number;
  tags: string[];
  aka?: string[];
};