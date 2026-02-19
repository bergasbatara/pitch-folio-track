export type AssetCategory = 'gedung' | 'kendaraan' | 'mesin' | 'tanah' | 'lainnya';

export interface FixedAsset {
  id: string;
  name: string;
  category: AssetCategory;
  acquisitionDate: string;
  acquisitionCost: number;
  usefulLifeMonths: number;
  residualValue: number;
  depreciationMethod: 'straight_line';
  createdAt: string;
  updatedAt: string;
}

export type FixedAssetFormData = Omit<FixedAsset, 'id' | 'createdAt' | 'updatedAt'>;

export const ASSET_USEFUL_LIFE: Record<AssetCategory, number> = {
  gedung: 240,
  kendaraan: 96,
  mesin: 48,
  tanah: 0,
  lainnya: 48,
};

export const ASSET_CATEGORY_LABELS: Record<AssetCategory, string> = {
  gedung: 'Gedung',
  kendaraan: 'Kendaraan',
  mesin: 'Mesin & Peralatan',
  tanah: 'Tanah',
  lainnya: 'Harta Lainnya',
};

export function calculateDepreciation(asset: FixedAsset) {
  if (asset.usefulLifeMonths === 0) {
    return { depreciableAmount: 0, monthlyDepreciation: 0, yearlyDepreciation: 0, accumulatedDepreciation: 0, bookValue: asset.acquisitionCost };
  }
  const depreciableAmount = asset.acquisitionCost - asset.residualValue;
  const monthlyDepreciation = Math.round(depreciableAmount / asset.usefulLifeMonths);
  const yearlyDepreciation = monthlyDepreciation * 12;

  const acquisitionDate = new Date(asset.acquisitionDate);
  const now = new Date();
  const monthsElapsed = Math.max(0, (now.getFullYear() - acquisitionDate.getFullYear()) * 12 + (now.getMonth() - acquisitionDate.getMonth()));
  const cappedMonths = Math.min(monthsElapsed, asset.usefulLifeMonths);
  const accumulatedDepreciation = cappedMonths * monthlyDepreciation;
  const bookValue = asset.acquisitionCost - accumulatedDepreciation;

  return { depreciableAmount, monthlyDepreciation, yearlyDepreciation, accumulatedDepreciation, bookValue };
}
