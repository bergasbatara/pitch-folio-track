import { useCallback, useEffect, useMemo, useState } from 'react';
import { Product, ProductFormData } from '../types';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';
const ACCESS_TOKEN_KEY = 'auth_access_token';

export function useProducts(companyId?: string) {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const accessToken = useMemo(() => localStorage.getItem(ACCESS_TOKEN_KEY), []);

  useEffect(() => {
    const load = async () => {
      if (!companyId || !accessToken) return;
      setIsLoading(true);
      try {
        const data = await fetchJson<Product[]>(`/companies/${companyId}/products`, {
          method: 'GET',
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        setProducts(data.map(hydrateProduct));
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [companyId, accessToken]);

  const addProduct = useCallback(async (data: ProductFormData) => {
    if (!companyId || !accessToken) {
      throw new Error('Missing company or auth token');
    }
    const payload = {
      ...data,
      code: data.code?.trim() || undefined,
    };
    const created = await fetchJson<Product>(`/companies/${companyId}/products`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}` },
      body: JSON.stringify(payload),
    });
    const hydrated = hydrateProduct(created);
    setProducts((prev) => [hydrated, ...prev]);
    return hydrated;
  }, [companyId, accessToken]);

  const updateProduct = useCallback(async (id: string, data: Partial<ProductFormData>) => {
    if (!companyId || !accessToken) {
      throw new Error('Missing company or auth token');
    }
    const payload = {
      ...data,
      code: data.code !== undefined ? data.code.trim() || undefined : undefined,
    };
    const updated = await fetchJson<Product>(`/companies/${companyId}/products/${id}`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${accessToken}` },
      body: JSON.stringify(payload),
    });
    const hydrated = hydrateProduct(updated);
    setProducts((prev) => prev.map((product) => (product.id === id ? hydrated : product)));
  }, [companyId, accessToken]);

  const deleteProduct = useCallback(async (id: string) => {
    if (!companyId || !accessToken) {
      throw new Error('Missing company or auth token');
    }
    await fetchJson(`/companies/${companyId}/products/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    setProducts((prev) => prev.filter((product) => product.id !== id));
  }, [companyId, accessToken]);

  const updateStock = useCallback(async (id: string, quantitySold: number) => {
    const current = products.find((product) => product.id === id);
    if (!current) return;
    const newStock = Math.max(0, current.stock - quantitySold);
    await updateProduct(id, { stock: newStock });
  }, [products, updateProduct]);

  const getProductById = useCallback((id: string) => {
    return products.find((product) => product.id === id);
  }, [products]);

  return {
    products,
    isLoading,
    addProduct,
    updateProduct,
    deleteProduct,
    updateStock,
    getProductById,
  };
}

const hydrateProduct = (product: Product) => ({
  ...product,
  createdAt: new Date(product.createdAt),
  updatedAt: new Date(product.updatedAt),
});

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
