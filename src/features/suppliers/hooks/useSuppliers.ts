import { useCallback, useEffect, useState } from 'react';
import { Supplier, SupplierFormData } from '../types';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

export function useSuppliers(companyId?: string) {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      if (!companyId) return;
      setIsLoading(true);
      try {
        const data = await fetchJson<Supplier[]>(`/companies/${companyId}/suppliers`, {
          method: 'GET',
        });
        setSuppliers(data);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [companyId]);

  const addSupplier = useCallback(async (data: SupplierFormData) => {
    if (!companyId) {
      throw new Error('Missing company');
    }
    const created = await fetchJson<Supplier>(`/companies/${companyId}/suppliers`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    setSuppliers((prev) => [created, ...prev]);
    return created;
  }, [companyId]);

  const updateSupplier = useCallback(async (id: string, data: Partial<SupplierFormData>) => {
    if (!companyId) {
      throw new Error('Missing company');
    }
    const updated = await fetchJson<Supplier>(`/companies/${companyId}/suppliers/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
    setSuppliers((prev) => prev.map((supplier) => (supplier.id === id ? updated : supplier)));
  }, [companyId]);

  const deleteSupplier = useCallback(async (id: string) => {
    if (!companyId) {
      throw new Error('Missing company');
    }
    await fetchJson(`/companies/${companyId}/suppliers/${id}`, {
      method: 'DELETE',
    });
    setSuppliers((prev) => prev.filter((supplier) => supplier.id !== id));
  }, [companyId]);

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
