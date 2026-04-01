import { useCallback, useEffect, useState } from 'react';
import { Receivable, Payable, ReceivableFormData, PayableFormData } from '../types';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

export function useReceivables(companyId?: string) {
  const [receivables, setReceivables] = useState<Receivable[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      if (!companyId) return;
      setIsLoading(true);
      try {
        const data = await fetchJson<Receivable[]>(`/companies/${companyId}/receivables`, {
          method: 'GET',
        });
        setReceivables(data.map(hydrateReceivable));
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [companyId]);

  const addReceivable = useCallback(async (data: ReceivableFormData) => {
    if (!companyId) {
      throw new Error('Missing company');
    }
    const created = await fetchJson<Receivable>(`/companies/${companyId}/receivables`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    const hydrated = hydrateReceivable(created);
    setReceivables((prev) => [...prev, hydrated]);
    return hydrated;
  }, [companyId]);

  const updateReceivable = useCallback(async (id: string, data: Partial<Receivable>) => {
    if (!companyId) {
      throw new Error('Missing company');
    }
    const updated = await fetchJson<Receivable>(`/companies/${companyId}/receivables/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
    const hydrated = hydrateReceivable(updated);
    setReceivables((prev) => prev.map((receivable) => (receivable.id === id ? hydrated : receivable)));
  }, [companyId]);

  const deleteReceivable = useCallback(async (id: string) => {
    if (!companyId) {
      throw new Error('Missing company');
    }
    await fetchJson(`/companies/${companyId}/receivables/${id}`, {
      method: 'DELETE',
    });
    setReceivables((prev) => prev.filter((receivable) => receivable.id !== id));
  }, [companyId]);

  const recordPayment = useCallback(async (id: string, amount: number) => {
    const receivable = receivables.find((r) => r.id === id);
    if (!receivable) return;
    const newPaidAmount = receivable.paidAmount + amount;
    await updateReceivable(id, { paidAmount: newPaidAmount });
  }, [receivables, updateReceivable]);

  const getTotalReceivables = useCallback(() => receivables.reduce((sum, r) => sum + (r.amount - r.paidAmount), 0), [receivables]);
  const getPendingReceivables = useCallback(() => receivables.filter((r) => r.status !== 'paid'), [receivables]);

  return {
    receivables,
    isLoading,
    addReceivable,
    updateReceivable,
    deleteReceivable,
    recordPayment,
    getTotalReceivables,
    getPendingReceivables,
  };
}

export function usePayables(companyId?: string) {
  const [payables, setPayables] = useState<Payable[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      if (!companyId) return;
      setIsLoading(true);
      try {
        const data = await fetchJson<Payable[]>(`/companies/${companyId}/payables`, {
          method: 'GET',
        });
        setPayables(data.map(hydratePayable));
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [companyId]);

  const addPayable = useCallback(async (data: PayableFormData) => {
    if (!companyId) {
      throw new Error('Missing company');
    }
    const created = await fetchJson<Payable>(`/companies/${companyId}/payables`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    const hydrated = hydratePayable(created);
    setPayables((prev) => [...prev, hydrated]);
    return hydrated;
  }, [companyId]);

  const updatePayable = useCallback(async (id: string, data: Partial<Payable>) => {
    if (!companyId) {
      throw new Error('Missing company');
    }
    const updated = await fetchJson<Payable>(`/companies/${companyId}/payables/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
    const hydrated = hydratePayable(updated);
    setPayables((prev) => prev.map((payable) => (payable.id === id ? hydrated : payable)));
  }, [companyId]);

  const deletePayable = useCallback(async (id: string) => {
    if (!companyId) {
      throw new Error('Missing company');
    }
    await fetchJson(`/companies/${companyId}/payables/${id}`, {
      method: 'DELETE',
    });
    setPayables((prev) => prev.filter((payable) => payable.id !== id));
  }, [companyId]);

  const recordPayment = useCallback(async (id: string, amount: number) => {
    const payable = payables.find((p) => p.id === id);
    if (!payable) return;
    const newPaidAmount = payable.paidAmount + amount;
    await updatePayable(id, { paidAmount: newPaidAmount });
  }, [payables, updatePayable]);

  const getTotalPayables = useCallback(() => payables.reduce((sum, p) => sum + (p.amount - p.paidAmount), 0), [payables]);
  const getPendingPayables = useCallback(() => payables.filter((p) => p.status !== 'paid'), [payables]);

  return {
    payables,
    isLoading,
    addPayable,
    updatePayable,
    deletePayable,
    recordPayment,
    getTotalPayables,
    getPendingPayables,
  };
}

const hydrateReceivable = (receivable: Receivable): Receivable => ({
  ...receivable,
  dueDate: receivable.dueDate,
  createdAt: receivable.createdAt,
  updatedAt: receivable.updatedAt,
});

const hydratePayable = (payable: Payable): Payable => ({
  ...payable,
  dueDate: payable.dueDate,
  createdAt: payable.createdAt,
  updatedAt: payable.updatedAt,
});

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
