import { useCallback, useEffect, useMemo, useState } from 'react';
import { SubscriptionPlan, UserSubscription } from '../types';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';
const ACCESS_TOKEN_KEY = 'auth_access_token';

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
  const accessToken = useMemo(() => localStorage.getItem(ACCESS_TOKEN_KEY), []);

  useEffect(() => {
    const loadPlans = async () => {
      if (!accessToken) return;
      const data = await fetchJson<SubscriptionPlan[]>('/plans', {
        method: 'GET',
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      setPlans(data);
    };
    loadPlans();
  }, [accessToken]);

  useEffect(() => {
    const loadSubscription = async () => {
      if (!companyId || !accessToken) return;
      const data = await fetchJson<SubscriptionResponse | null>(`/companies/${companyId}/subscription`, {
        method: 'GET',
        headers: { Authorization: `Bearer ${accessToken}` },
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
    };
    loadSubscription();
  }, [companyId, accessToken]);

  const subscribe = useCallback(async (planId: string) => {
    if (!companyId || !accessToken) {
      throw new Error('Missing company or auth token');
    }
    const data = await fetchJson<SubscriptionResponse>(`/companies/${companyId}/subscription`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}` },
      body: JSON.stringify({ planId }),
    });
    setSubscription({
      planId: data.planId,
      status: data.status,
      startDate: data.startsAt,
      endDate: data.endsAt ?? undefined,
    });
  }, [companyId, accessToken]);

  const cancelSubscription = useCallback(async () => {
    if (!companyId || !accessToken) {
      throw new Error('Missing company or auth token');
    }
    const data = await fetchJson<SubscriptionResponse>(`/companies/${companyId}/subscription`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${accessToken}` },
      body: JSON.stringify({ status: 'cancelled' }),
    });
    setSubscription({
      planId: data.planId,
      status: data.status,
      startDate: data.startsAt,
      endDate: data.endsAt ?? undefined,
    });
  }, [companyId, accessToken]);

  const getCurrentPlan = () => {
    if (!subscription) return null;
    return plans.find((p) => p.id === subscription.planId) || null;
  };

  const isSubscribed = () => subscription?.status === 'active';

  return {
    plans,
    subscription,
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
