export type Category = {
  id: string;
  name: string;
};

export type Option = {
  id: string;
  label: string;
  categories: string[]; // category ids
};
