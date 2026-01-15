import { useLocalStorage } from './useLocalStorage';
import { Purchase, PurchaseCategory } from '../types/purchases';

const DEFAULT_CATEGORIES: PurchaseCategory[] = [
  { id: '1', name: 'Ingredients', createdAt: new Date().toISOString() },
  { id: '2', name: 'Supplies', createdAt: new Date().toISOString() },
  { id: '3', name: 'Packaging', createdAt: new Date().toISOString() },
  { id: '4', name: 'Equipment', createdAt: new Date().toISOString() },
];

export function usePurchaseCategories() {
  const [categories, setCategories] = useLocalStorage<PurchaseCategory[]>('purchase-categories', DEFAULT_CATEGORIES);

  const addCategory = (name: string) => {
    const newCategory: PurchaseCategory = {
      id: crypto.randomUUID(),
      name: name.trim(),
      createdAt: new Date().toISOString(),
    };
    setCategories([...categories, newCategory]);
    return newCategory;
  };

  const updateCategory = (id: string, name: string) => {
    setCategories(categories.map(cat => 
      cat.id === id ? { ...cat, name: name.trim() } : cat
    ));
  };

  const deleteCategory = (id: string) => {
    setCategories(categories.filter(cat => cat.id !== id));
  };

  return {
    categories,
    addCategory,
    updateCategory,
    deleteCategory,
  };
}

export function usePurchases() {
  const [purchases, setPurchases] = useLocalStorage<Purchase[]>('purchases', []);

  const addPurchase = (purchase: Omit<Purchase, 'id' | 'createdAt' | 'totalCost'>) => {
    const newPurchase: Purchase = {
      ...purchase,
      id: crypto.randomUUID(),
      totalCost: purchase.quantity * purchase.unitCost,
      createdAt: new Date().toISOString(),
    };
    setPurchases([newPurchase, ...purchases]);
    return newPurchase;
  };

  const updatePurchase = (id: string, updates: Partial<Omit<Purchase, 'id' | 'createdAt'>>) => {
    setPurchases(purchases.map(p => {
      if (p.id !== id) return p;
      const updated = { ...p, ...updates };
      if (updates.quantity !== undefined || updates.unitCost !== undefined) {
        updated.totalCost = updated.quantity * updated.unitCost;
      }
      return updated;
    }));
  };

  const deletePurchase = (id: string) => {
    setPurchases(purchases.filter(p => p.id !== id));
  };

  const getTotalSpend = () => {
    return purchases.reduce((sum, p) => sum + p.totalCost, 0);
  };

  const getSpendByCategory = (categoryId: string) => {
    return purchases
      .filter(p => p.categoryId === categoryId)
      .reduce((sum, p) => sum + p.totalCost, 0);
  };

  return {
    purchases,
    addPurchase,
    updatePurchase,
    deletePurchase,
    getTotalSpend,
    getSpendByCategory,
  };
}
