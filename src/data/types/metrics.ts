export type MetricCategory = 
  | 'revenue'
  | 'expenses'
  | 'growth'
  | 'customers'
  | 'runway'
  | 'other';

export type MetricTrend = 'up' | 'down' | 'neutral';

export interface Metric {
  id: string;
  name: string;
  value: number;
  previousValue?: number;
  unit: 'currency' | 'percentage' | 'number' | 'months';
  category: MetricCategory;
  description?: string;
  updatedAt: Date;
}

export interface MetricFormData {
  name: string;
  value: number;
  previousValue?: number;
  unit: Metric['unit'];
  category: MetricCategory;
  description?: string;
}

export const categoryLabels: Record<MetricCategory, string> = {
  revenue: 'Revenue',
  expenses: 'Expenses',
  growth: 'Growth',
  customers: 'Customers',
  runway: 'Runway',
  other: 'Other',
};

export const categoryColors: Record<MetricCategory, string> = {
  revenue: 'hsl(160 84% 39%)',
  expenses: 'hsl(0 72% 51%)',
  growth: 'hsl(200 80% 50%)',
  customers: 'hsl(270 70% 60%)',
  runway: 'hsl(38 92% 50%)',
  other: 'hsl(215 20% 55%)',
};
