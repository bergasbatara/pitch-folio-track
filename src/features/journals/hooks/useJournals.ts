import { useCallback, useEffect, useState } from 'react';
import { JournalEntry, JournalFormData } from '../types';
import { useAsyncStatus } from '@/shared/hooks/useAsyncStatus';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

export function useJournals(companyId?: string) {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const { isLoading, isMutating, error, runLoad, runMutate } = useAsyncStatus();

  useEffect(() => {
    const load = async () => {
      if (!companyId) return;
      await runLoad(async () => {
        const data = await fetchJson<JournalEntry[]>(`/companies/${companyId}/journals`, {
          method: 'GET',
        });
        setEntries(data);
      });
    };
    load();
  }, [companyId, runLoad]);

  const addEntry = useCallback(async (data: JournalFormData) => {
    if (!companyId) throw new Error('Missing company');
    const created = await runMutate(async () => {
      return fetchJson<JournalEntry>(`/companies/${companyId}/journals`, {
        method: 'POST',
        body: JSON.stringify(data),
      });
    });
    setEntries((prev) => [created, ...prev]);
    return created;
  }, [companyId, runMutate]);

  const updateEntry = useCallback(async (id: string, data: JournalFormData) => {
    if (!companyId) throw new Error('Missing company');
    const previous = entries.find((e) => e.id === id);
    const updated = await runMutate(async () => {
      return fetchJson<JournalEntry>(`/companies/${companyId}/journals/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      });
    }, {
      apply: () => setEntries((prev) => prev.map((e) => (
        e.id === id ? { ...e, ...data } as JournalEntry : e
      ))),
      rollback: () => {
        if (!previous) return;
        setEntries((prev) => prev.map((e) => (e.id === id ? previous : e)));
      },
    });
    setEntries((prev) => prev.map((e) => (e.id === id ? updated : e)));
    return updated;
  }, [companyId, entries, runMutate]);

  const deleteEntry = useCallback(async (id: string) => {
    if (!companyId) throw new Error('Missing company');
    const previous = entries;
    await runMutate(async () => {
      await fetchJson(`/companies/${companyId}/journals/${id}`, {
        method: 'DELETE',
      });
    }, {
      apply: () => setEntries((prev) => prev.filter((e) => e.id !== id)),
      rollback: () => setEntries(previous),
    });
  }, [companyId, entries, runMutate]);

  return { entries, isLoading, isMutating, error, addEntry, updateEntry, deleteEntry };
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
