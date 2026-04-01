import { useMemo } from 'react';
import { OnboardingState } from '../types';
import { useCompanyProfile } from './useCompanyProfile';

export function useOnboarding() {
  const { company, isProfileComplete, isLoading } = useCompanyProfile();
  const completed = useMemo(() => isProfileComplete(), [isProfileComplete, company?.id, company?.updatedAt]);
  const completedSteps = useMemo(() => (completed ? ['company-setup'] : []), [completed]);
  const currentStep = completed ? 1 : 0;
  const state: OnboardingState = { completed, currentStep, completedSteps };

  const completeStep = (stepId: string) => {
    return stepId;
  };

  const completeOnboarding = () => {
    return true;
  };

  const resetOnboarding = () => {
    return true;
  };

  return {
    ...state,
    completeStep,
    completeOnboarding,
    resetOnboarding,
    isStepCompleted: (stepId: string) => state.completedSteps.includes(stepId),
    isLoading,
  };
}
