import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Plus, DollarSign, ShoppingCart, TrendingUp } from 'lucide-react';
import { useSales } from '../hooks/useSales';
import { useProducts } from '@/features/products/hooks/useProducts';
import { useCompanyProfile } from '@/features/onboarding';
import { useTaxCodes } from '@/features/taxes';
import { Sale, SaleFormData } from '../types';
import { AddSaleModal } from '../components/AddSaleModal';
import { SalesTable } from '../components/SalesTable';
import { useErrorToast } from '@/shared/hooks/useErrorToast';
import { PageHeader, StatCard, EmptyState, TransactionReversalDialog } from '@/shared';
import { formatDateId } from '@/shared/lib/date';

export default function Sales() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saleCorrection, setSaleCorrection] = useState<{ sale: Sale; action: 'return' | 'cancel' } | null>(null);
  const { company, error: companyError } = useCompanyProfile();
  const {
    sales,
    addSale,
    deleteSale,
    createSaleReturn,
    createSaleCancellation,
    totalRevenue,
    totalUnitsSold,
    todaysRevenue,
    isMutating,
    error: salesError,
  } = useSales(company?.id);
  const { products, error: productsError } = useProducts(company?.id);
  const { taxCodes, error: taxCodesError } = useTaxCodes(company?.id);
  useErrorToast(companyError, 'Gagal memuat perusahaan');
  useErrorToast(salesError, 'Gagal memuat penjualan');
  useErrorToast(productsError, 'Gagal memuat produk');
  useErrorToast(taxCodesError, 'Gagal memuat kode pajak');

  const handleAddSale = async (data: SaleFormData) => {
    if (!company?.id) return;
    await addSale(data);
  };

  const handleCreateReturn = async (sale: Sale) => {
    setSaleCorrection({ sale, action: 'return' });
  };

  const handleCreateCancellation = async (sale: Sale) => {
    setSaleCorrection({ sale, action: 'cancel' });
  };

  const correctionTitle = saleCorrection?.action === 'return' ? 'Catat Retur Penjualan' : 'Batalkan Penjualan';
  const correctionDescription = saleCorrection?.action === 'return'
    ? 'Retur dicatat sebagai transaksi koreksi terpisah agar penjualan asli tetap tersimpan di audit trail.'
    : 'Pembatalan dicatat sebagai transaksi koreksi terpisah agar penjualan asli tetap tersimpan di audit trail.';
  const correctionImpactTitle = saleCorrection?.action === 'return' ? 'Dampak retur' : 'Dampak pembatalan';
  const correctionWarning = saleCorrection?.action === 'return'
    ? 'Penjualan posted tidak dihapus. Sistem akan membuat transaksi retur terpisah untuk membalik dampak akuntansinya.'
    : 'Penjualan posted tidak dihapus. Sistem akan membuat transaksi pembatalan terpisah untuk membalik dampak akuntansinya.';
  const correctionConfirmLabel = saleCorrection?.action === 'return' ? 'Catat Retur' : 'Batalkan Penjualan';

  return (
    <MainLayout>
      <div className="space-y-6">
        <PageHeader
          icon={ShoppingCart}
          title="Penjualan"
          description="Lacak dan kelola penjualan produk Anda"
          tip="Secara default penjualan dicatat sebagai Piutang Usaha. Pilih metode tunai hanya jika pelanggan langsung membayar."
          action={<Button onClick={() => setIsModalOpen(true)} className="gap-2"><Plus className="h-4 w-4" />Catat Penjualan</Button>}
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatCard icon={DollarSign} tone="primary" label="Total Pendapatan" value={`Rp${totalRevenue.toLocaleString('id-ID')}`} hint="Akumulasi seluruh penjualan" />
          <StatCard icon={TrendingUp} tone="success" label="Pendapatan Hari Ini" value={`Rp${todaysRevenue.toLocaleString('id-ID')}`} hint="Penjualan tercatat hari ini" />
          <StatCard icon={ShoppingCart} tone="muted" label="Unit Terjual" value={totalUnitsSold.toLocaleString('id-ID')} hint="Total kuantitas produk terjual" />
        </div>

        <div className="bg-card rounded-xl border border-border p-6 shadow-[var(--shadow-card)]">
          <h2 className="text-lg font-semibold mb-4">Penjualan Terbaru</h2>
          {sales.length === 0 ? (
            <EmptyState
              icon={ShoppingCart}
              title="Belum ada penjualan"
              description="Catat penjualan pertama Anda untuk mulai melacak pendapatan usaha."
              action={<Button onClick={() => setIsModalOpen(true)} className="gap-2"><Plus className="h-4 w-4" />Catat Penjualan</Button>}
            />
          ) : (
            <SalesTable
              sales={sales}
              onDelete={deleteSale}
              onCreateReturn={handleCreateReturn}
              onCreateCancellation={handleCreateCancellation}
            />
          )}
        </div>
      </div>

      <AddSaleModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleAddSale}
        products={products}
        taxCodes={taxCodes}
      />
      <TransactionReversalDialog
        open={!!saleCorrection}
        onOpenChange={(open) => !open && setSaleCorrection(null)}
        title={correctionTitle}
        description={correctionDescription}
        transactionLabel={saleCorrection ? `${saleCorrection.sale.productName} • Rp${saleCorrection.sale.totalPrice.toLocaleString('id-ID')}` : ''}
        transactionDate={saleCorrection ? formatDateId(saleCorrection.sale.soldAt) : undefined}
        impactLines={[
          'Transaksi asli tetap posted dan tidak ditimpa.',
          'Sistem membuat event koreksi baru yang membalik piutang/kas, pendapatan, dan pajak keluaran terkait.',
          'Stok barang akan dikembalikan sesuai kuantitas transaksi asli untuk menjaga jejak audit dan rekonsiliasi.',
        ]}
        onConfirm={async () => {
          if (!saleCorrection) return;
          if (saleCorrection.action === 'return') {
            await createSaleReturn(saleCorrection.sale.id);
          } else {
            await createSaleCancellation(saleCorrection.sale.id);
          }
          setSaleCorrection(null);
        }}
        isSubmitting={isMutating}
        confirmLabel={correctionConfirmLabel}
        warningText={correctionWarning}
        impactTitle={correctionImpactTitle}
      />
    </MainLayout>
  );
}
