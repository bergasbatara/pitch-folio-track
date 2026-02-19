import { useCallback, useEffect, useState } from 'react';
import { FixedAsset, FixedAssetFormData } from '../types';

const STORAGE_KEY = 'app_fixed_assets';

export function useFixedAssets() {
  const [assets, setAssets] = useState<FixedAsset[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) { try { setAssets(JSON.parse(stored)); } catch { /* */ } }
  }, []);

  const persist = useCallback((data: FixedAsset[]) => {
    setAssets(data);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }, []);

  const addAsset = useCallback((data: FixedAssetFormData) => {
    const now = new Date().toISOString();
    const a: FixedAsset = { ...data, id: crypto.randomUUID(), createdAt: now, updatedAt: now };
    persist([a, ...assets]);
    return a;
  }, [assets, persist]);

  const updateAsset = useCallback((id: string, data: Partial<FixedAssetFormData>) => {
    persist(assets.map(a => a.id === id ? { ...a, ...data, updatedAt: new Date().toISOString() } : a));
  }, [assets, persist]);

  const deleteAsset = useCallback((id: string) => {
    persist(assets.filter(a => a.id !== id));
  }, [assets, persist]);

  return { assets, addAsset, updateAsset, deleteAsset };
}
