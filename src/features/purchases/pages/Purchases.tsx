import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { PurchasesTable } from '../components/PurchasesTable';
import { AddPurchaseModal } from '../components/AddPurchaseModal';
import { usePurchases } from '../hooks/usePurchases';
import { Purchase, PurchaseFormData } from '../types';
import { Plus, TrendingDown, ShoppingBag, Layers } from 'lucide-react';
import { useCompanyProfile } from '@/features/onboarding';
import { useTaxCodes } from '@/features/taxes';
import { useErrorToast } from '@/shared/hooks/useErrorToast';
import { Button } from '@/components/ui/button';
import { PageHeader, StatCard, EmptyState, TransactionReversalDialog } from '@/shared';
import { formatDateId } from '@/shared/lib/date';

export default function Purchases() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPurchase, setEditingPurchase] = useState<Purchase | null>(null);
  const [reversingPurchase, setReversingPurchase] = useState<Purchase | null>(null);
  const { company, error: companyError } = useCompanyProfile();

  const { purchases, addPurchase, updatePurchase, deletePurchase, reversePurchase, getTotalSpend, isMutating, error: purchasesError } = usePurchases(company?.id);
  const { taxCodes, error: taxCodesError } = useTaxCodes(company?.id);
  useErrorToast(companyError, 'Gagal memuat perusahaan');
  useErrorToast(purchasesError, 'Gagal memuat pembelian');
  useErrorToast(taxCodesError, 'Gagal memuat kode pajak');

  const handleEdit = (purchase: Purchase) => {
    setEditingPurchase(purchase);
    setIsModalOpen(true);
  };

  const handleCloseModal = (open: boolean) => {
    setIsModalOpen(open);
    if (!open) {
      setEditingPurchase(null);
    }
  };

  const handleAddPurchase = async (data: PurchaseFormData) => {
    if (!company?.id) return;
    await addPurchase(data);
  };

  const handleUpdatePurchase = async (id: string, updates: Partial<PurchaseFormData>) => {
    if (!company?.id) return;
    await updatePurchase(id, updates);
  };

  const handleReversePurchase = async (purchase: Purchase) => {
    setReversingPurchase(purchase);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(value);
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <PageHeader
          icon={ShoppingBag}
          title="Pembelian"
          description="Lacak pengeluaran dan persediaan bisnis Anda"
          tip="Secara default pembelian dicatat sebagai Hutang Usaha. Pilih metode tunai hanya jika pembayaran langsung dilakukan."
          action={<Button onClick={() => setIsModalOpen(true)} className="gap-2"><Plus className="h-4 w-4" />Tambah Pembelian</Button>}
        />

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <StatCard icon={TrendingDown} tone="destructive" label="Total Pengeluaran" value={formatCurrency(getTotalSpend())} hint="Akumulasi semua pembelian" />
          <StatCard icon={ShoppingBag} tone="primary" label="Total Pembelian" value={purchases.length} hint="Jumlah transaksi tercatat" />
          <StatCard icon={Layers} tone="muted" label="Kategori" value="-" hint="Kelompok pengeluaran" />
        </div>

        <div className="bg-card rounded-xl border border-border p-6 shadow-[var(--shadow-card)]">
          <h2 className="text-lg font-semibold mb-4">Daftar Pembelian</h2>
          {purchases.length === 0 ? (
            <EmptyState
              icon={ShoppingBag}
              title="Belum ada pembelian"
              description="Catat pembelian pertama Anda untuk mulai melacak pengeluaran usaha."
              action={<Button onClick={() => setIsModalOpen(true)} className="gap-2"><Plus className="h-4 w-4" />Tambah Pembelian</Button>}
            />
          ) : (
            <PurchasesTable
              purchases={purchases}
              onEdit={handleEdit}
              onDelete={deletePurchase}
              onReverse={handleReversePurchase}
            />
          )}
        </div>

        <AddPurchaseModal
          open={isModalOpen}
          onOpenChange={handleCloseModal}
          onAddPurchase={handleAddPurchase}
          editingPurchase={editingPurchase}
          onUpdatePurchase={handleUpdatePurchase}
          taxCodes={taxCodes}
        />
        <TransactionReversalDialog
          open={!!reversingPurchase}
          onOpenChange={(open) => !open && setReversingPurchase(null)}
          title="Reverse Pembelian"
          description="Gunakan reversal jika transaksi pembelian posted perlu dibatalkan tanpa menghapus transaksi dan jurnal aslinya."
          transactionLabel={reversingPurchase ? `${reversingPurchase.itemName} • ${formatCurrency(reversingPurchase.totalCost)}` : ''}
          transactionDate={reversingPurchase ? formatDateId(reversingPurchase.date) : undefined}
          impactLines={[
            'Status pembelian akan berubah menjadi voided.',
            'Sistem membuat jurnal pembalik yang menetralkan hutang/kas, persediaan atau beban, dan pajak masukan terkait.',
            'Transaksi asli tetap tersimpan untuk kebutuhan audit, vendor tracing, dan rekonsiliasi.',
          ]}
          onConfirm={async () => {
            if (!reversingPurchase) return;
            await reversePurchase(reversingPurchase.id);
            setReversingPurchase(null);
          }}
          isSubmitting={isMutating}
        />
      </div>
    </MainLayout>
  );
}
