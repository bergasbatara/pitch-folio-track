import { useCallback, useEffect, useState } from 'react';
import { TaxCode, TaxCodeFormData, DEFAULT_TAX_CODES } from '../types';

const STORAGE_KEY = 'app_tax_codes';

export function useTaxCodes() {
  const [taxCodes, setTaxCodes] = useState<TaxCode[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try { setTaxCodes(JSON.parse(stored)); return; } catch { /* */ }
    }
    // Seed defaults
    const seeded = DEFAULT_TAX_CODES.map(t => ({
      ...t, id: crypto.randomUUID(), createdAt: new Date().toISOString(),
    }));
    setTaxCodes(seeded);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(seeded));
  }, []);

  const persist = useCallback((data: TaxCode[]) => {
    setTaxCodes(data);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }, []);

  const addTaxCode = useCallback((data: TaxCodeFormData) => {
    const t: TaxCode = { ...data, id: crypto.randomUUID(), createdAt: new Date().toISOString() };
    persist([t, ...taxCodes]);
    return t;
  }, [taxCodes, persist]);

  const updateTaxCode = useCallback((id: string, data: Partial<TaxCodeFormData>) => {
    persist(taxCodes.map(t => t.id === id ? { ...t, ...data } : t));
  }, [taxCodes, persist]);

  const deleteTaxCode = useCallback((id: string) => {
    persist(taxCodes.filter(t => t.id !== id));
  }, [taxCodes, persist]);

  return { taxCodes, addTaxCode, updateTaxCode, deleteTaxCode };
}
