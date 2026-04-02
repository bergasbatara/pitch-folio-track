import { useCallback, useEffect, useState } from 'react';
import { Supplier, SupplierFormData } from '../types';
import { useAsyncStatus } from '@/shared/hooks/useAsyncStatus';
import { withCsrf } from '@/shared/lib/csrf';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

export function useSuppliers(companyId?: string) {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const { isLoading, isMutating, error, runLoad, runMutate } = useAsyncStatus();

  useEffect(() => {
    const load = async () => {
      if (!companyId) return;
      await runLoad(async () => {
        const data = await fetchJson<Supplier[]>(`/companies/${companyId}/suppliers`, {
          method: 'GET',
        });
        setSuppliers(data);
      });
    };
    load();
  }, [companyId, runLoad]);

  const addSupplier = useCallback(async (data: SupplierFormData) => {
    if (!companyId) {
      throw new Error('Missing company');
    }
    const tempId = `temp-${crypto.randomUUID?.() ?? Math.random().toString(36).slice(2)}`;
    const optimistic: Supplier = {
      id: tempId,
      ...data,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const created = await runMutate(async () => {
      return fetchJson<Supplier>(`/companies/${companyId}/suppliers`, {
        method: 'POST',
        body: JSON.stringify(data),
      });
    }, {
      apply: () => setSuppliers((prev) => [optimistic, ...prev]),
      rollback: () => setSuppliers((prev) => prev.filter((s) => s.id !== tempId)),
    });
    setSuppliers((prev) => prev.map((s) => (s.id === tempId ? created : s)));
    return created;
  }, [companyId, runMutate]);

  const updateSupplier = useCallback(async (id: string, data: Partial<SupplierFormData>) => {
    if (!companyId) {
      throw new Error('Missing company');
    }
    const previous = suppliers.find((supplier) => supplier.id === id);
    const updated = await runMutate(async () => {
      return fetchJson<Supplier>(`/companies/${companyId}/suppliers/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      });
    }, {
      apply: () => setSuppliers((prev) => prev.map((supplier) => (
        supplier.id === id ? { ...supplier, ...data } as Supplier : supplier
      ))),
      rollback: () => {
        if (!previous) return;
        setSuppliers((prev) => prev.map((supplier) => (supplier.id === id ? previous : supplier)));
      },
    });
    setSuppliers((prev) => prev.map((supplier) => (supplier.id === id ? updated : supplier)));
  }, [companyId, suppliers, runMutate]);

  const deleteSupplier = useCallback(async (id: string) => {
    if (!companyId) {
      throw new Error('Missing company');
    }
    const previous = suppliers;
    await runMutate(async () => {
      await fetchJson(`/companies/${companyId}/suppliers/${id}`, {
        method: 'DELETE',
      });
    }, {
      apply: () => setSuppliers((prev) => prev.filter((supplier) => supplier.id !== id)),
      rollback: () => setSuppliers(previous),
    });
  }, [companyId, suppliers, runMutate]);

  const getSupplierById = useCallback((id: string) => suppliers.find((supplier) => supplier.id === id), [suppliers]);

  return { suppliers, isLoading, isMutating, error, addSupplier, updateSupplier, deleteSupplier, getSupplierById };
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
