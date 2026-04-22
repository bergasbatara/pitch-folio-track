import { ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { usePlanAccess } from '../hooks/usePlanAccess';
import { PlanLocked } from './PlanLocked';
import { getRequiredTier } from '../planAccess';

interface PlanGateProps {
  children: ReactNode;
  /** Optional override; defaults to current pathname lookup. */
  pathname?: string;
  featureName?: string;
}

export function PlanGate({ children, pathname, featureName }: PlanGateProps) {
  const location = useLocation();
  const { hasAccess, isLoading } = usePlanAccess();
  const path = pathname ?? location.pathname;
  const required = getRequiredTier(path);

  if (!required) return <>{children}</>;

  if (isLoading) {
    return (
      <MainLayout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      </MainLayout>
    );
  }

  if (!hasAccess(path)) {
    return (
      <MainLayout>
        <PlanLocked requiredTier={required} featureName={featureName} />
      </MainLayout>
    );
  }

  return <>{children}</>;
}
