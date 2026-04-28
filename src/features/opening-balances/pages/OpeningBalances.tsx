import { useMemo, useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2, Scale } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useErrorToast } from '@/shared/hooks/useErrorToast';
import { useCompanyProfile } from '@/features/onboarding';
import { useAccounts } from '@/features/accounts/hooks/useAccounts';
import { useJournals } from '@/features/journals/hooks/useJournals';

type ItemType = 'liability' | 'equity';

interface Row {
  id: string;
  type: ItemType;
  accountId: string;
  amount: number;
  memo: string;
}

const PERANTARA_CODE = '3999';
const PERANTARA_NAME = 'Saldo Awal Sementara';

const newRow = (type: ItemType = 'liability'): Row => ({
  id: crypto.randomUUID?.() ?? Math.random().toString(36).slice(2),
  type,
  accountId: '',
  amount: 0,
  memo: '',
});

export default function OpeningBalances() {
  const { company, error: companyError } = useCompanyProfile();
  const { accounts, addAccount, error: accountsError } = useAccounts(company?.id);
  const { addEntry, isMutating, error: journalsError } = useJournals(company?.id);
  const { toast } = useToast();
  useErrorToast(companyError, 'Gagal memuat perusahaan');
  useErrorToast(accountsError, 'Gagal memuat akun');
  useErrorToast(journalsError, 'Gagal memuat jurnal');

  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [rows, setRows] = useState<Row[]>([newRow('liability'), newRow('equity')]);

  const liabilityAccounts = useMemo(() => accounts.filter((a) => a.type === 'liability'), [accounts]);
  const equityAccounts = useMemo(
    () => accounts.filter((a) => a.type === 'equity' && a.code !== PERANTARA_CODE),
    [accounts],
  );

  const updateRow = (id: string, patch: Partial<Row>) => {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  };

  const removeRow = (id: string) => setRows((prev) => prev.filter((r) => r.id !== id));

  const totalLiability = rows
    .filter((r) => r.type === 'liability')
    .reduce((s, r) => s + (Number(r.amount) || 0), 0);
  const totalEquity = rows
    .filter((r) => r.type === 'equity')
    .reduce((s, r) => s + (Number(r.amount) || 0), 0);
  const grandTotal = totalLiability + totalEquity;

  const validRows = rows.filter((r) => r.accountId && Number(r.amount) > 0);
  const canSubmit = validRows.length > 0 && !!company?.id && !isMutating;

  const ensurePerantaraAccount = async () => {
    const existing = accounts.find((a) => a.code === PERANTARA_CODE);
    if (existing) return existing.id;
    const created = await addAccount({
      code: PERANTARA_CODE,
      name: PERANTARA_NAME,
      type: 'equity',
      normalBalance: 'debit',
    });
    return created.id;
  };

  const handleSubmit = async () => {
    if (!canSubmit) return;
    try {
      const perantaraId = await ensurePerantaraAccount();
      const total = validRows.reduce((s, r) => s + Number(r.amount), 0);
      const lines = [
        { accountId: perantaraId, debit: total, credit: 0, memo: 'Penyeimbang Saldo Awal' },
        ...validRows.map((r) => ({
          accountId: r.accountId,
          debit: 0,
          credit: Number(r.amount),
          memo: r.memo || (r.type === 'liability' ? 'Saldo Awal Liabilitas' : 'Saldo Awal Ekuitas'),
        })),
      ];
      await addEntry({
        date,
        memo: 'Saldo Awal — Liabilitas & Ekuitas',
        status: 'posted',
        lines,
      } as any);
      toast({ title: 'Saldo Awal Tersimpan', description: 'Jurnal saldo awal berhasil diposting.' });
      setRows([newRow('liability'), newRow('equity')]);
    } catch (err: any) {
      toast({ title: 'Gagal Menyimpan', description: err.message, variant: 'destructive' });
    }
  };

  const fmt = (v: number) => `Rp${v.toLocaleString('id-ID')}`;

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Saldo Awal — Liabilitas & Ekuitas</h1>
            <p className="text-muted-foreground">
              Input setiap pos liabilitas dan ekuitas. Sistem otomatis membuat jurnal seimbang
              menggunakan akun perantara <strong>{PERANTARA_CODE} {PERANTARA_NAME}</strong>.
            </p>
          </div>
        </div>

        <div className="bg-card rounded-xl border border-border p-6 space-y-6">
          <div className="grid grid-cols-2 gap-4 max-w-md">
            <div className="space-y-2">
              <Label>Tanggal</Label>
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="bg-background border-border"
              />
            </div>
          </div>

          <div className="space-y-3">
            <div className="grid grid-cols-[160px_1fr_200px_1fr_auto] gap-3 items-center text-xs font-medium text-muted-foreground px-1">
              <span>Tipe</span>
              <span>Akun</span>
              <span>Nominal (Rp)</span>
              <span>Keterangan</span>
              <span></span>
            </div>

            {rows.map((row) => {
              const accountList = row.type === 'liability' ? liabilityAccounts : equityAccounts;
              return (
                <div key={row.id} className="grid grid-cols-[160px_1fr_200px_1fr_auto] gap-3 items-center">
                  <Select
                    value={row.type}
                    onValueChange={(v) => updateRow(row.id, { type: v as ItemType, accountId: '' })}
                  >
                    <SelectTrigger className="bg-background border-border">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="liability">Liabilitas</SelectItem>
                      <SelectItem value="equity">Ekuitas</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select
                    value={row.accountId}
                    onValueChange={(v) => updateRow(row.id, { accountId: v })}
                  >
                    <SelectTrigger className="bg-background border-border">
                      <SelectValue
                        placeholder={
                          accountList.length === 0
                            ? `Belum ada akun ${row.type === 'liability' ? 'liabilitas' : 'ekuitas'}`
                            : 'Pilih akun'
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {accountList.map((a) => (
                        <SelectItem key={a.id} value={a.id}>
                          {a.code} - {a.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Input
                    type="number"
                    min={0}
                    placeholder="0"
                    value={row.amount || ''}
                    onChange={(e) => updateRow(row.id, { amount: Number(e.target.value) || 0 })}
                    className="bg-background border-border"
                  />

                  <Input
                    placeholder="Opsional"
                    value={row.memo}
                    onChange={(e) => updateRow(row.id, { memo: e.target.value })}
                    className="bg-background border-border"
                  />

                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    className="text-destructive"
                    onClick={() => removeRow(row.id)}
                    disabled={rows.length <= 1}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              );
            })}

            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-1"
                onClick={() => setRows((p) => [...p, newRow('liability')])}
              >
                <Plus className="h-3 w-3" /> Tambah Liabilitas
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-1"
                onClick={() => setRows((p) => [...p, newRow('equity')])}
              >
                <Plus className="h-3 w-3" /> Tambah Ekuitas
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="rounded-lg border border-border bg-muted/30 p-4">
              <p className="text-xs text-muted-foreground">Total Liabilitas</p>
              <p className="text-xl font-bold text-foreground">{fmt(totalLiability)}</p>
            </div>
            <div className="rounded-lg border border-border bg-muted/30 p-4">
              <p className="text-xs text-muted-foreground">Total Ekuitas</p>
              <p className="text-xl font-bold text-foreground">{fmt(totalEquity)}</p>
            </div>
            <div className="rounded-lg border border-primary/30 bg-primary/5 p-4">
              <p className="text-xs text-muted-foreground">Total Liabilitas + Ekuitas</p>
              <p className="text-xl font-bold text-primary">{fmt(grandTotal)}</p>
            </div>
          </div>

          <div className="flex items-start gap-3 rounded-lg border border-border bg-muted/20 p-3 text-xs text-muted-foreground">
            <Scale className="h-4 w-4 mt-0.5 shrink-0" />
            <p>
              Saat disimpan, sistem akan membuat <strong>1 jurnal seimbang</strong> dengan total
              Debit <strong>{fmt(grandTotal)}</strong> ke akun perantara <strong>{PERANTARA_CODE} {PERANTARA_NAME}</strong>,
              dan total Kredit <strong>{fmt(grandTotal)}</strong> tersebar ke setiap akun di atas.
              Akun perantara akan otomatis nol setelah Anda menginput sisi Aset di halaman Saldo Awal Aset
              (atau melalui Jurnal Umum dengan kebalikannya: Debit Aset / Kredit {PERANTARA_CODE}).
            </p>
          </div>

          <div className="flex justify-end gap-2">
            <Button onClick={handleSubmit} disabled={!canSubmit}>
              {isMutating ? 'Menyimpan...' : 'Simpan Saldo Awal'}
            </Button>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
