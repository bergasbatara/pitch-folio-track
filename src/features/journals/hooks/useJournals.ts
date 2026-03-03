import { useCallback, useEffect, useMemo, useState } from 'react';
import { JournalEntry, JournalFormData } from '../types';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';
const ACCESS_TOKEN_KEY = 'auth_access_token';

export function useJournals(companyId?: string) {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const accessToken = useMemo(() => localStorage.getItem(ACCESS_TOKEN_KEY), []);

  useEffect(() => {
    if (!companyId || !accessToken) return;
    setIsLoading(true);
    fetchJson<JournalEntry[]>(`/companies/${companyId}/journals`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${accessToken}` },
    })
      .then(setEntries)
      .finally(() => setIsLoading(false));
  }, [companyId, accessToken]);

  const addEntry = useCallback(async (data: JournalFormData) => {
    if (!companyId || !accessToken) throw new Error('Missing company or auth');
    const created = await fetchJson<JournalEntry>(`/companies/${companyId}/journals`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}` },
      body: JSON.stringify(data),
    });
    setEntries((prev) => [created, ...prev]);
    return created;
  }, [companyId, accessToken]);

  const updateEntry = useCallback(async (id: string, data: JournalFormData) => {
    if (!companyId || !accessToken) throw new Error('Missing company or auth');
    const updated = await fetchJson<JournalEntry>(`/companies/${companyId}/journals/${id}`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${accessToken}` },
      body: JSON.stringify(data),
    });
    setEntries((prev) => prev.map((e) => (e.id === id ? updated : e)));
    return updated;
  }, [companyId, accessToken]);

  const deleteEntry = useCallback(async (id: string) => {
    if (!companyId || !accessToken) throw new Error('Missing company or auth');
    await fetchJson(`/companies/${companyId}/journals/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    setEntries((prev) => prev.filter((e) => e.id !== id));
  }, [companyId, accessToken]);

  return { entries, isLoading, addEntry, updateEntry, deleteEntry };
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
