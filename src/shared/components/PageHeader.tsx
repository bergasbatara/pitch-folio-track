import { ReactNode } from 'react';
import { LucideIcon, Info } from 'lucide-react';

interface PageHeaderProps {
  title: string;
  description?: string;
  icon?: LucideIcon;
  /** Short, plain-language tip shown in a soft info banner under the header. */
  tip?: string;
  /** Action area, typically the primary "Tambah" button. */
  action?: ReactNode;
}

export function PageHeader({ title, description, icon: Icon, tip, action }: PageHeaderProps) {
  return (
    <div className="mb-6 animate-fade-in">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          {Icon && (
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Icon className="h-6 w-6" />
            </div>
          )}
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">{title}</h1>
            {description && <p className="mt-0.5 text-muted-foreground">{description}</p>}
          </div>
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>

      {tip && (
        <div className="mt-4 flex items-start gap-2.5 rounded-lg border border-accent bg-accent/40 px-4 py-3 text-sm text-accent-foreground">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
          <p className="leading-relaxed">{tip}</p>
        </div>
      )}
    </div>
  );
}
