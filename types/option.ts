export type Category = {
  id: string;
  name: string;
};

export type Option = {
  id: string;
  label: string;
  tags: string[];
  aka?: string[];
};