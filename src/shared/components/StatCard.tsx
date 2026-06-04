import { LucideIcon } from 'lucide-react';

type Tone = 'primary' | 'success' | 'destructive' | 'warning' | 'muted';

const toneClasses: Record<Tone, string> = {
  primary: 'bg-primary/10 text-primary',
  success: 'bg-success/10 text-success',
  destructive: 'bg-destructive/10 text-destructive',
  warning: 'bg-warning/10 text-warning',
  muted: 'bg-muted text-muted-foreground',
};

interface StatCardProps {
  label: string;
  value: string | number;
  icon?: LucideIcon;
  tone?: Tone;
  /** Optional helper text shown under the value to explain the metric. */
  hint?: string;
}

export function StatCard({ label, value, icon: Icon, tone = 'primary', hint }: StatCardProps) {
  return (
    <div className="metric-card">
      <div className="metric-card-glow" />
      <div className="flex items-center gap-3">
        {Icon && (
          <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg ${toneClasses[tone]}`}>
            <Icon className="h-5 w-5" />
          </div>
        )}
        <div className="min-w-0">
          <p className="stat-label">{label}</p>
          <p className="stat-value truncate">{value}</p>
          {hint && <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>}
        </div>
      </div>
    </div>
  );
}
