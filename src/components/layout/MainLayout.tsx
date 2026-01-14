import { ReactNode } from 'react';
import { Sidebar } from './Sidebar';

interface MainLayoutProps {
  children: ReactNode;
  onAddMetric: () => void;
}

export function MainLayout({ children, onAddMetric }: MainLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <Sidebar onAddMetric={onAddMetric} />
      <main className="pl-64">
        <div className="p-8">{children}</div>
      </main>
    </div>
  );
}
