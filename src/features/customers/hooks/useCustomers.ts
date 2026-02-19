import { useCallback, useEffect, useMemo, useState } from 'react';
import { Customer, CustomerFormData } from '../types';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';
const ACCESS_TOKEN_KEY = 'auth_access_token';

export function useCustomers(companyId?: string) {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const accessToken = useMemo(() => localStorage.getItem(ACCESS_TOKEN_KEY), []);

  useEffect(() => {
    const load = async () => {
      if (!companyId || !accessToken) return;
      setIsLoading(true);
      try {
        const data = await fetchJson<Customer[]>(`/companies/${companyId}/customers`, {
          method: 'GET',
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        setCustomers(data);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [companyId, accessToken]);

  const addCustomer = useCallback(async (data: CustomerFormData) => {
    if (!companyId || !accessToken) {
      throw new Error('Missing company or auth token');
    }
    const created = await fetchJson<Customer>(`/companies/${companyId}/customers`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}` },
      body: JSON.stringify(data),
    });
    setCustomers((prev) => [created, ...prev]);
    return created;
  }, [companyId, accessToken]);

  const updateCustomer = useCallback(async (id: string, data: Partial<CustomerFormData>) => {
    if (!companyId || !accessToken) {
      throw new Error('Missing company or auth token');
    }
    const updated = await fetchJson<Customer>(`/companies/${companyId}/customers/${id}`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${accessToken}` },
      body: JSON.stringify(data),
    });
    setCustomers((prev) => prev.map((customer) => (customer.id === id ? updated : customer)));
  }, [companyId, accessToken]);

  const deleteCustomer = useCallback(async (id: string) => {
    if (!companyId || !accessToken) {
      throw new Error('Missing company or auth token');
    }
    await fetchJson(`/companies/${companyId}/customers/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    setCustomers((prev) => prev.filter((customer) => customer.id !== id));
  }, [companyId, accessToken]);

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
