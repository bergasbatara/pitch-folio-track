import { useCallback, useEffect, useMemo, useState } from 'react';
import { Customer, CustomerFormData } from '../types';

const STORAGE_KEY = 'app_customers';

function generateId() {
  return crypto.randomUUID();
}

export function useCustomers() {
  const [customers, setCustomers] = useState<Customer[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try { setCustomers(JSON.parse(stored)); } catch { /* ignore */ }
    }
  }, []);

  const persist = useCallback((data: Customer[]) => {
    setCustomers(data);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }, []);

  const addCustomer = useCallback((data: CustomerFormData) => {
    const now = new Date().toISOString();
    const newCustomer: Customer = { ...data, id: generateId(), createdAt: now, updatedAt: now };
    persist([newCustomer, ...customers]);
    return newCustomer;
  }, [customers, persist]);

  const updateCustomer = useCallback((id: string, data: Partial<CustomerFormData>) => {
    const updated = customers.map(c =>
      c.id === id ? { ...c, ...data, updatedAt: new Date().toISOString() } : c
    );
    persist(updated);
  }, [customers, persist]);

  const deleteCustomer = useCallback((id: string) => {
    persist(customers.filter(c => c.id !== id));
  }, [customers, persist]);

  const getCustomerById = useCallback((id: string) => customers.find(c => c.id === id), [customers]);

  return { customers, addCustomer, updateCustomer, deleteCustomer, getCustomerById };
}
