export interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  currency: string;
  period: 'monthly' | 'yearly';
  features: string[];
  recommended?: boolean;
}

export interface UserSubscription {
  planId: string;
  status: 'active' | 'cancelled' | 'expired';
  startDate: string;
  endDate: string;
  paymentMethod?: string;
}
