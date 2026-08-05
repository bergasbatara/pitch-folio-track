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
  const [purchaseCorrection, setPurchaseCorrection] = useState<{ purchase: Purchase; action: 'return' | 'cancel' } | null>(null);
  const { company, error: companyError } = useCompanyProfile();

  const {
    purchases,
    addPurchase,
    updatePurchase,
    deletePurchase,
    createPurchaseReturn,
    createPurchaseCancellation,
    getTotalSpend,
    isMutating,
    error: purchasesError,
  } = usePurchases(company?.id);
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

  const handleCreateReturn = async (purchase: Purchase) => {
    setPurchaseCorrection({ purchase, action: 'return' });
  };

  const handleCreateCancellation = async (purchase: Purchase) => {
    setPurchaseCorrection({ purchase, action: 'cancel' });
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
              onCreateReturn={handleCreateReturn}
              onCreateCancellation={handleCreateCancellation}
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
          open={!!purchaseCorrection}
          onOpenChange={(open) => !open && setPurchaseCorrection(null)}
          title={purchaseCorrection?.action === 'return' ? 'Catat Retur Pembelian' : 'Batalkan Pembelian'}
          description={
            purchaseCorrection?.action === 'return'
              ? 'Retur pembelian dicatat sebagai transaksi koreksi terpisah agar pembelian asli tetap tersimpan di audit trail.'
              : 'Pembatalan pembelian dicatat sebagai transaksi koreksi terpisah agar pembelian asli tetap tersimpan di audit trail.'
          }
          transactionLabel={purchaseCorrection ? `${purchaseCorrection.purchase.itemName} • ${formatCurrency(purchaseCorrection.purchase.totalCost)}` : ''}
          transactionDate={purchaseCorrection ? formatDateId(purchaseCorrection.purchase.date) : undefined}
          impactLines={[
            'Transaksi asli tetap posted dan tidak ditimpa.',
            'Sistem membuat event koreksi baru yang membalik hutang/kas, persediaan atau beban, dan pajak masukan terkait.',
            'Stok barang akan dikurangi kembali sesuai kuantitas transaksi asli agar audit trail dan rekonsiliasi tetap rapi.',
          ]}
          onConfirm={async () => {
            if (!purchaseCorrection) return;
            if (purchaseCorrection.action === 'return') {
              await createPurchaseReturn(purchaseCorrection.purchase.id);
            } else {
              await createPurchaseCancellation(purchaseCorrection.purchase.id);
            }
            setPurchaseCorrection(null);
          }}
          isSubmitting={isMutating}
          confirmLabel={purchaseCorrection?.action === 'return' ? 'Catat Retur' : 'Batalkan Pembelian'}
          warningText={
            purchaseCorrection?.action === 'return'
              ? 'Pembelian posted tidak dihapus. Sistem akan membuat transaksi retur terpisah untuk membalik dampak akuntansinya.'
              : 'Pembelian posted tidak dihapus. Sistem akan membuat transaksi pembatalan terpisah untuk membalik dampak akuntansinya.'
          }
          impactTitle={purchaseCorrection?.action === 'return' ? 'Dampak retur' : 'Dampak pembatalan'}
        />
      </div>
    </MainLayout>
  );
}
