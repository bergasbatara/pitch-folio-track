import { TrendingUp, TrendingDown, Minus, MoreVertical, Pencil, Trash2 } from 'lucide-react';
import { Metric, MetricTrend, categoryLabels, categoryColors } from '@/types/metrics';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface MetricCardProps {
  metric: Metric;
  onEdit: (metric: Metric) => void;
  onDelete: (id: string) => void;
  index?: number;
}

function formatValue(value: number, unit: Metric['unit']): string {
  switch (unit) {
    case 'currency':
      if (value >= 1000000) {
        return `$${(value / 1000000).toFixed(1)}M`;
      } else if (value >= 1000) {
        return `$${(value / 1000).toFixed(0)}K`;
      }
      return `$${value.toLocaleString()}`;
    case 'percentage':
      return `${value.toFixed(1)}%`;
    case 'months':
      return `${value} mo`;
    case 'number':
    default:
      if (value >= 1000000) {
        return `${(value / 1000000).toFixed(1)}M`;
      } else if (value >= 1000) {
        return `${(value / 1000).toFixed(0)}K`;
      }
      return value.toLocaleString();
  }
}

function calculateTrend(current: number, previous?: number): { trend: MetricTrend; percentage: number } {
  if (!previous || previous === 0) {
    return { trend: 'neutral', percentage: 0 };
  }
  const change = ((current - previous) / previous) * 100;
  return {
    trend: change > 0 ? 'up' : change < 0 ? 'down' : 'neutral',
    percentage: Math.abs(change),
  };
}

export function MetricCard({ metric, onEdit, onDelete, index = 0 }: MetricCardProps) {
  const { trend, percentage } = calculateTrend(metric.value, metric.previousValue);
  const categoryColor = categoryColors[metric.category];

  return (
    <div
      className="metric-card animate-slide-up"
      style={{ animationDelay: `${index * 50}ms` }}
    >
      <div className="metric-card-glow" />
      
      {/* Header */}
      <div className="mb-4 flex items-start justify-between">
        <div>
          <span
            className="inline-block rounded-md px-2 py-0.5 text-xs font-medium"
            style={{
              backgroundColor: `${categoryColor}20`,
              color: categoryColor,
            }}
          >
            {categoryLabels[metric.category]}
          </span>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground">
              <MoreVertical className="h-4 w-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40">
            <DropdownMenuItem onClick={() => onEdit(metric)}>
              <Pencil className="mr-2 h-4 w-4" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onDelete(metric.id)}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Metric Name */}
      <h3 className="stat-label mb-2">{metric.name}</h3>

      {/* Value */}
      <div className="mb-3">
        <span className="stat-value">{formatValue(metric.value, metric.unit)}</span>
      </div>

      {/* Trend */}
      {metric.previousValue !== undefined && (
        <div className="flex items-center gap-2">
          {trend === 'up' ? (
            <span className="stat-change-positive">
              <TrendingUp className="h-4 w-4" />
              +{percentage.toFixed(1)}%
            </span>
          ) : trend === 'down' ? (
            <span className="stat-change-negative">
              <TrendingDown className="h-4 w-4" />
              -{percentage.toFixed(1)}%
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-sm font-medium text-muted-foreground">
              <Minus className="h-4 w-4" />
              0%
            </span>
          )}
          <span className="text-xs text-muted-foreground">vs last period</span>
        </div>
      )}

      {/* Description */}
      {metric.description && (
        <p className="mt-3 text-xs text-muted-foreground">{metric.description}</p>
      )}
    </div>
  );
}
