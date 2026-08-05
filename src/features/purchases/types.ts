export type TransactionStatus = 'draft' | 'posted' | 'voided';
export type PurchaseTransactionType = 'purchase' | 'purchase_return' | 'purchase_cancellation';

export interface PurchaseCategory {
  id: string;
  name: string;
  createdAt: string;
}

export interface Purchase {
  id: string;
  date: string;
  categoryId: string;
  categoryName?: string;
  productId?: string | null;
  productName?: string | null;
  productCode?: string | null;
  taxCodeId?: string | null;
  taxCodeName?: string | null;
  status: TransactionStatus;
  transactionType: PurchaseTransactionType;
  originPurchaseId?: string | null;
  settlementType: 'cash' | 'payable';
  itemName: string;
  supplier?: string;
  quantity: number;
  unitCost: number;
  subtotalCost: number;
  taxRate: number;
  taxAmount: number;
  totalCost: number;
  notes?: string;
  createdAt: string;
}

export interface PurchaseFormData {
  date: string;
  productId?: string | null;
  productCode?: string | null;
  taxCodeId?: string | null;
  settlementType?: 'cash' | 'payable';
  itemName: string;
  supplier?: string;
  quantity: number;
  unitCost: number;
  notes?: string;
}
