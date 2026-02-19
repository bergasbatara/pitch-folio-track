import { useCallback, useEffect, useMemo, useState } from 'react';
import { TaxCode, TaxCodeFormData } from '../types';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';
const ACCESS_TOKEN_KEY = 'auth_access_token';

export function useTaxCodes(companyId?: string) {
  const [taxCodes, setTaxCodes] = useState<TaxCode[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const accessToken = useMemo(() => localStorage.getItem(ACCESS_TOKEN_KEY), []);

  useEffect(() => {
    const load = async () => {
      if (!companyId || !accessToken) return;
      setIsLoading(true);
      try {
        const data = await fetchJson<TaxCode[]>(`/companies/${companyId}/tax-codes`, {
          method: 'GET',
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        setTaxCodes(data);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [companyId, accessToken]);

  const addTaxCode = useCallback(async (data: TaxCodeFormData) => {
    if (!companyId || !accessToken) {
      throw new Error('Missing company or auth token');
    }
    const created = await fetchJson<TaxCode>(`/companies/${companyId}/tax-codes`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}` },
      body: JSON.stringify(data),
    });
    setTaxCodes((prev) => [created, ...prev]);
    return created;
  }, [companyId, accessToken]);

  const updateTaxCode = useCallback(async (id: string, data: Partial<TaxCodeFormData>) => {
    if (!companyId || !accessToken) {
      throw new Error('Missing company or auth token');
    }
    const updated = await fetchJson<TaxCode>(`/companies/${companyId}/tax-codes/${id}`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${accessToken}` },
      body: JSON.stringify(data),
    });
    setTaxCodes((prev) => prev.map((tax) => (tax.id === id ? updated : tax)));
  }, [companyId, accessToken]);

  const deleteTaxCode = useCallback(async (id: string) => {
    if (!companyId || !accessToken) {
      throw new Error('Missing company or auth token');
    }
    await fetchJson(`/companies/${companyId}/tax-codes/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    setTaxCodes((prev) => prev.filter((tax) => tax.id !== id));
  }, [companyId, accessToken]);

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
