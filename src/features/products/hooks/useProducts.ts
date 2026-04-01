import { useCallback, useEffect, useState } from 'react';
import { Product, ProductFormData } from '../types';
import { useAsyncStatus } from '@/shared/hooks/useAsyncStatus';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

export function useProducts(companyId?: string) {
  const [products, setProducts] = useState<Product[]>([]);
  const { isLoading, isMutating, error, runLoad, runMutate } = useAsyncStatus();

  useEffect(() => {
    const load = async () => {
      if (!companyId) return;
      await runLoad(async () => {
        const data = await fetchJson<Product[]>(`/companies/${companyId}/products`, {
          method: 'GET',
        });
        setProducts(data.map(hydrateProduct));
      });
    };
    load();
  }, [companyId, runLoad]);

  const addProduct = useCallback(async (data: ProductFormData) => {
    if (!companyId) {
      throw new Error('Missing company');
    }
    const payload = {
      ...data,
      code: data.code?.trim() || undefined,
    };
    const tempId = `temp-${crypto.randomUUID?.() ?? Math.random().toString(36).slice(2)}`;
    const optimistic: Product = hydrateProduct({
      id: tempId,
      name: payload.name,
      code: payload.code ?? null,
      type: payload.type,
      unit: payload.unit,
      buyPrice: payload.buyPrice,
      price: payload.price,
      stock: payload.stock,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    const created = await runMutate(async () => {
      const result = await fetchJson<Product>(`/companies/${companyId}/products`, {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      return hydrateProduct(result);
    }, {
      apply: () => setProducts((prev) => [optimistic, ...prev]),
      rollback: () => setProducts((prev) => prev.filter((p) => p.id !== tempId)),
    });
    setProducts((prev) => prev.map((p) => (p.id === tempId ? created : p)));
    return created;
  }, [companyId, runMutate]);

  const updateProduct = useCallback(async (id: string, data: Partial<ProductFormData>) => {
    if (!companyId) {
      throw new Error('Missing company');
    }
    const payload = {
      ...data,
      code: data.code !== undefined ? data.code.trim() || undefined : undefined,
    };
    const previous = products.find((product) => product.id === id);
    const updated = await runMutate(async () => {
      const result = await fetchJson<Product>(`/companies/${companyId}/products/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      });
      return hydrateProduct(result);
    }, {
      apply: () => {
        setProducts((prev) => prev.map((product) => (
          product.id === id ? { ...product, ...payload } as Product : product
        )));
      },
      rollback: () => {
        if (!previous) return;
        setProducts((prev) => prev.map((product) => (product.id === id ? previous : product)));
      },
    });
    setProducts((prev) => prev.map((product) => (product.id === id ? updated : product)));
  }, [companyId, products, runMutate]);

  const deleteProduct = useCallback(async (id: string) => {
    if (!companyId) {
      throw new Error('Missing company');
    }
    const previous = products;
    await runMutate(async () => {
      await fetchJson(`/companies/${companyId}/products/${id}`, {
        method: 'DELETE',
      });
    }, {
      apply: () => setProducts((prev) => prev.filter((product) => product.id !== id)),
      rollback: () => setProducts(previous),
    });
  }, [companyId, products, runMutate]);

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
    isMutating,
    error,
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
