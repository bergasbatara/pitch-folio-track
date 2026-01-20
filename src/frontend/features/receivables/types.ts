export interface Receivable {
  id: string;
  customerName: string;
  description: string;
  amount: number;
  dueDate: string;
  status: 'pending' | 'partial' | 'paid' | 'overdue';
  paidAmount: number;
  createdAt: string;
  updatedAt: string;
}

export interface Payable {
  id: string;
  supplierName: string;
  description: string;
  amount: number;
  dueDate: string;
  status: 'pending' | 'partial' | 'paid' | 'overdue';
  paidAmount: number;
  createdAt: string;
  updatedAt: string;
}

export type ReceivableFormData = Omit<Receivable, 'id' | 'createdAt' | 'updatedAt' | 'status'>;
export type PayableFormData = Omit<Payable, 'id' | 'createdAt' | 'updatedAt' | 'status'>;
