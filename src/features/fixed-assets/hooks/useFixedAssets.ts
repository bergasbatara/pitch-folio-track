import { useCallback, useEffect, useState } from 'react';
import { FixedAsset, FixedAssetFormData } from '../types';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

export function useFixedAssets(companyId?: string) {
  const [assets, setAssets] = useState<FixedAsset[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      if (!companyId) return;
      setIsLoading(true);
      try {
        const data = await fetchJson<FixedAsset[]>(`/companies/${companyId}/fixed-assets`, {
          method: 'GET',
        });
        setAssets(data);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [companyId]);

  const addAsset = useCallback(async (data: FixedAssetFormData) => {
    if (!companyId) {
      throw new Error('Missing company');
    }
    const created = await fetchJson<FixedAsset>(`/companies/${companyId}/fixed-assets`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    setAssets((prev) => [created, ...prev]);
    return created;
  }, [companyId]);

  const updateAsset = useCallback(async (id: string, data: Partial<FixedAssetFormData>) => {
    if (!companyId) {
      throw new Error('Missing company');
    }
    const updated = await fetchJson<FixedAsset>(`/companies/${companyId}/fixed-assets/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
    setAssets((prev) => prev.map((asset) => (asset.id === id ? updated : asset)));
  }, [companyId]);

  const deleteAsset = useCallback(async (id: string) => {
    if (!companyId) {
      throw new Error('Missing company');
    }
    await fetchJson(`/companies/${companyId}/fixed-assets/${id}`, {
      method: 'DELETE',
    });
    setAssets((prev) => prev.filter((asset) => asset.id !== id));
  }, [companyId]);

  return { assets, isLoading, addAsset, updateAsset, deleteAsset };
}

const fetchJson = async <T,>(path: string, options: RequestInit): Promise<T> => {
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers ?? {}),
  };
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
    credentials: 'include',
  });
  if (!response.ok) {
    let message = 'Request failed';
    try {
      const body = await response.json();
      message = body.message ?? message;
    } catch {
      // ignore parsing errors
    }
    throw new Error(message);
  }
  return response.json() as Promise<T>;
};
