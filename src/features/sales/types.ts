export interface Sale {
  id: string;
  productId: string;
  productName: string;
  settlementType: 'cash' | 'receivable';
  quantity: number;
  pricePerUnit: number;
  totalPrice: number;
  soldAt: string;
}

export interface SaleFormData {
  productId: string;
  productCode?: string;
  settlementType?: 'cash' | 'receivable';
  quantity: number;
  pricePerUnit: number;
  soldAt?: string;
}
