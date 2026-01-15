export interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProductFormData {
  name: string;
  price: number;
  stock: number;
}
