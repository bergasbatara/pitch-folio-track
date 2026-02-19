export type CustomerType = 'individu' | 'perusahaan' | 'lainnya';

export interface Customer {
  id: string;
  name: string;
  type: CustomerType;
  address?: string;
  email?: string;
  phone?: string;
  npwp?: string;
  createdAt: string;
  updatedAt: string;
}

export type CustomerFormData = Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>;
