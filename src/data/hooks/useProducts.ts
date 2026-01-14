import { useCallback } from 'react';
import { Product, ProductFormData } from '@/data/types/sales';
import { useLocalStorage } from './useLocalStorage';

const defaultProducts: Product[] = [
  {
    id: '1',
    name: 'Basic T-Shirt',
    price: 25.00,
    stock: 150,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: '2',
    name: 'Premium Hoodie',
    price: 65.00,
    stock: 75,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: '3',
    name: 'Canvas Sneakers',
    price: 89.00,
    stock: 45,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

export function useProducts() {
  const [products, setProducts] = useLocalStorage<Product[]>('retail-products', defaultProducts);

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
