import { useCallback, useEffect, useState } from 'react';
import { Customer, CustomerFormData } from '../types';
import { useAsyncStatus } from '@/shared/hooks/useAsyncStatus';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

export function useCustomers(companyId?: string) {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const { isLoading, isMutating, error, runLoad, runMutate } = useAsyncStatus();

  useEffect(() => {
    const load = async () => {
      if (!companyId) return;
      await runLoad(async () => {
        const data = await fetchJson<Customer[]>(`/companies/${companyId}/customers`, {
          method: 'GET',
        });
        setCustomers(data);
      });
    };
    load();
  }, [companyId, runLoad]);

  const addCustomer = useCallback(async (data: CustomerFormData) => {
    if (!companyId) {
      throw new Error('Missing company');
    }
    const tempId = `temp-${crypto.randomUUID?.() ?? Math.random().toString(36).slice(2)}`;
    const optimistic: Customer = {
      id: tempId,
      ...data,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const created = await runMutate(async () => {
      return fetchJson<Customer>(`/companies/${companyId}/customers`, {
        method: 'POST',
        body: JSON.stringify(data),
      });
    }, {
      apply: () => setCustomers((prev) => [optimistic, ...prev]),
      rollback: () => setCustomers((prev) => prev.filter((c) => c.id !== tempId)),
    });
    setCustomers((prev) => prev.map((c) => (c.id === tempId ? created : c)));
    return created;
  }, [companyId, runMutate]);

  const updateCustomer = useCallback(async (id: string, data: Partial<CustomerFormData>) => {
    if (!companyId) {
      throw new Error('Missing company');
    }
    const previous = customers.find((customer) => customer.id === id);
    const updated = await runMutate(async () => {
      return fetchJson<Customer>(`/companies/${companyId}/customers/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      });
    }, {
      apply: () => setCustomers((prev) => prev.map((customer) => (
        customer.id === id ? { ...customer, ...data } as Customer : customer
      ))),
      rollback: () => {
        if (!previous) return;
        setCustomers((prev) => prev.map((customer) => (customer.id === id ? previous : customer)));
      },
    });
    setCustomers((prev) => prev.map((customer) => (customer.id === id ? updated : customer)));
  }, [companyId, customers, runMutate]);

  const deleteCustomer = useCallback(async (id: string) => {
    if (!companyId) {
      throw new Error('Missing company');
    }
    const previous = customers;
    await runMutate(async () => {
      await fetchJson(`/companies/${companyId}/customers/${id}`, {
        method: 'DELETE',
      });
    }, {
      apply: () => setCustomers((prev) => prev.filter((customer) => customer.id !== id)),
      rollback: () => setCustomers(previous),
    });
  }, [companyId, customers, runMutate]);

  const getCustomerById = useCallback((id: string) => customers.find((customer) => customer.id === id), [customers]);

  return { customers, isLoading, isMutating, error, addCustomer, updateCustomer, deleteCustomer, getCustomerById };
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
