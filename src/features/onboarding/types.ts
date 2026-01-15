export interface CompanyProfile {
  id: string;
  name: string;
  address: string;
  phone: string;
  email: string;
  taxId?: string;
  logo?: string;
  currency: string;
  categories: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface OnboardingState {
  completed: boolean;
  currentStep: number;
  completedSteps: string[];
}
