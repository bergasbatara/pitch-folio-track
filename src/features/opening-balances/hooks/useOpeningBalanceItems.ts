import { useCallback, useEffect, useState } from 'react';
import { useAsyncStatus } from '@/shared/hooks/useAsyncStatus';
import { withCsrf } from '@/shared/lib/csrf';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

export type OpeningBalanceKind = 'liability' | 'equity';

export interface OpeningBalanceItem {
  id: string;
  companyId: string;
  kind: OpeningBalanceKind;
  accountId: string;
  asOfDate: string;
  amount: number;
  memo?: string;
  journalEntryId?: string | null;
  createdAt: string;
  updatedAt: string;
  account: { id: string; code: string; name: string; type: string };
}

export interface OpeningBalanceItemFormData {
  kind: OpeningBalanceKind;
  accountId: string;
  asOfDate: string;
  amount: number;
  memo?: string;
}

export function useOpeningBalanceItems(companyId?: string) {
  const [items, setItems] = useState<OpeningBalanceItem[]>([]);
  const { isLoading, isMutating, error, runLoad, runMutate } = useAsyncStatus();

  useEffect(() => {
    const load = async () => {
      if (!companyId) return;
      await runLoad(async () => {
        const data = await fetchJson<OpeningBalanceItem[]>(`/companies/${companyId}/opening-balance-items`, {
          method: 'GET',
        });
        setItems(data);
      });
    };
    load();
  }, [companyId, runLoad]);

  const addItem = useCallback(async (data: OpeningBalanceItemFormData) => {
    if (!companyId) throw new Error('Missing company');
    const created = await runMutate(async () => {
      return fetchJson<OpeningBalanceItem>(`/companies/${companyId}/opening-balance-items`, {
        method: 'POST',
        body: JSON.stringify(data),
      });
    });
    setItems((prev) => [created, ...prev]);
    return created;
  }, [companyId, runMutate]);

  const updateItem = useCallback(async (id: string, data: Partial<OpeningBalanceItemFormData>) => {
    if (!companyId) throw new Error('Missing company');
    const previous = items.find((i) => i.id === id);
    const updated = await runMutate(async () => {
      return fetchJson<OpeningBalanceItem>(`/companies/${companyId}/opening-balance-items/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      });
    }, {
      apply: () => {
        setItems((prev) => prev.map((i) => (i.id === id ? ({ ...i, ...data } as OpeningBalanceItem) : i)));
      },
      rollback: () => {
        if (!previous) return;
        setItems((prev) => prev.map((i) => (i.id === id ? previous : i)));
      },
    });
    setItems((prev) => prev.map((i) => (i.id === id ? updated : i)));
    return updated;
  }, [companyId, items, runMutate]);

  const deleteItem = useCallback(async (id: string) => {
    if (!companyId) throw new Error('Missing company');
    const previous = items;
    await runMutate(async () => {
      await fetchJson(`/companies/${companyId}/opening-balance-items/${id}`, { method: 'DELETE' });
    }, {
      apply: () => setItems((prev) => prev.filter((i) => i.id !== id)),
      rollback: () => setItems(previous),
    });
  }, [companyId, items, runMutate]);

  return { items, isLoading, isMutating, error, addItem, updateItem, deleteItem };
}

const fetchJson = async <T,>(path: string, options: RequestInit): Promise<T> => {
  const response = await fetch(`${API_URL}${path}`, {
    ...withCsrf({
      ...options,
      headers: { 'Content-Type': 'application/json', ...(options.headers ?? {}) },
    }),
    credentials: 'include',
  });
  if (!response.ok) {
    let message = 'Request failed';
    try { const body = await response.json(); message = body.message ?? message; } catch {}
    throw new Error(message);
  }
  return response.json() as Promise<T>;
};

