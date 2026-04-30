import { useCallback, useEffect, useMemo, useState } from 'react';
import { Sale, SaleFormData } from '../types';
import { useAsyncStatus } from '@/shared/hooks/useAsyncStatus';
import { withCsrf } from '@/shared/lib/csrf';
import { parseApiDateToLocalDate } from '@/shared/lib/date';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

export function useSales(companyId?: string) {
  const [sales, setSales] = useState<Sale[]>([]);
  const { isLoading, isMutating, error, runLoad, runMutate } = useAsyncStatus();

  useEffect(() => {
    const load = async () => {
      if (!companyId) return;
      await runLoad(async () => {
        const data = await fetchJson<Sale[]>(`/companies/${companyId}/sales`, {
          method: 'GET',
        });
        setSales(data.map(hydrateSale));
      });
    };
    load();
  }, [companyId, runLoad]);

  const addSale = useCallback(async (data: SaleFormData) => {
    if (!companyId) {
      throw new Error('Missing company');
    }
    const created = await runMutate(async () => {
      const result = await fetchJson<Sale>(`/companies/${companyId}/sales`, {
        method: 'POST',
        body: JSON.stringify(data),
      });
      return hydrateSale(result);
    });
    setSales((prev) => [created, ...prev]);
    return created;
  }, [companyId, runMutate]);

  const deleteSale = useCallback(async (id: string) => {
    if (!companyId) {
      throw new Error('Missing company');
    }
    const previous = sales;
    await runMutate(async () => {
      await fetchJson(`/companies/${companyId}/sales/${id}`, {
        method: 'DELETE',
      });
    }, {
      apply: () => setSales((prev) => prev.filter((sale) => sale.id !== id)),
      rollback: () => setSales(previous),
    });
  }, [companyId, sales, runMutate]);

  const totalRevenue = useMemo(() => {
    return sales.reduce((sum, sale) => sum + sale.totalPrice, 0);
  }, [sales]);

  const totalUnitsSold = useMemo(() => {
    return sales.reduce((sum, sale) => sum + sale.quantity, 0);
  }, [sales]);

  const todaysSales = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return sales.filter((sale) => parseApiDateToLocalDate(sale.soldAt) >= today);
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
    isMutating,
    error,
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
  soldAt: sale.soldAt,
});

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
