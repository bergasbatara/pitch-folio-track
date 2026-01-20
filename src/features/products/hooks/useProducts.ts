import { useCallback } from 'react';
import { Product, ProductFormData } from '../types';
import { useLocalStorage } from '@/shared/hooks/useLocalStorage';
import { DEMO_PRODUCTS } from '@/shared/data/demoData';

export function useProducts() {
  const [products, setProducts] = useLocalStorage<Product[]>('retail-products', DEMO_PRODUCTS);

  const addProduct = useCallback((data: ProductFormData) => {
    const newProduct: Product = {
      id: crypto.randomUUID(),
      ...data,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    setProducts((prev) => [...prev, newProduct]);
    return newProduct;
  }, [setProducts]);

  const updateProduct = useCallback((id: string, data: Partial<ProductFormData>) => {
    setProducts((prev) =>
      prev.map((product) =>
        product.id === id
          ? { ...product, ...data, updatedAt: new Date() }
          : product
      )
    );
  }, [setProducts]);

  const deleteProduct = useCallback((id: string) => {
    setProducts((prev) => prev.filter((product) => product.id !== id));
  }, [setProducts]);

  const updateStock = useCallback((id: string, quantitySold: number) => {
    setProducts((prev) =>
      prev.map((product) =>
        product.id === id
          ? { ...product, stock: Math.max(0, product.stock - quantitySold), updatedAt: new Date() }
          : product
      )
    );
  }, [setProducts]);

  const getProductById = useCallback((id: string) => {
    return products.find((product) => product.id === id);
  }, [products]);

  return {
    products,
    addProduct,
    updateProduct,
    deleteProduct,
    updateStock,
    getProductById,
  };
}
