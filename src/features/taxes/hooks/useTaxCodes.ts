import { useCallback, useEffect, useState } from 'react';
import { TaxCode, TaxCodeFormData } from '../types';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

export function useTaxCodes(companyId?: string) {
  const [taxCodes, setTaxCodes] = useState<TaxCode[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      if (!companyId) return;
      setIsLoading(true);
      try {
        const data = await fetchJson<TaxCode[]>(`/companies/${companyId}/tax-codes`, {
          method: 'GET',
        });
        setTaxCodes(data);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [companyId]);

  const addTaxCode = useCallback(async (data: TaxCodeFormData) => {
    if (!companyId) {
      throw new Error('Missing company');
    }
    const created = await fetchJson<TaxCode>(`/companies/${companyId}/tax-codes`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    setTaxCodes((prev) => [created, ...prev]);
    return created;
  }, [companyId]);

  const updateTaxCode = useCallback(async (id: string, data: Partial<TaxCodeFormData>) => {
    if (!companyId) {
      throw new Error('Missing company');
    }
    const updated = await fetchJson<TaxCode>(`/companies/${companyId}/tax-codes/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
    setTaxCodes((prev) => prev.map((tax) => (tax.id === id ? updated : tax)));
  }, [companyId]);

  const deleteTaxCode = useCallback(async (id: string) => {
    if (!companyId) {
      throw new Error('Missing company');
    }
    await fetchJson(`/companies/${companyId}/tax-codes/${id}`, {
      method: 'DELETE',
    });
    setTaxCodes((prev) => prev.filter((tax) => tax.id !== id));
  }, [companyId]);

  return { taxCodes, isLoading, addTaxCode, updateTaxCode, deleteTaxCode };
}

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
