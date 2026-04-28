import { useMemo, useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Plus, Scale } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useErrorToast } from '@/shared/hooks/useErrorToast';
import { useCompanyProfile } from '@/features/onboarding';
import { useAccounts } from '@/features/accounts/hooks/useAccounts';
import { useJournals } from '@/features/journals/hooks/useJournals';
import { AddLEModal, type LEFormData, type LEItem } from '../components/AddLEModal';
import { LETable } from '../components/LETable';

const PERANTARA_CODE = '3999';
const PERANTARA_NAME = 'Saldo Awal Sementara';
const SOURCE_TAG = 'liabilitas-ekuitas';

const fmt = (v: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(v);

export default function OpeningBalances() {
  const { company, error: companyError } = useCompanyProfile();
  const { accounts, addAccount, error: accountsError } = useAccounts(company?.id);
  const { entries, addEntry, updateEntry, deleteEntry, error: journalsError } = useJournals(company?.id);
  const { toast } = useToast();
  useErrorToast(companyError, 'Gagal memuat perusahaan');
  useErrorToast(accountsError, 'Gagal memuat akun');
  useErrorToast(journalsError, 'Gagal memuat jurnal');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState<LEItem | null>(null);

  // Convert journal entries tagged as liabilitas-ekuitas back into LEItems
  const items: LEItem[] = useMemo(() => {
    return entries
      .filter((e) => e.source === SOURCE_TAG)
      .map((e) => {
        // Each entry: 1 credit line (the L/E account) + 1 debit line (perantara)
        const creditLine = e.lines.find((l) => l.credit > 0 && l.account.code !== PERANTARA_CODE);
        if (!creditLine) return null;
        const acc = accounts.find((a) => a.id === creditLine.accountId);
        const type = acc?.type === 'liability' ? 'liability' : 'equity';
        return {
          id: e.id,
          type,
          accountId: creditLine.accountId,
          accountCode: creditLine.account.code,
          accountName: creditLine.account.name,
          date: e.date,
          amount: creditLine.credit,
          memo: e.memo ?? '',
        } as LEItem;
      })
      .filter((x): x is LEItem => !!x);
  }, [entries, accounts]);

  const totalLiability = items.filter((i) => i.type === 'liability').reduce((s, i) => s + i.amount, 0);
  const totalEquity = items.filter((i) => i.type === 'equity').reduce((s, i) => s + i.amount, 0);
  const grandTotal = totalLiability + totalEquity;

  const ensurePerantaraId = async () => {
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

  const buildPayload = async (data: LEFormData) => {
    const perantaraId = await ensurePerantaraId();
    return {
      date: data.date,
      memo: data.memo || (data.type === 'liability' ? 'Saldo Awal Liabilitas' : 'Saldo Awal Ekuitas'),
      source: SOURCE_TAG,
      status: 'posted' as const,
      lines: [
        { accountId: perantaraId, debit: data.amount, credit: 0, memo: 'Penyeimbang Saldo Awal' },
        { accountId: data.accountId, debit: 0, credit: data.amount, memo: data.memo || '' },
      ],
    };
  };

  const handleSubmit = async (data: LEFormData) => {
    if (!company?.id) return;
    try {
      const payload = await buildPayload(data);
      if (editing) {
        await updateEntry(editing.id, payload as any);
        toast({ title: 'Tersimpan', description: 'Data berhasil diperbarui.' });
      } else {
        await addEntry(payload as any);
        toast({ title: 'Tersimpan', description: 'Data berhasil ditambahkan.' });
      }
      setEditing(null);
    } catch (err: any) {
      toast({ title: 'Gagal Menyimpan', description: err.message, variant: 'destructive' });
    }
  };

  const handleEdit = (it: LEItem) => { setEditing(it); setIsModalOpen(true); };
  const handleDelete = async (id: string) => {
    try {
      await deleteEntry(id);
      toast({ title: 'Dihapus', description: 'Data berhasil dihapus.' });
    } catch (err: any) {
      toast({ title: 'Gagal Menghapus', description: err.message, variant: 'destructive' });
    }
  };
  const handleClose = () => { setIsModalOpen(false); setEditing(null); };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Liabilitas & Ekuitas</h1>
            <p className="text-muted-foreground">Kelola pos liabilitas dan ekuitas perusahaan</p>
          </div>
          <Button onClick={() => setIsModalOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />Tambah
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { label: 'Total Liabilitas', value: fmt(totalLiability) },
            { label: 'Total Ekuitas', value: fmt(totalEquity) },
            { label: 'Total Liabilitas + Ekuitas', value: fmt(grandTotal) },
          ].map((s) => (
            <div key={s.label} className="p-4 rounded-xl bg-card border border-border">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-muted text-primary"><Scale className="h-5 w-5" /></div>
                <div>
                  <p className="text-sm text-muted-foreground">{s.label}</p>
                  <p className="text-xl font-bold text-foreground">{s.value}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-card rounded-xl border border-border p-6">
          <h2 className="text-lg font-semibold mb-4">Daftar Liabilitas & Ekuitas</h2>
          <LETable items={items} onEdit={handleEdit} onDelete={handleDelete} />
        </div>
      </div>

      <AddLEModal
        isOpen={isModalOpen}
        onClose={handleClose}
        onSubmit={handleSubmit}
        editingItem={editing}
        accounts={accounts}
        perantaraCode={PERANTARA_CODE}
      />
    </MainLayout>
  );
}
