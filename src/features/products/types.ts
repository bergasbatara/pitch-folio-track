export type ProductType = 'barang' | 'jasa';
export type ProductUnit = 'pcs' | 'box' | 'gr' | 'kg' | 'liter' | 'meter' | 'unit' | 'lusin' | 'rim' | 'lainnya';

export interface Product {
  id: string;
  code?: string | null;
  name: string;
  type?: ProductType;
  unit?: ProductUnit;
  price: number;
  buyPrice?: number;
  stock: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProductFormData {
  code?: string;
  name: string;
  type?: ProductType;
  unit?: ProductUnit;
  price: number;
  buyPrice?: number;
  stock: number;
}

export const PRODUCT_TYPE_LABELS: Record<ProductType, string> = {
  barang: 'Barang',
  jasa: 'Jasa',
};

export const PRODUCT_UNIT_LABELS: Record<ProductUnit, string> = {
  pcs: 'Pcs',
  box: 'Box',
  gr: 'Gram',
  kg: 'Kg',
  liter: 'Liter',
  meter: 'Meter',
  unit: 'Unit',
  lusin: 'Lusin',
  rim: 'Rim',
  lainnya: 'Lainnya',
};
