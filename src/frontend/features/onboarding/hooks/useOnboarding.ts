import { useLocalStorage } from '@/shared/hooks/useLocalStorage';
import { OnboardingState } from '../types';

const DEFAULT_STATE: OnboardingState = {
  completed: false,
  currentStep: 0,
  completedSteps: [],
};

export function useOnboarding() {
  const [state, setState] = useLocalStorage<OnboardingState>('onboarding-state', DEFAULT_STATE);

  const completeStep = (stepId: string) => {
    setState({
      ...state,
      completedSteps: [...new Set([...state.completedSteps, stepId])],
      currentStep: state.currentStep + 1,
    });
  };

  const completeOnboarding = () => {
    setState({
      ...state,
      completed: true,
    });
  };

  const resetOnboarding = () => {
    setState(DEFAULT_STATE);
  };

  return {
    ...state,
    completeStep,
    completeOnboarding,
    resetOnboarding,
    isStepCompleted: (stepId: string) => state.completedSteps.includes(stepId),
  };
}
