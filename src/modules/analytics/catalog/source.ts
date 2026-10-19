export const OPERATIONS = ['soma', 'media', 'quantidade'] as const;

export type Operation = (typeof OPERATIONS)[number];

export type SourceField = {
  name: string;
  column: string;
  description: string;
};

export type SourceCatalog = {
  name: string;
  description: string;
  view: string;
  dateColumn: string;
  dimensions: SourceField[];
  measures: SourceField[];
  operations: Operation[];
};
