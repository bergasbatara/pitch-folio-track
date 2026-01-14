import { useCallback, useMemo } from 'react';
import { Sale, SaleFormData } from '@/types/sales';
import { useLocalStorage } from './useLocalStorage';

export function useSales() {
  const [sales, setSales] = useLocalStorage<Sale[]>('retail-sales', []);

  const addSale = useCallback((data: SaleFormData, productName: string) => {
    const newSale: Sale = {
      id: crypto.randomUUID(),
      productId: data.productId,
      productName,
      quantity: data.quantity,
      pricePerUnit: data.pricePerUnit,
      totalPrice: data.quantity * data.pricePerUnit,
      soldAt: new Date(),
    };
    setSales((prev) => [newSale, ...prev]);
    return newSale;
  }, [setSales]);

  const deleteSale = useCallback((id: string) => {
    setSales((prev) => prev.filter((sale) => sale.id !== id));
  }, [setSales]);

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
    addSale,
    deleteSale,
    totalRevenue,
    totalUnitsSold,
    todaysSales,
    todaysRevenue,
    getSalesByProduct,
  };
}
