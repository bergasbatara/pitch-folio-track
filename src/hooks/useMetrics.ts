import { useState, useCallback } from 'react';
import { Metric, MetricFormData } from '@/types/metrics';

const defaultMetrics: Metric[] = [
  {
    id: '1',
    name: 'Monthly Recurring Revenue',
    value: 125000,
    previousValue: 98000,
    unit: 'currency',
    category: 'revenue',
    description: 'Total MRR from all active subscriptions',
    updatedAt: new Date(),
  },
  {
    id: '2',
    name: 'Annual Recurring Revenue',
    value: 1500000,
    previousValue: 1200000,
    unit: 'currency',
    category: 'revenue',
    updatedAt: new Date(),
  },
  {
    id: '3',
    name: 'Monthly Burn Rate',
    value: 85000,
    previousValue: 92000,
    unit: 'currency',
    category: 'expenses',
    description: 'Total monthly operating expenses',
    updatedAt: new Date(),
  },
  {
    id: '4',
    name: 'Runway',
    value: 18,
    previousValue: 14,
    unit: 'months',
    category: 'runway',
    description: 'Months of runway at current burn rate',
    updatedAt: new Date(),
  },
  {
    id: '5',
    name: 'Total Customers',
    value: 248,
    previousValue: 185,
    unit: 'number',
    category: 'customers',
    updatedAt: new Date(),
  },
  {
    id: '6',
    name: 'Customer Growth Rate',
    value: 34,
    previousValue: 28,
    unit: 'percentage',
    category: 'growth',
    description: 'Month-over-month customer growth',
    updatedAt: new Date(),
  },
  {
    id: '7',
    name: 'Net Revenue Retention',
    value: 115,
    previousValue: 108,
    unit: 'percentage',
    category: 'growth',
    updatedAt: new Date(),
  },
  {
    id: '8',
    name: 'Customer Acquisition Cost',
    value: 450,
    previousValue: 520,
    unit: 'currency',
    category: 'customers',
    description: 'Average cost to acquire a new customer',
    updatedAt: new Date(),
  },
];

export function useMetrics() {
  const [metrics, setMetrics] = useState<Metric[]>(defaultMetrics);

  const addMetric = useCallback((data: MetricFormData) => {
    const newMetric: Metric = {
      id: crypto.randomUUID(),
      ...data,
      updatedAt: new Date(),
    };
    setMetrics((prev) => [...prev, newMetric]);
  }, []);

  const updateMetric = useCallback((id: string, data: MetricFormData) => {
    setMetrics((prev) =>
      prev.map((metric) =>
        metric.id === id
          ? { ...metric, ...data, updatedAt: new Date() }
          : metric
      )
    );
  }, []);

  const deleteMetric = useCallback((id: string) => {
    setMetrics((prev) => prev.filter((metric) => metric.id !== id));
  }, []);

  const getMetricsByCategory = useCallback(
    (category: Metric['category']) => {
      return metrics.filter((metric) => metric.category === category);
    },
    [metrics]
  );

  return {
    metrics,
    addMetric,
    updateMetric,
    deleteMetric,
    getMetricsByCategory,
  };
}
