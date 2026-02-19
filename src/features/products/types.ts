export interface Product {
  id: string;
  code?: string | null;
  name: string;
  price: number;
  stock: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProductFormData {
  code?: string;
  name: string;
  price: number;
  stock: number;
}
