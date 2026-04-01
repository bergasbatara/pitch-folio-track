import { useCallback, useEffect, useState } from 'react';
import { JournalEntry, JournalFormData } from '../types';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

export function useJournals(companyId?: string) {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!companyId) return;
    setIsLoading(true);
    fetchJson<JournalEntry[]>(`/companies/${companyId}/journals`, {
      method: 'GET',
    })
      .then(setEntries)
      .finally(() => setIsLoading(false));
  }, [companyId]);

  const addEntry = useCallback(async (data: JournalFormData) => {
    if (!companyId) throw new Error('Missing company');
    const created = await fetchJson<JournalEntry>(`/companies/${companyId}/journals`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    setEntries((prev) => [created, ...prev]);
    return created;
  }, [companyId]);

  const updateEntry = useCallback(async (id: string, data: JournalFormData) => {
    if (!companyId) throw new Error('Missing company');
    const updated = await fetchJson<JournalEntry>(`/companies/${companyId}/journals/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
    setEntries((prev) => prev.map((e) => (e.id === id ? updated : e)));
    return updated;
  }, [companyId]);

  const deleteEntry = useCallback(async (id: string) => {
    if (!companyId) throw new Error('Missing company');
    await fetchJson(`/companies/${companyId}/journals/${id}`, {
      method: 'DELETE',
    });
    setEntries((prev) => prev.filter((e) => e.id !== id));
  }, [companyId]);

  return { entries, isLoading, addEntry, updateEntry, deleteEntry };
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
