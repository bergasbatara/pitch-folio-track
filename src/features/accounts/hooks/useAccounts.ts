import { useCallback, useEffect, useMemo, useState } from 'react';
import { Account, AccountFormData } from '../types';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';
const ACCESS_TOKEN_KEY = 'auth_access_token';

export function useAccounts(companyId?: string) {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const accessToken = useMemo(() => localStorage.getItem(ACCESS_TOKEN_KEY), []);

  useEffect(() => {
    if (!companyId || !accessToken) return;
    setIsLoading(true);
    fetchJson<Account[]>(`/companies/${companyId}/accounts`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${accessToken}` },
    })
      .then(setAccounts)
      .finally(() => setIsLoading(false));
  }, [companyId, accessToken]);

  const addAccount = useCallback(async (data: AccountFormData) => {
    if (!companyId || !accessToken) throw new Error('Missing company or auth');
    const created = await fetchJson<Account>(`/companies/${companyId}/accounts`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}` },
      body: JSON.stringify(data),
    });
    setAccounts((prev) => [...prev, created].sort((a, b) => a.code.localeCompare(b.code)));
    return created;
  }, [companyId, accessToken]);

  const updateAccount = useCallback(async (id: string, data: Partial<AccountFormData>) => {
    if (!companyId || !accessToken) throw new Error('Missing company or auth');
    const updated = await fetchJson<Account>(`/companies/${companyId}/accounts/${id}`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${accessToken}` },
      body: JSON.stringify(data),
    });
    setAccounts((prev) => prev.map((a) => (a.id === id ? updated : a)));
    return updated;
  }, [companyId, accessToken]);

  const deleteAccount = useCallback(async (id: string) => {
    if (!companyId || !accessToken) throw new Error('Missing company or auth');
    await fetchJson(`/companies/${companyId}/accounts/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    setAccounts((prev) => prev.filter((a) => a.id !== id));
  }, [companyId, accessToken]);

  return { accounts, isLoading, addAccount, updateAccount, deleteAccount };
}

const fetchJson = async <T,>(path: string, options: RequestInit): Promise<T> => {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...(options.headers ?? {}) },
  });
  if (!response.ok) {
    let message = 'Request failed';
    try { const body = await response.json(); message = body.message ?? message; } catch {}
    throw new Error(message);
  }
  return response.json() as Promise<T>;
};
