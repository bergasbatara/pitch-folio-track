import { useCallback, useEffect, useState } from 'react';
import { Account, AccountFormData } from '../types';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

export function useAccounts(companyId?: string) {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!companyId) return;
    setIsLoading(true);
    fetchJson<Account[]>(`/companies/${companyId}/accounts`, {
      method: 'GET',
    })
      .then(setAccounts)
      .finally(() => setIsLoading(false));
  }, [companyId]);

  const addAccount = useCallback(async (data: AccountFormData) => {
    if (!companyId) throw new Error('Missing company');
    const created = await fetchJson<Account>(`/companies/${companyId}/accounts`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    setAccounts((prev) => [...prev, created].sort((a, b) => a.code.localeCompare(b.code)));
    return created;
  }, [companyId]);

  const updateAccount = useCallback(async (id: string, data: Partial<AccountFormData>) => {
    if (!companyId) throw new Error('Missing company');
    const updated = await fetchJson<Account>(`/companies/${companyId}/accounts/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
    setAccounts((prev) => prev.map((a) => (a.id === id ? updated : a)));
    return updated;
  }, [companyId]);

  const deleteAccount = useCallback(async (id: string) => {
    if (!companyId) throw new Error('Missing company');
    await fetchJson(`/companies/${companyId}/accounts/${id}`, {
      method: 'DELETE',
    });
    setAccounts((prev) => prev.filter((a) => a.id !== id));
  }, [companyId]);

  return { accounts, isLoading, addAccount, updateAccount, deleteAccount };
}

const fetchJson = async <T,>(path: string, options: RequestInit): Promise<T> => {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...(options.headers ?? {}) },
    credentials: 'include',
  });
  if (!response.ok) {
    let message = 'Request failed';
    try { const body = await response.json(); message = body.message ?? message; } catch {}
    throw new Error(message);
  }
  return response.json() as Promise<T>;
};
