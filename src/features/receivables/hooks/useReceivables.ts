import { useLocalStorage } from '@/shared/hooks/useLocalStorage';
import { Receivable, Payable, ReceivableFormData, PayableFormData } from '../types';

export function useReceivables() {
  const [receivables, setReceivables] = useLocalStorage<Receivable[]>('agf-receivables', []);

  const addReceivable = (data: ReceivableFormData) => {
    const newReceivable: Receivable = {
      ...data,
      id: crypto.randomUUID(),
      status: data.paidAmount >= data.amount ? 'paid' : data.paidAmount > 0 ? 'partial' : 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setReceivables([...receivables, newReceivable]);
  };

  const updateReceivable = (id: string, data: Partial<Receivable>) => {
    setReceivables(
      receivables.map((r) =>
        r.id === id
          ? {
              ...r,
              ...data,
              status: (data.paidAmount ?? r.paidAmount) >= r.amount ? 'paid' : (data.paidAmount ?? r.paidAmount) > 0 ? 'partial' : 'pending',
              updatedAt: new Date().toISOString(),
            }
          : r
      )
    );
  };

  const deleteReceivable = (id: string) => {
    setReceivables(receivables.filter((r) => r.id !== id));
  };

  const recordPayment = (id: string, amount: number) => {
    const receivable = receivables.find((r) => r.id === id);
    if (receivable) {
      const newPaidAmount = receivable.paidAmount + amount;
      updateReceivable(id, { paidAmount: newPaidAmount });
    }
  };

  const getTotalReceivables = () => receivables.reduce((sum, r) => sum + (r.amount - r.paidAmount), 0);
  const getPendingReceivables = () => receivables.filter((r) => r.status !== 'paid');

  return {
    receivables,
    addReceivable,
    updateReceivable,
    deleteReceivable,
    recordPayment,
    getTotalReceivables,
    getPendingReceivables,
  };
}

export function usePayables() {
  const [payables, setPayables] = useLocalStorage<Payable[]>('agf-payables', []);

  const addPayable = (data: PayableFormData) => {
    const newPayable: Payable = {
      ...data,
      id: crypto.randomUUID(),
      status: data.paidAmount >= data.amount ? 'paid' : data.paidAmount > 0 ? 'partial' : 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setPayables([...payables, newPayable]);
  };

  const updatePayable = (id: string, data: Partial<Payable>) => {
    setPayables(
      payables.map((p) =>
        p.id === id
          ? {
              ...p,
              ...data,
              status: (data.paidAmount ?? p.paidAmount) >= p.amount ? 'paid' : (data.paidAmount ?? p.paidAmount) > 0 ? 'partial' : 'pending',
              updatedAt: new Date().toISOString(),
            }
          : p
      )
    );
  };

  const deletePayable = (id: string) => {
    setPayables(payables.filter((p) => p.id !== id));
  };

  const recordPayment = (id: string, amount: number) => {
    const payable = payables.find((p) => p.id === id);
    if (payable) {
      const newPaidAmount = payable.paidAmount + amount;
      updatePayable(id, { paidAmount: newPaidAmount });
    }
  };

  const getTotalPayables = () => payables.reduce((sum, p) => sum + (p.amount - p.paidAmount), 0);
  const getPendingPayables = () => payables.filter((p) => p.status !== 'paid');

  return {
    payables,
    addPayable,
    updatePayable,
    deletePayable,
    recordPayment,
    getTotalPayables,
    getPendingPayables,
  };
}
