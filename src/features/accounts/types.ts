export interface Account {
  id: string;
  code: string;
  name: string;
  type: 'asset' | 'liability' | 'equity' | 'revenue' | 'expense';
  normalBalance: 'debit' | 'credit';
  isSystem: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AccountFormData {
  code: string;
  name: string;
  type: string;
  normalBalance: string;
}
