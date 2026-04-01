import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useOnboarding } from '@/features/onboarding';

interface OnboardingRouteProps {
  children: React.ReactNode;
}

export function OnboardingRoute({ children }: OnboardingRouteProps) {
  const { user, isLoading } = useAuth();
  const { completed, isLoading: isOnboardingLoading } = useOnboarding();

  if (isLoading || isOnboardingLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // If onboarding is already complete, redirect to dashboard
  if (completed) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
