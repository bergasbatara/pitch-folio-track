export type TransactionStatus = 'draft' | 'posted' | 'voided';
export type SaleTransactionType = 'sale' | 'sale_return' | 'sale_cancellation';

export interface Sale {
  id: string;
  productId: string;
  productName: string;
  taxCodeId?: string | null;
  taxCodeName?: string | null;
  status: TransactionStatus;
  transactionType: SaleTransactionType;
  originSaleId?: string | null;
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
