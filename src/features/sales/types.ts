export interface Sale {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  pricePerUnit: number;
  totalPrice: number;
  soldAt: Date;
}

export interface SaleFormData {
  productId: string;
  quantity: number;
  pricePerUnit: number;
}
