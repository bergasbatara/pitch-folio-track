import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2, AlertCircle, CheckCircle2 } from 'lucide-react';
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

  const updateLine = (idx: number, field: keyof JournalLineFormData, value: any) => {
    setLines((prev) => prev.map((l, i) => (i === idx ? { ...l, [field]: value } : l)));
  };

  // Only consider lines that have an account or any amount as "active"
  const activeLines = lines.filter((l) => {
    const d = Number(l.debit) || 0;
    const c = Number(l.credit) || 0;
    return l.accountId || d > 0 || c > 0;
  });
  const totalDebit = activeLines.reduce((s, l) => s + (Number(l.debit) || 0), 0);
  const totalCredit = activeLines.reduce((s, l) => s + (Number(l.credit) || 0), 0);
  const hasAmounts = totalDebit > 0 || totalCredit > 0;
  // Every active line just needs an account selected — no balance/either-or constraint
  const activeLinesHaveAccount = activeLines.every((l) => l.accountId);
  const canSubmit = activeLines.length > 0 && activeLinesHaveAccount && hasAmounts;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    onSubmit({ date, memo: memo || undefined, lines: activeLines });
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
            <div className="grid grid-cols-[1fr_140px_140px_auto] gap-2 items-center text-xs text-muted-foreground px-1">
              <span>Akun</span>
              <span>Debit</span>
              <span>Kredit</span>
              <span></span>
            </div>
            <div className="space-y-2">
              {lines.map((line, idx) => (
                <div key={idx} className="grid grid-cols-[1fr_140px_140px_auto] gap-2 items-center">
                  <Select value={line.accountId} onValueChange={(v) => updateLine(idx, 'accountId', v)}>
                    <SelectTrigger className="bg-background border-border"><SelectValue placeholder="Pilih akun" /></SelectTrigger>
                    <SelectContent>
                      {accounts.map((a) => <SelectItem key={a.id} value={a.id}>{a.code} - {a.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <Input
                    type="number"
                    min={0}
                    placeholder="0"
                    value={line.debit || ''}
                    onChange={(e) => updateLine(idx, 'debit', Number(e.target.value) || 0)}
                    className="bg-background border-border"
                  />
                  <Input
                    type="number"
                    min={0}
                    placeholder="0"
                    value={line.credit || ''}
                    onChange={(e) => updateLine(idx, 'credit', Number(e.target.value) || 0)}
                    className="bg-background border-border"
                  />
                  <Button type="button" size="icon" variant="ghost" className="text-destructive" onClick={() => lines.length > 2 && setLines((p) => p.filter((_, i) => i !== idx))} disabled={lines.length <= 2}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
            <Button type="button" variant="outline" size="sm" className="gap-1" onClick={() => setLines((p) => [...p, emptyLine()])}>
              <Plus className="h-3 w-3" /> Tambah Baris
            </Button>
            <p className="text-xs text-muted-foreground">
              Isi salah satu kolom Debit atau Kredit pada setiap baris. Akun aset/beban yang bertambah masuk Debit; liabilitas/ekuitas/pendapatan yang bertambah masuk Kredit.
            </p>
          </div>

          <div className="p-3 rounded-lg border border-border bg-muted/30 space-y-2">
            <div className="flex justify-between text-sm">
              <span>Total Debit: <strong>Rp{totalDebit.toLocaleString('id-ID')}</strong></span>
              <span>Total Kredit: <strong>Rp{totalCredit.toLocaleString('id-ID')}</strong></span>
            </div>
            {hasAmounts && (
              <div className="flex items-center justify-between gap-2 text-xs">
                {totalDebit === totalCredit ? (
                  <span className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 className="h-4 w-4" />
                    Seimbang — akan diposting.
                  </span>
                ) : (
                  <span className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
                    <AlertCircle className="h-4 w-4" />
                    Selisih Rp{Math.abs(totalDebit - totalCredit).toLocaleString('id-ID')}
                    {totalDebit < totalCredit ? ' (perlu Debit tambahan)' : ' (perlu Kredit tambahan)'}. Akan disimpan sebagai Draft.
                  </span>
                )}
                {totalDebit < totalCredit && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const diff = totalCredit - totalDebit;
                      setLines((p) => [...p, { accountId: '', debit: diff, credit: 0, memo: 'Penyeimbang' }]);
                    }}
                  >
                    + Baris Debit Penyeimbang (Rp{(totalCredit - totalDebit).toLocaleString('id-ID')})
                  </Button>
                )}
                {totalCredit < totalDebit && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const diff = totalDebit - totalCredit;
                      setLines((p) => [...p, { accountId: '', debit: 0, credit: diff, memo: 'Penyeimbang' }]);
                    }}
                  >
                    + Baris Kredit Penyeimbang (Rp{(totalDebit - totalCredit).toLocaleString('id-ID')})
                  </Button>
                )}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>Batal</Button>
            <Button type="submit" disabled={!canSubmit}>Simpan</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
