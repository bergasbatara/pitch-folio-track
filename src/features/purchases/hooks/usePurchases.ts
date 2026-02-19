import { useCallback, useEffect, useMemo, useState } from 'react';
import { Purchase, PurchaseCategory, PurchaseFormData } from '../types';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';
const ACCESS_TOKEN_KEY = 'auth_access_token';

export function usePurchaseCategories(companyId?: string) {
  const [categories, setCategories] = useState<PurchaseCategory[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const accessToken = useMemo(() => localStorage.getItem(ACCESS_TOKEN_KEY), []);

  useEffect(() => {
    const load = async () => {
      if (!companyId || !accessToken) return;
      setIsLoading(true);
      try {
        const data = await fetchJson<PurchaseCategory[]>(`/companies/${companyId}/purchase-categories`, {
          method: 'GET',
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        setCategories(data.map(hydrateCategory));
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [companyId, accessToken]);

  const addCategory = useCallback(async (name: string) => {
    if (!companyId || !accessToken) {
      throw new Error('Missing company or auth token');
    }
    const created = await fetchJson<PurchaseCategory>(`/companies/${companyId}/purchase-categories`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}` },
      body: JSON.stringify({ name }),
    });
    const hydrated = hydrateCategory(created);
    setCategories((prev) => [...prev, hydrated]);
    return hydrated;
  }, [companyId, accessToken]);

  const updateCategory = useCallback(async (id: string, name: string) => {
    if (!companyId || !accessToken) {
      throw new Error('Missing company or auth token');
    }
    const updated = await fetchJson<PurchaseCategory>(`/companies/${companyId}/purchase-categories/${id}`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${accessToken}` },
      body: JSON.stringify({ name }),
    });
    const hydrated = hydrateCategory(updated);
    setCategories((prev) => prev.map((category) => (category.id === id ? hydrated : category)));
  }, [companyId, accessToken]);

  const deleteCategory = useCallback(async (id: string) => {
    if (!companyId || !accessToken) {
      throw new Error('Missing company or auth token');
    }
    await fetchJson(`/companies/${companyId}/purchase-categories/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    setCategories((prev) => prev.filter((category) => category.id !== id));
  }, [companyId, accessToken]);

  return {
    categories,
    isLoading,
    addCategory,
    updateCategory,
    deleteCategory,
  };
}

export function usePurchases(companyId?: string) {
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const accessToken = useMemo(() => localStorage.getItem(ACCESS_TOKEN_KEY), []);

  useEffect(() => {
    const load = async () => {
      if (!companyId || !accessToken) return;
      setIsLoading(true);
      try {
        const data = await fetchJson<Purchase[]>(`/companies/${companyId}/purchases`, {
          method: 'GET',
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        setPurchases(data.map(hydratePurchase));
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [companyId, accessToken]);

  const addPurchase = useCallback(async (data: PurchaseFormData) => {
    if (!companyId || !accessToken) {
      throw new Error('Missing company or auth token');
    }
    const created = await fetchJson<Purchase>(`/companies/${companyId}/purchases`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}` },
      body: JSON.stringify(data),
    });
    const hydrated = hydratePurchase(created);
    setPurchases((prev) => [hydrated, ...prev]);
    return hydrated;
  }, [companyId, accessToken]);

  const updatePurchase = useCallback(async (id: string, updates: Partial<PurchaseFormData>) => {
    if (!companyId || !accessToken) {
      throw new Error('Missing company or auth token');
    }
    const updated = await fetchJson<Purchase>(`/companies/${companyId}/purchases/${id}`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${accessToken}` },
      body: JSON.stringify(updates),
    });
    const hydrated = hydratePurchase(updated);
    setPurchases((prev) => prev.map((purchase) => (purchase.id === id ? hydrated : purchase)));
  }, [companyId, accessToken]);

  const deletePurchase = useCallback(async (id: string) => {
    if (!companyId || !accessToken) {
      throw new Error('Missing company or auth token');
    }
    await fetchJson(`/companies/${companyId}/purchases/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    setPurchases((prev) => prev.filter((purchase) => purchase.id !== id));
  }, [companyId, accessToken]);

  const getTotalSpend = useCallback(() => {
    return purchases.reduce((sum, purchase) => sum + purchase.totalCost, 0);
  }, [purchases]);

  const getSpendByCategory = useCallback((categoryId: string) => {
    return purchases
      .filter((purchase) => purchase.categoryId === categoryId)
      .reduce((sum, purchase) => sum + purchase.totalCost, 0);
  }, [purchases]);

  return {
    purchases,
    isLoading,
    addPurchase,
    updatePurchase,
    deletePurchase,
    getTotalSpend,
    getSpendByCategory,
  };
}

const normalizeDate = (value?: string) => {
  if (!value) {
    return new Date().toISOString().split('T')[0];
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return new Date().toISOString().split('T')[0];
  }
  return parsed.toISOString().split('T')[0];
};

const hydratePurchase = (purchase: Purchase): Purchase => ({
  ...purchase,
  date: normalizeDate(purchase.date),
  createdAt: purchase.createdAt,
});

const hydrateCategory = (category: PurchaseCategory): PurchaseCategory => ({
  ...category,
  createdAt: category.createdAt,
});

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
