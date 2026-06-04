import { useMemo, useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Plus, Scale, Landmark, Wallet } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useErrorToast } from '@/shared/hooks/useErrorToast';
import { useCompanyProfile } from '@/features/onboarding';
import { useAccounts } from '@/features/accounts/hooks/useAccounts';
import { AddLEModal, type LEFormData, type LEItem } from '../components/AddLEModal';
import { LETable } from '../components/LETable';
import { useOpeningBalanceItems } from '../hooks/useOpeningBalanceItems';
import { PageHeader, StatCard, EmptyState } from '@/shared';

const PERANTARA_CODE = '3999';

const fmt = (v: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(v);


export default function OpeningBalances() {
  const { company, error: companyError } = useCompanyProfile();
  const { accounts, error: accountsError } = useAccounts(company?.id);
  const { items: dbItems, addItem, updateItem, deleteItem, error: itemsError } = useOpeningBalanceItems(company?.id);
  const { toast } = useToast();
  useErrorToast(companyError, 'Gagal memuat perusahaan');
  useErrorToast(accountsError, 'Gagal memuat akun');
  useErrorToast(itemsError, 'Gagal memuat liabilitas & ekuitas');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState<LEItem | null>(null);

  const items: LEItem[] = useMemo(
    () =>
      dbItems.map((it) => ({
        id: it.id,
        type: it.kind,
        accountId: it.accountId,
        accountCode: it.account.code,
        accountName: it.account.name,
        date: it.asOfDate,
        amount: it.amount,
        memo: it.memo ?? '',
      })),
    [dbItems],
  );

  const totalLiability = items.filter((i) => i.type === 'liability').reduce((s, i) => s + i.amount, 0);
  const totalEquity = items.filter((i) => i.type === 'equity').reduce((s, i) => s + i.amount, 0);
  const grandTotal = totalLiability + totalEquity;

  const handleSubmit = async (data: LEFormData) => {
    if (!company?.id) return;
    try {
      if (editing) {
        await updateItem(editing.id, {
          kind: data.type,
          accountId: data.accountId,
          asOfDate: data.date,
          amount: data.amount,
          memo: data.memo,
        });
        toast({ title: 'Tersimpan', description: 'Data berhasil diperbarui.' });
      } else {
        await addItem({
          kind: data.type,
          accountId: data.accountId,
          asOfDate: data.date,
          amount: data.amount,
          memo: data.memo,
        });
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
      await deleteItem(id);
      toast({ title: 'Dihapus', description: 'Data berhasil dihapus.' });
    } catch (err: any) {
      toast({ title: 'Gagal Menghapus', description: err.message, variant: 'destructive' });
    }
  };
  const handleClose = () => { setIsModalOpen(false); setEditing(null); };

  return (
    <MainLayout>
      <div className="space-y-6">
        <PageHeader
          icon={Scale}
          title="Liabilitas & Ekuitas"
          description="Kelola pos liabilitas dan ekuitas perusahaan"
          tip="Catat saldo awal liabilitas (kewajiban/hutang) dan ekuitas (modal) perusahaan Anda agar neraca seimbang sejak awal."
          action={<Button onClick={() => setIsModalOpen(true)} className="gap-2"><Plus className="h-4 w-4" />Tambah</Button>}
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatCard icon={Landmark} tone="warning" label="Total Liabilitas" value={fmt(totalLiability)} hint="Kewajiban perusahaan" />
          <StatCard icon={Wallet} tone="success" label="Total Ekuitas" value={fmt(totalEquity)} hint="Modal pemilik" />
          <StatCard icon={Scale} tone="primary" label="Total Liabilitas + Ekuitas" value={fmt(grandTotal)} hint="Harus seimbang dengan aset" />
        </div>

        <div className="bg-card rounded-xl border border-border p-6 shadow-[var(--shadow-card)]">
          <h2 className="text-lg font-semibold mb-4">Daftar Liabilitas & Ekuitas</h2>
          {items.length === 0 ? (
            <EmptyState
              icon={Scale}
              title="Belum ada data"
              description="Tambahkan pos liabilitas atau ekuitas pertama Anda untuk menyusun saldo awal perusahaan."
              action={<Button onClick={() => setIsModalOpen(true)} className="gap-2"><Plus className="h-4 w-4" />Tambah</Button>}
            />
          ) : (
            <LETable items={items} onEdit={handleEdit} onDelete={handleDelete} />
          )}
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
