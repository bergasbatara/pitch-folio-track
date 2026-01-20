import { useLocalStorage } from '@/shared/hooks/useLocalStorage';
import { SubscriptionPlan, UserSubscription } from '../types';

const defaultPlans: SubscriptionPlan[] = [
  {
    id: 'business',
    name: 'Business',
    price: 299000,
    currency: 'IDR',
    period: 'monthly',
    features: [
      'Pencatatan Transaksi',
      'Persiapan Penyusunan Laporan Keuangan',
      'Penyusunan Catatan Laporan Keuangan',
      'Neraca, Laba Rugi, Arus Kas',
    ],
  },
  {
    id: 'professional',
    name: 'Professional',
    price: 499000,
    currency: 'IDR',
    period: 'monthly',
    features: [
      'Semua fitur Business',
      'Drafting Laporan Keuangan untuk Audit',
      'Rasio Keuangan',
      'Analisis Tren',
    ],
    recommended: true,
  },
  {
    id: 'premium',
    name: 'Premium',
    price: 799000,
    currency: 'IDR',
    period: 'monthly',
    features: [
      'Semua fitur Professional',
      'Analisis Keuangan Lanjutan',
      'Modeling & Proyeksi Keuangan',
      'Konsultasi Prioritas',
    ],
  },
];

export function useSubscription() {
  const [subscription, setSubscription] = useLocalStorage<UserSubscription | null>(
    'agf-subscription',
    null
  );
  const [plans] = useLocalStorage<SubscriptionPlan[]>('agf-plans', defaultPlans);

  const subscribe = (planId: string) => {
    const startDate = new Date();
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + 1);

    setSubscription({
      planId,
      status: 'active',
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
    });
  };

  const cancelSubscription = () => {
    if (subscription) {
      setSubscription({
        ...subscription,
        status: 'cancelled',
      });
    }
  };

  const getCurrentPlan = () => {
    if (!subscription) return null;
    return plans.find((p) => p.id === subscription.planId) || null;
  };

  const isSubscribed = () => {
    return subscription?.status === 'active';
  };

  return {
    plans,
    subscription,
    subscribe,
    cancelSubscription,
    getCurrentPlan,
    isSubscribed,
  };
}
