import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { Account } from '@/features/accounts/types';

export type LEType = 'liability' | 'equity';

export interface LEFormData {
  type: LEType;
  accountId: string;
  date: string;
  amount: number;
  memo: string;
}

export interface LEItem extends LEFormData {
  id: string;
  accountCode: string;
  accountName: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: LEFormData) => void;
  editingItem?: LEItem | null;
  accounts: Account[];
  perantaraCode: string;
}

const initial: LEFormData = {
  type: 'liability',
  accountId: '',
  date: new Date().toISOString().slice(0, 10),
  amount: 0,
  memo: '',
};

export function AddLEModal({ isOpen, onClose, onSubmit, editingItem, accounts, perantaraCode }: Props) {
  const [form, setForm] = useState<LEFormData>(initial);
  const [amountInput, setAmountInput] = useState(String(initial.amount));

  useEffect(() => {
    if (editingItem) {
      setForm({
        type: editingItem.type,
        accountId: editingItem.accountId,
        date: editingItem.date.slice(0, 10),
        amount: editingItem.amount,
        memo: editingItem.memo,
      });
      setAmountInput(String(editingItem.amount));
    } else {
      setForm(initial);
      setAmountInput(String(initial.amount));
    }
  }, [editingItem, isOpen]);

  const parseNumber = (v: string) => parseInt(v.replace(/[^\d]/g, ''), 10) || 0;
  const normalizeInput = (v: string) => v.replace(/[^\d]/g, '');

  const filteredAccounts = accounts.filter(
    (a) => a.type === form.type && a.code !== perantaraCode,
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ ...form, amount: parseNumber(amountInput) });
    onClose();
    setForm(initial);
    setAmountInput(String(initial.amount));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-foreground">
            {editingItem ? 'Edit Liabilitas / Ekuitas' : 'Tambah Liabilitas / Ekuitas'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Jenis</Label>
            <Select
              value={form.type}
              onValueChange={(v: LEType) => setForm({ ...form, type: v, accountId: '' })}
            >
              <SelectTrigger className="bg-background border-border"><SelectValue /></SelectTrigger>
              <SelectContent className="bg-card border-border z-50">
                <SelectItem value="liability">Liabilitas</SelectItem>
                <SelectItem value="equity">Ekuitas</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Akun</Label>
            <Select value={form.accountId} onValueChange={(v) => setForm({ ...form, accountId: v })}>
              <SelectTrigger className="bg-background border-border">
                <SelectValue
                  placeholder={
                    filteredAccounts.length === 0
                      ? `Belum ada akun ${form.type === 'liability' ? 'liabilitas' : 'ekuitas'}`
                      : 'Pilih akun'
                  }
                />
              </SelectTrigger>
              <SelectContent className="bg-card border-border z-50">
                {filteredAccounts.map((a) => (
                  <SelectItem key={a.id} value={a.id}>{a.code} - {a.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Tanggal</Label>
              <Input
                type="date"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                className="bg-background border-border"
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Nominal (Rp)</Label>
              <Input
                type="text"
                inputMode="numeric"
                value={amountInput}
                onChange={(e) => {
                  const v = normalizeInput(e.target.value);
                  setAmountInput(v);
                  setForm({ ...form, amount: parseNumber(v) });
                }}
                className="bg-background border-border"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Keterangan</Label>
            <Input
              value={form.memo}
              onChange={(e) => setForm({ ...form, memo: e.target.value })}
              placeholder="Opsional"
              className="bg-background border-border"
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>Batal</Button>
            <Button type="submit" disabled={!form.accountId || parseNumber(amountInput) <= 0}>
              {editingItem ? 'Simpan' : 'Tambah'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
