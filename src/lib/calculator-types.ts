export type Dimension = 'length' | 'area' | 'volume' | 'weight' | 'number';
export interface Field {
  id: string;
  label: string;
  value?: number;
  unit?: string;
  units?: string[];
  dimension?: Dimension;
  min?: number;
  max?: number;
  integer?: boolean;
  optional?: boolean;
  help?: string;
  group?: 'Measurements' | 'Material & assumptions' | 'Cost';
}
export interface ResultRow { key: string; label: string; value: number; unit: string; discrete?: boolean; }
export interface Calculation { rows: ResultRow[]; notes: string[]; steps: string[]; }
export interface Model {
  fields: Field[];
  formula: string;
  assumptions: string[];
  sources: string[];
  calculate: (v: Record<string, number>, units: Record<string,string>) => Calculation;
}
export interface CalculatorSpec {
  slug: string;
  model: string;
  title: string;
  h1: string;
  description: string;
  purpose: string;
  note: string;
  primaryKeyword: string;
  secondaryKeywords: string[];
  cluster: string;
  category: string;
  categorySlug: string;
  fields: Field[];
  related: string[];
  priority: 'high' | 'standard';
  primary?: string;
}
