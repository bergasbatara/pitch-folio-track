import { useCallback, useEffect, useState } from 'react';
import { Purchase, PurchaseCategory, PurchaseFormData } from '../types';
import { useAsyncStatus } from '@/shared/hooks/useAsyncStatus';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

export function usePurchaseCategories(companyId?: string) {
  const [categories, setCategories] = useState<PurchaseCategory[]>([]);
  const { isLoading, isMutating, error, runLoad, runMutate } = useAsyncStatus();

  useEffect(() => {
    const load = async () => {
      if (!companyId) return;
      await runLoad(async () => {
        const data = await fetchJson<PurchaseCategory[]>(`/companies/${companyId}/purchase-categories`, {
          method: 'GET',
        });
        setCategories(data.map(hydrateCategory));
      });
    };
    load();
  }, [companyId, runLoad]);

  const addCategory = useCallback(async (name: string) => {
    if (!companyId) {
      throw new Error('Missing company');
    }
    const tempId = `temp-${crypto.randomUUID?.() ?? Math.random().toString(36).slice(2)}`;
    const optimistic = hydrateCategory({
      id: tempId,
      name,
      createdAt: new Date().toISOString(),
    });
    const created = await runMutate(async () => {
      const result = await fetchJson<PurchaseCategory>(`/companies/${companyId}/purchase-categories`, {
        method: 'POST',
        body: JSON.stringify({ name }),
      });
      return hydrateCategory(result);
    }, {
      apply: () => setCategories((prev) => [...prev, optimistic]),
      rollback: () => setCategories((prev) => prev.filter((cat) => cat.id !== tempId)),
    });
    setCategories((prev) => prev.map((cat) => (cat.id === tempId ? created : cat)));
    return created;
  }, [companyId, runMutate]);

  const updateCategory = useCallback(async (id: string, name: string) => {
    if (!companyId) {
      throw new Error('Missing company');
    }
    const previous = categories.find((category) => category.id === id);
    const updated = await runMutate(async () => {
      const result = await fetchJson<PurchaseCategory>(`/companies/${companyId}/purchase-categories/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ name }),
      });
      return hydrateCategory(result);
    }, {
      apply: () => setCategories((prev) => prev.map((category) => (
        category.id === id ? { ...category, name } : category
      ))),
      rollback: () => {
        if (!previous) return;
        setCategories((prev) => prev.map((category) => (category.id === id ? previous : category)));
      },
    });
    setCategories((prev) => prev.map((category) => (category.id === id ? updated : category)));
  }, [companyId, categories, runMutate]);

  const deleteCategory = useCallback(async (id: string) => {
    if (!companyId) {
      throw new Error('Missing company');
    }
    const previous = categories;
    await runMutate(async () => {
      await fetchJson(`/companies/${companyId}/purchase-categories/${id}`, {
        method: 'DELETE',
      });
    }, {
      apply: () => setCategories((prev) => prev.filter((category) => category.id !== id)),
      rollback: () => setCategories(previous),
    });
  }, [companyId, categories, runMutate]);

  return {
    categories,
    isLoading,
    isMutating,
    error,
    addCategory,
    updateCategory,
    deleteCategory,
  };
}

export function usePurchases(companyId?: string) {
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const { isLoading, isMutating, error, runLoad, runMutate } = useAsyncStatus();

  useEffect(() => {
    const load = async () => {
      if (!companyId) return;
      await runLoad(async () => {
        const data = await fetchJson<Purchase[]>(`/companies/${companyId}/purchases`, {
          method: 'GET',
        });
        setPurchases(data.map(hydratePurchase));
      });
    };
    load();
  }, [companyId, runLoad]);

  const addPurchase = useCallback(async (data: PurchaseFormData) => {
    if (!companyId) {
      throw new Error('Missing company');
    }
    const tempId = `temp-${crypto.randomUUID?.() ?? Math.random().toString(36).slice(2)}`;
    const optimistic = hydratePurchase({
      id: tempId,
      date: data.date,
      categoryId: data.categoryId,
      itemName: data.itemName,
      supplier: data.supplier,
      quantity: data.quantity,
      unitCost: data.unitCost,
      totalCost: data.unitCost * data.quantity,
      notes: data.notes,
      productId: data.productId ?? null,
      productCode: data.productCode ?? null,
      createdAt: new Date().toISOString(),
    });
    const created = await runMutate(async () => {
      const result = await fetchJson<Purchase>(`/companies/${companyId}/purchases`, {
        method: 'POST',
        body: JSON.stringify(data),
      });
      return hydratePurchase(result);
    }, {
      apply: () => setPurchases((prev) => [optimistic, ...prev]),
      rollback: () => setPurchases((prev) => prev.filter((purchase) => purchase.id !== tempId)),
    });
    setPurchases((prev) => prev.map((purchase) => (purchase.id === tempId ? created : purchase)));
    return created;
  }, [companyId, runMutate]);

  const updatePurchase = useCallback(async (id: string, updates: Partial<PurchaseFormData>) => {
    if (!companyId) {
      throw new Error('Missing company');
    }
    const previous = purchases.find((purchase) => purchase.id === id);
    const updated = await runMutate(async () => {
      const result = await fetchJson<Purchase>(`/companies/${companyId}/purchases/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(updates),
      });
      return hydratePurchase(result);
    }, {
      apply: () => {
        setPurchases((prev) => prev.map((purchase) => (
          purchase.id === id ? { ...purchase, ...updates } as Purchase : purchase
        )));
      },
      rollback: () => {
        if (!previous) return;
        setPurchases((prev) => prev.map((purchase) => (purchase.id === id ? previous : purchase)));
      },
    });
    setPurchases((prev) => prev.map((purchase) => (purchase.id === id ? updated : purchase)));
  }, [companyId, purchases, runMutate]);

  const deletePurchase = useCallback(async (id: string) => {
    if (!companyId) {
      throw new Error('Missing company');
    }
    const previous = purchases;
    await runMutate(async () => {
      await fetchJson(`/companies/${companyId}/purchases/${id}`, {
        method: 'DELETE',
      });
    }, {
      apply: () => setPurchases((prev) => prev.filter((purchase) => purchase.id !== id)),
      rollback: () => setPurchases(previous),
    });
  }, [companyId, purchases, runMutate]);

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
    isMutating,
    error,
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
