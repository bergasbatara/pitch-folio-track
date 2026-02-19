import { useCallback, useEffect, useMemo, useState } from 'react';
import { Supplier, SupplierFormData } from '../types';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';
const ACCESS_TOKEN_KEY = 'auth_access_token';

export function useSuppliers(companyId?: string) {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const accessToken = useMemo(() => localStorage.getItem(ACCESS_TOKEN_KEY), []);

  useEffect(() => {
    const load = async () => {
      if (!companyId || !accessToken) return;
      setIsLoading(true);
      try {
        const data = await fetchJson<Supplier[]>(`/companies/${companyId}/suppliers`, {
          method: 'GET',
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        setSuppliers(data);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [companyId, accessToken]);

  const addSupplier = useCallback(async (data: SupplierFormData) => {
    if (!companyId || !accessToken) {
      throw new Error('Missing company or auth token');
    }
    const created = await fetchJson<Supplier>(`/companies/${companyId}/suppliers`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}` },
      body: JSON.stringify(data),
    });
    setSuppliers((prev) => [created, ...prev]);
    return created;
  }, [companyId, accessToken]);

  const updateSupplier = useCallback(async (id: string, data: Partial<SupplierFormData>) => {
    if (!companyId || !accessToken) {
      throw new Error('Missing company or auth token');
    }
    const updated = await fetchJson<Supplier>(`/companies/${companyId}/suppliers/${id}`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${accessToken}` },
      body: JSON.stringify(data),
    });
    setSuppliers((prev) => prev.map((supplier) => (supplier.id === id ? updated : supplier)));
  }, [companyId, accessToken]);

  const deleteSupplier = useCallback(async (id: string) => {
    if (!companyId || !accessToken) {
      throw new Error('Missing company or auth token');
    }
    await fetchJson(`/companies/${companyId}/suppliers/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    setSuppliers((prev) => prev.filter((supplier) => supplier.id !== id));
  }, [companyId, accessToken]);

  const getSupplierById = useCallback((id: string) => suppliers.find((supplier) => supplier.id === id), [suppliers]);

  return { suppliers, isLoading, addSupplier, updateSupplier, deleteSupplier, getSupplierById };
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
