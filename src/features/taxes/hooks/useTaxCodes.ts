import { useCallback, useEffect, useState } from 'react';
import { TaxCode, TaxCodeFormData } from '../types';
import { useAsyncStatus } from '@/shared/hooks/useAsyncStatus';
import { withCsrf } from '@/shared/lib/csrf';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

export function useTaxCodes(companyId?: string) {
  const [taxCodes, setTaxCodes] = useState<TaxCode[]>([]);
  const { isLoading, isMutating, error, runLoad, runMutate } = useAsyncStatus();

  useEffect(() => {
    const load = async () => {
      if (!companyId) return;
      await runLoad(async () => {
        const data = await fetchJson<TaxCode[]>(`/companies/${companyId}/tax-codes`, {
          method: 'GET',
        });
        setTaxCodes(data);
      });
    };
    load();
  }, [companyId, runLoad]);

  const addTaxCode = useCallback(async (data: TaxCodeFormData) => {
    if (!companyId) {
      throw new Error('Missing company');
    }
    const tempId = `temp-${crypto.randomUUID?.() ?? Math.random().toString(36).slice(2)}`;
    const optimistic: TaxCode = {
      id: tempId,
      ...data,
      createdAt: new Date().toISOString(),
    };
    const created = await runMutate(async () => {
      return fetchJson<TaxCode>(`/companies/${companyId}/tax-codes`, {
        method: 'POST',
        body: JSON.stringify(data),
      });
    }, {
      apply: () => setTaxCodes((prev) => [optimistic, ...prev]),
      rollback: () => setTaxCodes((prev) => prev.filter((t) => t.id !== tempId)),
    });
    setTaxCodes((prev) => prev.map((t) => (t.id === tempId ? created : t)));
    return created;
  }, [companyId, runMutate]);

  const updateTaxCode = useCallback(async (id: string, data: Partial<TaxCodeFormData>) => {
    if (!companyId) {
      throw new Error('Missing company');
    }
    const previous = taxCodes.find((tax) => tax.id === id);
    const updated = await runMutate(async () => {
      return fetchJson<TaxCode>(`/companies/${companyId}/tax-codes/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      });
    }, {
      apply: () => setTaxCodes((prev) => prev.map((tax) => (
        tax.id === id ? { ...tax, ...data } as TaxCode : tax
      ))),
      rollback: () => {
        if (!previous) return;
        setTaxCodes((prev) => prev.map((tax) => (tax.id === id ? previous : tax)));
      },
    });
    setTaxCodes((prev) => prev.map((tax) => (tax.id === id ? updated : tax)));
  }, [companyId, taxCodes, runMutate]);

  const deleteTaxCode = useCallback(async (id: string) => {
    if (!companyId) {
      throw new Error('Missing company');
    }
    const previous = taxCodes;
    await runMutate(async () => {
      await fetchJson(`/companies/${companyId}/tax-codes/${id}`, {
        method: 'DELETE',
      });
    }, {
      apply: () => setTaxCodes((prev) => prev.filter((tax) => tax.id !== id)),
      rollback: () => setTaxCodes(previous),
    });
  }, [companyId, taxCodes, runMutate]);

  return { taxCodes, isLoading, isMutating, error, addTaxCode, updateTaxCode, deleteTaxCode };
}

const fetchJson = async <T,>(path: string, options: RequestInit): Promise<T> => {
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers ?? {}),
  };
  const response = await fetch(`${API_URL}${path}`, {
    ...withCsrf({ ...options, headers }),
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
