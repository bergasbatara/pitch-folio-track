import { useCallback, useEffect, useMemo, useState } from 'react';
import { Sale, SaleFormData } from '../types';
import { useAsyncStatus } from '@/shared/hooks/useAsyncStatus';
import { withCsrf } from '@/shared/lib/csrf';
import { parseApiDateToLocalDate } from '@/shared/lib/date';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

export function useSales(companyId?: string) {
  const [sales, setSales] = useState<Sale[]>([]);
  const { isLoading, isMutating, error, runLoad, runMutate } = useAsyncStatus();
  const postedSales = useMemo(() => sales.filter((sale) => sale.status === 'posted'), [sales]);

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

  const createSaleReturn = useCallback(async (id: string) => {
    if (!companyId) {
      throw new Error('Missing company');
    }
    const created = await runMutate(async () => {
      const result = await fetchJson<Sale>(`/companies/${companyId}/sales/${id}/return`, {
        method: 'POST',
      });
      return hydrateSale(result);
    });
    setSales((prev) => [created, ...prev]);
    return created;
  }, [companyId, runMutate]);

  const createSaleCancellation = useCallback(async (id: string) => {
    if (!companyId) {
      throw new Error('Missing company');
    }
    const created = await runMutate(async () => {
      const result = await fetchJson<Sale>(`/companies/${companyId}/sales/${id}/cancel`, {
        method: 'POST',
      });
      return hydrateSale(result);
    });
    setSales((prev) => [created, ...prev]);
    return created;
  }, [companyId, runMutate]);

  const totalRevenue = useMemo(() => {
    return postedSales.reduce((sum, sale) => sum + getSignedSaleTotal(sale), 0);
  }, [postedSales]);

  const totalUnitsSold = useMemo(() => {
    return postedSales.reduce((sum, sale) => sum + getSignedSaleQuantity(sale), 0);
  }, [postedSales]);

  const todaysSales = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return postedSales.filter((sale) => parseApiDateToLocalDate(sale.soldAt) >= today);
  }, [postedSales]);

  const todaysRevenue = useMemo(() => {
    return todaysSales.reduce((sum, sale) => sum + getSignedSaleTotal(sale), 0);
  }, [todaysSales]);

  const getSalesByProduct = useCallback((productId: string) => {
    return postedSales.filter((sale) => sale.productId === productId);
  }, [postedSales]);

  return {
    sales,
    isLoading,
    isMutating,
    error,
    addSale,
    deleteSale,
    createSaleReturn,
    createSaleCancellation,
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
  transactionType: sale.transactionType ?? 'sale',
  originSaleId: sale.originSaleId ?? null,
});

const getSaleSign = (sale: Sale) => sale.transactionType === 'sale' ? 1 : -1;
const getSignedSaleTotal = (sale: Sale) => sale.totalPrice * getSaleSign(sale);
const getSignedSaleQuantity = (sale: Sale) => sale.quantity * getSaleSign(sale);

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
