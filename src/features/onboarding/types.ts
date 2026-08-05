export interface CompanyProfile {
  id: string;
  name: string;
  address: string;
  phone: string;
  email: string;
  taxId?: string;
  logo?: string;
  currency: string;
  closedThrough?: Date | null;
  categories: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface OnboardingState {
  completed: boolean;
  currentStep: number;
  completedSteps: string[];
}
