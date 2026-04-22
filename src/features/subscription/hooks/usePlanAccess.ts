import { useCompanyProfile } from '@/features/onboarding';
import { useSubscription } from './useSubscription';
import { PlanTier, planSatisfies, getRequiredTier } from '../planAccess';

export function usePlanAccess() {
  const { company } = useCompanyProfile();
  const { subscription, isSubscribed, isLoading } = useSubscription(company?.id);

  const currentTier: PlanTier | null =
    isSubscribed() && subscription?.planId
      ? (subscription.planId as PlanTier)
      : null;

  const hasAccess = (pathname: string): boolean => {
    const required = getRequiredTier(pathname);
    if (!required) return true;
    return planSatisfies(currentTier, required);
  };

  const requiredTierFor = (pathname: string) => getRequiredTier(pathname);

  return { currentTier, hasAccess, requiredTierFor, isLoading };
}
