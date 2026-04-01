import { useCallback, useEffect, useState } from 'react';
import { FixedAsset, FixedAssetFormData } from '../types';
import { useAsyncStatus } from '@/shared/hooks/useAsyncStatus';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

export function useFixedAssets(companyId?: string) {
  const [assets, setAssets] = useState<FixedAsset[]>([]);
  const { isLoading, isMutating, error, runLoad, runMutate } = useAsyncStatus();

  useEffect(() => {
    const load = async () => {
      if (!companyId) return;
      await runLoad(async () => {
        const data = await fetchJson<FixedAsset[]>(`/companies/${companyId}/fixed-assets`, {
          method: 'GET',
        });
        setAssets(data);
      });
    };
    load();
  }, [companyId, runLoad]);

  const addAsset = useCallback(async (data: FixedAssetFormData) => {
    if (!companyId) {
      throw new Error('Missing company');
    }
    const tempId = `temp-${crypto.randomUUID?.() ?? Math.random().toString(36).slice(2)}`;
    const optimistic: FixedAsset = {
      id: tempId,
      ...data,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const created = await runMutate(async () => {
      return fetchJson<FixedAsset>(`/companies/${companyId}/fixed-assets`, {
        method: 'POST',
        body: JSON.stringify(data),
      });
    }, {
      apply: () => setAssets((prev) => [optimistic, ...prev]),
      rollback: () => setAssets((prev) => prev.filter((asset) => asset.id !== tempId)),
    });
    setAssets((prev) => prev.map((asset) => (asset.id === tempId ? created : asset)));
    return created;
  }, [companyId, runMutate]);

  const updateAsset = useCallback(async (id: string, data: Partial<FixedAssetFormData>) => {
    if (!companyId) {
      throw new Error('Missing company');
    }
    const previous = assets.find((asset) => asset.id === id);
    const updated = await runMutate(async () => {
      return fetchJson<FixedAsset>(`/companies/${companyId}/fixed-assets/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      });
    }, {
      apply: () => setAssets((prev) => prev.map((asset) => (
        asset.id === id ? { ...asset, ...data } as FixedAsset : asset
      ))),
      rollback: () => {
        if (!previous) return;
        setAssets((prev) => prev.map((asset) => (asset.id === id ? previous : asset)));
      },
    });
    setAssets((prev) => prev.map((asset) => (asset.id === id ? updated : asset)));
  }, [companyId, assets, runMutate]);

  const deleteAsset = useCallback(async (id: string) => {
    if (!companyId) {
      throw new Error('Missing company');
    }
    const previous = assets;
    await runMutate(async () => {
      await fetchJson(`/companies/${companyId}/fixed-assets/${id}`, {
        method: 'DELETE',
      });
    }, {
      apply: () => setAssets((prev) => prev.filter((asset) => asset.id !== id)),
      rollback: () => setAssets(previous),
    });
  }, [companyId, assets, runMutate]);

  return { assets, isLoading, isMutating, error, addAsset, updateAsset, deleteAsset };
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
