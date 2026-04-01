import { useCallback, useEffect, useState } from 'react';
import { Customer, CustomerFormData } from '../types';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

export function useCustomers(companyId?: string) {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      if (!companyId) return;
      setIsLoading(true);
      try {
        const data = await fetchJson<Customer[]>(`/companies/${companyId}/customers`, {
          method: 'GET',
        });
        setCustomers(data);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [companyId]);

  const addCustomer = useCallback(async (data: CustomerFormData) => {
    if (!companyId) {
      throw new Error('Missing company');
    }
    const created = await fetchJson<Customer>(`/companies/${companyId}/customers`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    setCustomers((prev) => [created, ...prev]);
    return created;
  }, [companyId]);

  const updateCustomer = useCallback(async (id: string, data: Partial<CustomerFormData>) => {
    if (!companyId) {
      throw new Error('Missing company');
    }
    const updated = await fetchJson<Customer>(`/companies/${companyId}/customers/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
    setCustomers((prev) => prev.map((customer) => (customer.id === id ? updated : customer)));
  }, [companyId]);

  const deleteCustomer = useCallback(async (id: string) => {
    if (!companyId) {
      throw new Error('Missing company');
    }
    await fetchJson(`/companies/${companyId}/customers/${id}`, {
      method: 'DELETE',
    });
    setCustomers((prev) => prev.filter((customer) => customer.id !== id));
  }, [companyId]);

  const getCustomerById = useCallback((id: string) => customers.find((customer) => customer.id === id), [customers]);

  return { customers, isLoading, addCustomer, updateCustomer, deleteCustomer, getCustomerById };
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
