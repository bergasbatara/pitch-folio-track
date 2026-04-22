import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2 } from 'lucide-react';
import { JournalEntry, JournalFormData, JournalLineFormData } from '../types';
import { Account } from '@/features/accounts/types';

interface JournalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: JournalFormData) => void;
  accounts: Account[];
  entry?: JournalEntry | null;
}

const emptyLine = (): JournalLineFormData => ({ accountId: '', debit: 0, credit: 0, memo: '' });

// Asset & expense → debit side; liability, equity & revenue → credit side
const isDebitSide = (type: Account['type']) => type === 'asset' || type === 'expense';

export function JournalModal({ isOpen, onClose, onSubmit, accounts, entry }: JournalModalProps) {
  const [date, setDate] = useState('');
  const [memo, setMemo] = useState('');
  const [lines, setLines] = useState<JournalLineFormData[]>([emptyLine(), emptyLine()]);

  useEffect(() => {
    if (entry) {
      setDate(entry.date.slice(0, 10));
      setMemo(entry.memo ?? '');
      setLines(entry.lines.map((l) => ({ accountId: l.accountId, debit: l.debit, credit: l.credit, memo: l.memo ?? '' })));
    } else {
      setDate(new Date().toISOString().slice(0, 10));
      setMemo('');
      setLines([emptyLine(), emptyLine()]);
    }
  }, [entry, isOpen]);

  const accountById = (id: string) => accounts.find((a) => a.id === id);

  const updateLine = (idx: number, field: keyof JournalLineFormData, value: any) => {
    setLines((prev) => prev.map((l, i) => (i === idx ? { ...l, [field]: value } : l)));
  };

  // When user picks an account, reset both sides so the amount field reflects the natural side.
  const handleAccountChange = (idx: number, accountId: string) => {
    setLines((prev) => prev.map((l, i) => (i === idx ? { ...l, accountId, debit: 0, credit: 0 } : l)));
  };

  // Single amount input that routes to debit or credit based on account type.
  const handleAmountChange = (idx: number, amount: number) => {
    setLines((prev) =>
      prev.map((l, i) => {
        if (i !== idx) return l;
        const acc = accountById(l.accountId);
        if (!acc) return { ...l, debit: amount, credit: 0 };
        return isDebitSide(acc.type)
          ? { ...l, debit: amount, credit: 0 }
          : { ...l, debit: 0, credit: amount };
      }),
    );
  };

  const totalDebit = lines.reduce((s, l) => s + (Number(l.debit) || 0), 0);
  const totalCredit = lines.reduce((s, l) => s + (Number(l.credit) || 0), 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ date, memo: memo || undefined, lines });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[760px] bg-card border-border max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-foreground">{entry ? 'Edit Jurnal' : 'Tambah Jurnal'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Tanggal</Label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} required className="bg-background border-border" />
            </div>
            <div className="space-y-2">
              <Label>Memo</Label>
              <Input value={memo} onChange={(e) => setMemo(e.target.value)} placeholder="Catatan (opsional)" className="bg-background border-border" />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Baris Jurnal</Label>
            <div className="space-y-2">
              {lines.map((line, idx) => {
                const acc = accountById(line.accountId);
                const debitSide = acc ? isDebitSide(acc.type) : true;
                const amount = debitSide ? line.debit : line.credit;
                const sideLabel = acc
                  ? debitSide
                    ? 'Debit'
                    : 'Kredit'
                  : 'Jumlah';
                return (
                  <div key={idx} className="grid grid-cols-[1fr_160px_110px_auto] gap-2 items-center">
                    <Select value={line.accountId} onValueChange={(v) => handleAccountChange(idx, v)}>
                      <SelectTrigger className="bg-background border-border"><SelectValue placeholder="Pilih akun" /></SelectTrigger>
                      <SelectContent>
                        {accounts.map((a) => <SelectItem key={a.id} value={a.id}>{a.code} - {a.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <Input
                      type="number"
                      min={0}
                      placeholder={sideLabel}
                      value={amount || ''}
                      onChange={(e) => handleAmountChange(idx, Number(e.target.value) || 0)}
                      className="bg-background border-border"
                    />
                    <span className={`text-xs px-2 py-1 rounded-md text-center ${
                      acc
                        ? debitSide
                          ? 'bg-primary/10 text-primary'
                          : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                        : 'bg-muted text-muted-foreground'
                    }`}>
                      {acc ? sideLabel : '—'}
                    </span>
                    <Button type="button" size="icon" variant="ghost" className="text-destructive" onClick={() => lines.length > 2 && setLines((p) => p.filter((_, i) => i !== idx))} disabled={lines.length <= 2}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                );
              })}
            </div>
            <Button type="button" variant="outline" size="sm" className="gap-1" onClick={() => setLines((p) => [...p, emptyLine()])}>
              <Plus className="h-3 w-3" /> Tambah Baris
            </Button>
            <p className="text-xs text-muted-foreground">
              Aset & Beban otomatis masuk Debit. Kewajiban, Ekuitas & Pendapatan otomatis masuk Kredit.
            </p>
          </div>

          <div className="p-3 rounded-lg border border-border bg-muted/30">
            <div className="flex justify-between text-sm">
              <span>Total Debit: <strong>Rp{totalDebit.toLocaleString('id-ID')}</strong></span>
              <span>Total Kredit: <strong>Rp{totalCredit.toLocaleString('id-ID')}</strong></span>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>Batal</Button>
            <Button type="submit" disabled={lines.some((l) => !l.accountId)}>Simpan</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
