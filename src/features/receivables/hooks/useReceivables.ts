import { useCallback, useEffect, useState } from 'react';
import { Receivable, Payable, ReceivableFormData, PayableFormData } from '../types';
import { useAsyncStatus } from '@/shared/hooks/useAsyncStatus';
import { withCsrf } from '@/shared/lib/csrf';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

export function useReceivables(companyId?: string) {
  const [receivables, setReceivables] = useState<Receivable[]>([]);
  const { isLoading, isMutating, error, runLoad, runMutate } = useAsyncStatus();

  useEffect(() => {
    const load = async () => {
      if (!companyId) return;
      await runLoad(async () => {
        const data = await fetchJson<Receivable[]>(`/companies/${companyId}/receivables`, {
          method: 'GET',
        });
        setReceivables(data.map(hydrateReceivable));
      });
    };
    load();
  }, [companyId, runLoad]);

  const addReceivable = useCallback(async (data: ReceivableFormData) => {
    if (!companyId) {
      throw new Error('Missing company');
    }
    const tempId = `temp-${crypto.randomUUID?.() ?? Math.random().toString(36).slice(2)}`;
    const optimistic: Receivable = hydrateReceivable({
      id: tempId,
      customerName: data.customerName,
      description: data.description,
      amount: data.amount,
      dueDate: data.dueDate,
      paidAmount: data.paidAmount ?? 0,
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    const created = await runMutate(async () => {
      const result = await fetchJson<Receivable>(`/companies/${companyId}/receivables`, {
        method: 'POST',
        body: JSON.stringify(data),
      });
      return hydrateReceivable(result);
    }, {
      apply: () => setReceivables((prev) => [...prev, optimistic]),
      rollback: () => setReceivables((prev) => prev.filter((r) => r.id !== tempId)),
    });
    setReceivables((prev) => prev.map((r) => (r.id === tempId ? created : r)));
    return created;
  }, [companyId, runMutate]);

  const updateReceivable = useCallback(async (id: string, data: Partial<Receivable>) => {
    if (!companyId) {
      throw new Error('Missing company');
    }
    const previous = receivables.find((receivable) => receivable.id === id);
    const updated = await runMutate(async () => {
      const result = await fetchJson<Receivable>(`/companies/${companyId}/receivables/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      });
      return hydrateReceivable(result);
    }, {
      apply: () => {
        setReceivables((prev) => prev.map((receivable) => (
          receivable.id === id ? { ...receivable, ...data } as Receivable : receivable
        )));
      },
      rollback: () => {
        if (!previous) return;
        setReceivables((prev) => prev.map((receivable) => (receivable.id === id ? previous : receivable)));
      },
    });
    setReceivables((prev) => prev.map((receivable) => (receivable.id === id ? updated : receivable)));
  }, [companyId, receivables, runMutate]);

  const deleteReceivable = useCallback(async (id: string) => {
    if (!companyId) {
      throw new Error('Missing company');
    }
    const previous = receivables;
    await runMutate(async () => {
      await fetchJson(`/companies/${companyId}/receivables/${id}`, {
        method: 'DELETE',
      });
    }, {
      apply: () => setReceivables((prev) => prev.filter((receivable) => receivable.id !== id)),
      rollback: () => setReceivables(previous),
    });
  }, [companyId, receivables, runMutate]);

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
    isMutating,
    error,
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
  const { isLoading, isMutating, error, runLoad, runMutate } = useAsyncStatus();

  useEffect(() => {
    const load = async () => {
      if (!companyId) return;
      await runLoad(async () => {
        const data = await fetchJson<Payable[]>(`/companies/${companyId}/payables`, {
          method: 'GET',
        });
        setPayables(data.map(hydratePayable));
      });
    };
    load();
  }, [companyId, runLoad]);

  const addPayable = useCallback(async (data: PayableFormData) => {
    if (!companyId) {
      throw new Error('Missing company');
    }
    const tempId = `temp-${crypto.randomUUID?.() ?? Math.random().toString(36).slice(2)}`;
    const optimistic: Payable = hydratePayable({
      id: tempId,
      supplierName: data.supplierName,
      description: data.description,
      amount: data.amount,
      dueDate: data.dueDate,
      paidAmount: data.paidAmount ?? 0,
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    const created = await runMutate(async () => {
      const result = await fetchJson<Payable>(`/companies/${companyId}/payables`, {
        method: 'POST',
        body: JSON.stringify(data),
      });
      return hydratePayable(result);
    }, {
      apply: () => setPayables((prev) => [...prev, optimistic]),
      rollback: () => setPayables((prev) => prev.filter((p) => p.id !== tempId)),
    });
    setPayables((prev) => prev.map((p) => (p.id === tempId ? created : p)));
    return created;
  }, [companyId, runMutate]);

  const updatePayable = useCallback(async (id: string, data: Partial<Payable>) => {
    if (!companyId) {
      throw new Error('Missing company');
    }
    const previous = payables.find((payable) => payable.id === id);
    const updated = await runMutate(async () => {
      const result = await fetchJson<Payable>(`/companies/${companyId}/payables/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      });
      return hydratePayable(result);
    }, {
      apply: () => {
        setPayables((prev) => prev.map((payable) => (
          payable.id === id ? { ...payable, ...data } as Payable : payable
        )));
      },
      rollback: () => {
        if (!previous) return;
        setPayables((prev) => prev.map((payable) => (payable.id === id ? previous : payable)));
      },
    });
    setPayables((prev) => prev.map((payable) => (payable.id === id ? updated : payable)));
  }, [companyId, payables, runMutate]);

  const deletePayable = useCallback(async (id: string) => {
    if (!companyId) {
      throw new Error('Missing company');
    }
    const previous = payables;
    await runMutate(async () => {
      await fetchJson(`/companies/${companyId}/payables/${id}`, {
        method: 'DELETE',
      });
    }, {
      apply: () => setPayables((prev) => prev.filter((payable) => payable.id !== id)),
      rollback: () => setPayables(previous),
    });
  }, [companyId, payables, runMutate]);

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
    isMutating,
    error,
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
    ...withCsrf({ ...options, headers }),
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
