import { useCallback, useEffect, useMemo, useState } from 'react';
import { Sale, SaleFormData } from '../types';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

export function useSales(companyId?: string) {
  const [sales, setSales] = useState<Sale[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      if (!companyId) return;
      setIsLoading(true);
      try {
        const data = await fetchJson<Sale[]>(`/companies/${companyId}/sales`, {
          method: 'GET',
        });
        setSales(data.map(hydrateSale));
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [companyId]);

  const addSale = useCallback(async (data: SaleFormData) => {
    if (!companyId) {
      throw new Error('Missing company');
    }
    const created = await fetchJson<Sale>(`/companies/${companyId}/sales`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    const hydrated = hydrateSale(created);
    setSales((prev) => [hydrated, ...prev]);
    return hydrated;
  }, [companyId]);

  const deleteSale = useCallback(async (id: string) => {
    if (!companyId) {
      throw new Error('Missing company');
    }
    await fetchJson(`/companies/${companyId}/sales/${id}`, {
      method: 'DELETE',
    });
    setSales((prev) => prev.filter((sale) => sale.id !== id));
  }, [companyId]);

  const totalRevenue = useMemo(() => {
    return sales.reduce((sum, sale) => sum + sale.totalPrice, 0);
  }, [sales]);

  const totalUnitsSold = useMemo(() => {
    return sales.reduce((sum, sale) => sum + sale.quantity, 0);
  }, [sales]);

  const todaysSales = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return sales.filter((sale) => new Date(sale.soldAt) >= today);
  }, [sales]);

  const todaysRevenue = useMemo(() => {
    return todaysSales.reduce((sum, sale) => sum + sale.totalPrice, 0);
  }, [todaysSales]);

  const getSalesByProduct = useCallback((productId: string) => {
    return sales.filter((sale) => sale.productId === productId);
  }, [sales]);

  return {
    sales,
    isLoading,
    addSale,
    deleteSale,
    totalRevenue,
    totalUnitsSold,
    todaysSales,
    todaysRevenue,
    getSalesByProduct,
  };
}

const hydrateSale = (sale: Sale) => ({
  ...sale,
  soldAt: new Date(sale.soldAt),
});

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
