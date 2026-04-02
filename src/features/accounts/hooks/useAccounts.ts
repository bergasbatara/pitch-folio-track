import { useCallback, useEffect, useState } from 'react';
import { Account, AccountFormData } from '../types';
import { useAsyncStatus } from '@/shared/hooks/useAsyncStatus';
import { withCsrf } from '@/shared/lib/csrf';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

export function useAccounts(companyId?: string) {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const { isLoading, isMutating, error, runLoad, runMutate } = useAsyncStatus();

  useEffect(() => {
    const load = async () => {
      if (!companyId) return;
      await runLoad(async () => {
        const data = await fetchJson<Account[]>(`/companies/${companyId}/accounts`, {
          method: 'GET',
        });
        setAccounts(data);
      });
    };
    load();
  }, [companyId, runLoad]);

  const addAccount = useCallback(async (data: AccountFormData) => {
    if (!companyId) throw new Error('Missing company');
    const tempId = `temp-${crypto.randomUUID?.() ?? Math.random().toString(36).slice(2)}`;
    const optimistic: Account = {
      id: tempId,
      code: data.code,
      name: data.name,
      type: data.type as Account['type'],
      normalBalance: data.normalBalance as Account['normalBalance'],
      isSystem: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const created = await runMutate(async () => {
      return fetchJson<Account>(`/companies/${companyId}/accounts`, {
        method: 'POST',
        body: JSON.stringify(data),
      });
    }, {
      apply: () => setAccounts((prev) => [...prev, optimistic].sort((a, b) => a.code.localeCompare(b.code))),
      rollback: () => setAccounts((prev) => prev.filter((a) => a.id !== tempId)),
    });
    setAccounts((prev) => prev.map((a) => (a.id === tempId ? created : a)).sort((a, b) => a.code.localeCompare(b.code)));
    return created;
  }, [companyId, runMutate]);

  const updateAccount = useCallback(async (id: string, data: Partial<AccountFormData>) => {
    if (!companyId) throw new Error('Missing company');
    const previous = accounts.find((a) => a.id === id);
    const updated = await runMutate(async () => {
      return fetchJson<Account>(`/companies/${companyId}/accounts/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      });
    }, {
      apply: () => setAccounts((prev) => prev.map((a) => (
        a.id === id ? { ...a, ...data } as Account : a
      ))),
      rollback: () => {
        if (!previous) return;
        setAccounts((prev) => prev.map((a) => (a.id === id ? previous : a)));
      },
    });
    setAccounts((prev) => prev.map((a) => (a.id === id ? updated : a)));
    return updated;
  }, [companyId, accounts, runMutate]);

  const deleteAccount = useCallback(async (id: string) => {
    if (!companyId) throw new Error('Missing company');
    const previous = accounts;
    await runMutate(async () => {
      await fetchJson(`/companies/${companyId}/accounts/${id}`, {
        method: 'DELETE',
      });
    }, {
      apply: () => setAccounts((prev) => prev.filter((a) => a.id !== id)),
      rollback: () => setAccounts(previous),
    });
  }, [companyId, accounts, runMutate]);

  return { accounts, isLoading, isMutating, error, addAccount, updateAccount, deleteAccount };
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
