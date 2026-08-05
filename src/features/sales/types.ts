export type TransactionStatus = 'draft' | 'posted' | 'voided';

export interface Sale {
  id: string;
  productId: string;
  productName: string;
  taxCodeId?: string | null;
  taxCodeName?: string | null;
  status: TransactionStatus;
  settlementType: 'cash' | 'receivable';
  quantity: number;
  pricePerUnit: number;
  subtotalAmount: number;
  taxRate: number;
  taxAmount: number;
  totalPrice: number;
  soldAt: string;
}

export interface SaleFormData {
  productId: string;
  productCode?: string;
  taxCodeId?: string | null;
  settlementType?: 'cash' | 'receivable';
  quantity: number;
  pricePerUnit: number;
  soldAt?: string;
}
