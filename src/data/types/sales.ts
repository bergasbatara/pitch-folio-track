export interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Sale {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  pricePerUnit: number;
  totalPrice: number;
  soldAt: Date;
}

export interface ProductFormData {
  name: string;
  price: number;
  stock: number;
}

export interface SaleFormData {
  productId: string;
  quantity: number;
  pricePerUnit: number;
}
