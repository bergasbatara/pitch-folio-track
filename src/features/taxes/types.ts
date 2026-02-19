export interface TaxCode {
  id: string;
  name: string;
  code: string;
  rate: number; // percentage e.g. 11 for 11%
  description?: string;
  createdAt: string;
}

export type TaxCodeFormData = Omit<TaxCode, 'id' | 'createdAt'>;

export const DEFAULT_TAX_CODES: TaxCodeFormData[] = [
  { name: 'PPN', code: 'PPN', rate: 11, description: 'Pajak Pertambahan Nilai' },
  { name: 'PPh 23 NPWP', code: 'PPH23', rate: 2, description: 'PPh Pasal 23 dengan NPWP' },
  { name: 'PPh 23 Non-NPWP', code: 'PPH23-NN', rate: 4, description: 'PPh Pasal 23 tanpa NPWP' },
];
