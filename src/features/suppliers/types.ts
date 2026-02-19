export type SupplierType = 'individu' | 'perusahaan' | 'lainnya';

export interface Supplier {
  id: string;
  name: string;
  type: SupplierType;
  address?: string;
  email?: string;
  phone?: string;
  npwp?: string;
  createdAt: string;
  updatedAt: string;
}

export type SupplierFormData = Omit<Supplier, 'id' | 'createdAt' | 'updatedAt'>;
