import { useCallback, useEffect, useMemo, useState } from 'react';
import { FixedAsset, FixedAssetFormData } from '../types';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';
const ACCESS_TOKEN_KEY = 'auth_access_token';

export function useFixedAssets(companyId?: string) {
  const [assets, setAssets] = useState<FixedAsset[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const accessToken = useMemo(() => localStorage.getItem(ACCESS_TOKEN_KEY), []);

  useEffect(() => {
    const load = async () => {
      if (!companyId || !accessToken) return;
      setIsLoading(true);
      try {
        const data = await fetchJson<FixedAsset[]>(`/companies/${companyId}/fixed-assets`, {
          method: 'GET',
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        setAssets(data);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [companyId, accessToken]);

  const addAsset = useCallback(async (data: FixedAssetFormData) => {
    if (!companyId || !accessToken) {
      throw new Error('Missing company or auth token');
    }
    const created = await fetchJson<FixedAsset>(`/companies/${companyId}/fixed-assets`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}` },
      body: JSON.stringify(data),
    });
    setAssets((prev) => [created, ...prev]);
    return created;
  }, [companyId, accessToken]);

  const updateAsset = useCallback(async (id: string, data: Partial<FixedAssetFormData>) => {
    if (!companyId || !accessToken) {
      throw new Error('Missing company or auth token');
    }
    const updated = await fetchJson<FixedAsset>(`/companies/${companyId}/fixed-assets/${id}`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${accessToken}` },
      body: JSON.stringify(data),
    });
    setAssets((prev) => prev.map((asset) => (asset.id === id ? updated : asset)));
  }, [companyId, accessToken]);

  const deleteAsset = useCallback(async (id: string) => {
    if (!companyId || !accessToken) {
      throw new Error('Missing company or auth token');
    }
    await fetchJson(`/companies/${companyId}/fixed-assets/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    setAssets((prev) => prev.filter((asset) => asset.id !== id));
  }, [companyId, accessToken]);

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
