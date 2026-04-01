import { useCallback, useEffect, useState } from 'react';
import { SubscriptionPlan, UserSubscription } from '../types';
import { useAsyncStatus } from '@/shared/hooks/useAsyncStatus';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

interface SubscriptionResponse {
  id: string;
  companyId: string;
  planId: string;
  status: 'active' | 'cancelled' | 'expired';
  startsAt: string;
  endsAt?: string | null;
  plan?: SubscriptionPlan;
}

export function useSubscription(companyId?: string) {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [subscription, setSubscription] = useState<UserSubscription | null>(null);
  const { isLoading, isMutating, error, runLoad, runMutate } = useAsyncStatus();

  useEffect(() => {
    const loadPlans = async () => {
      await runLoad(async () => {
        const data = await fetchJson<SubscriptionPlan[]>('/plans', {
          method: 'GET',
        });
        setPlans(data);
      });
    };
    loadPlans();
  }, [runLoad]);

  useEffect(() => {
    const loadSubscription = async () => {
      if (!companyId) return;
      await runLoad(async () => {
        const data = await fetchJson<SubscriptionResponse | null>(`/companies/${companyId}/subscription`, {
          method: 'GET',
        });
        if (!data) {
          setSubscription(null);
          return;
        }
        setSubscription({
          planId: data.planId,
          status: data.status,
          startDate: data.startsAt,
          endDate: data.endsAt ?? undefined,
        });
      });
    };
    loadSubscription();
  }, [companyId, runLoad]);

  const subscribe = useCallback(async (planId: string) => {
    if (!companyId) {
      throw new Error('Missing company');
    }
    const data = await runMutate(async () => {
      return fetchJson<SubscriptionResponse>(`/companies/${companyId}/subscription`, {
        method: 'POST',
        body: JSON.stringify({ planId }),
      });
    });
    setSubscription({
      planId: data.planId,
      status: data.status,
      startDate: data.startsAt,
      endDate: data.endsAt ?? undefined,
    });
  }, [companyId, runMutate]);

  const cancelSubscription = useCallback(async () => {
    if (!companyId) {
      throw new Error('Missing company');
    }
    const data = await runMutate(async () => {
      return fetchJson<SubscriptionResponse>(`/companies/${companyId}/subscription`, {
        method: 'PATCH',
        body: JSON.stringify({ status: 'cancelled' }),
      });
    });
    setSubscription({
      planId: data.planId,
      status: data.status,
      startDate: data.startsAt,
      endDate: data.endsAt ?? undefined,
    });
  }, [companyId, runMutate]);

  const getCurrentPlan = () => {
    if (!subscription) return null;
    return plans.find((p) => p.id === subscription.planId) || null;
  };

  const isSubscribed = () => subscription?.status === 'active';

  return {
    plans,
    subscription,
    isLoading,
    isMutating,
    error,
    subscribe,
    cancelSubscription,
    getCurrentPlan,
    isSubscribed,
  };
}

const fetchJson = async <T,>(path: string, options: RequestInit): Promise<T> => {
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers ?? {}),
  };
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
    credentials: 'include',
  });
  if (!response.ok) {
    let message = 'Request failed';
    try {
      const body = await response.json();
      message = body.message ?? message;
    } catch {
      // ignore parsing errors
    }
    throw new Error(message);
  }
  return response.json() as Promise<T>;
};
