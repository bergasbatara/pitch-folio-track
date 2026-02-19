import { useCallback, useEffect, useState } from 'react';
import { Supplier, SupplierFormData } from '../types';

const STORAGE_KEY = 'app_suppliers';

export function useSuppliers() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) { try { setSuppliers(JSON.parse(stored)); } catch { /* */ } }
  }, []);

  const persist = useCallback((data: Supplier[]) => {
    setSuppliers(data);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }, []);

  const addSupplier = useCallback((data: SupplierFormData) => {
    const now = new Date().toISOString();
    const s: Supplier = { ...data, id: crypto.randomUUID(), createdAt: now, updatedAt: now };
    persist([s, ...suppliers]);
    return s;
  }, [suppliers, persist]);

  const updateSupplier = useCallback((id: string, data: Partial<SupplierFormData>) => {
    persist(suppliers.map(s => s.id === id ? { ...s, ...data, updatedAt: new Date().toISOString() } : s));
  }, [suppliers, persist]);

  const deleteSupplier = useCallback((id: string) => {
    persist(suppliers.filter(s => s.id !== id));
  }, [suppliers, persist]);

  const getSupplierById = useCallback((id: string) => suppliers.find(s => s.id === id), [suppliers]);

  return { suppliers, addSupplier, updateSupplier, deleteSupplier, getSupplierById };
}
