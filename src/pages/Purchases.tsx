import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { PurchasesTable } from '@/components/purchases/PurchasesTable';
import { AddPurchaseModal } from '@/components/purchases/AddPurchaseModal';
import { usePurchases, usePurchaseCategories } from '@/data/hooks/usePurchases';
import { Purchase } from '@/data/types/purchases';
import { Plus, TrendingDown } from 'lucide-react';

export default function Purchases() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPurchase, setEditingPurchase] = useState<Purchase | null>(null);
  
  const { purchases, addPurchase, updatePurchase, deletePurchase, getTotalSpend } = usePurchases();
  const { categories, addCategory } = usePurchaseCategories();

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

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(value);
  };

  return (
    <MainLayout>
      <div className="animate-fade-in">
        {/* Header */}
        <div className="page-header flex items-center justify-between">
          <div>
            <h1 className="page-title">Pembelian</h1>
            <p className="page-description">Lacak pengeluaran dan persediaan bisnis Anda</p>
          </div>
          <button onClick={() => setIsModalOpen(true)} className="btn-primary">
            <Plus className="h-4 w-4" />
            Tambah Pembelian
          </button>
        </div>

        {/* Summary Card */}
        <div className="mb-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <div className="metric-card">
            <div className="metric-card-glow" />
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-destructive/10">
                <TrendingDown className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <p className="stat-label">Total Pengeluaran</p>
                <p className="stat-value">{formatCurrency(getTotalSpend())}</p>
              </div>
            </div>
          </div>
          <div className="metric-card">
            <div className="metric-card-glow" />
            <div>
              <p className="stat-label">Total Pembelian</p>
              <p className="stat-value">{purchases.length}</p>
            </div>
          </div>
          <div className="metric-card">
            <div className="metric-card-glow" />
            <div>
              <p className="stat-label">Kategori</p>
              <p className="stat-value">{categories.length}</p>
            </div>
          </div>
        </div>

        {/* Purchases Table */}
        <PurchasesTable
          purchases={purchases}
          categories={categories}
          onEdit={handleEdit}
          onDelete={deletePurchase}
        />

        {/* Add/Edit Modal */}
        <AddPurchaseModal
          open={isModalOpen}
          onOpenChange={handleCloseModal}
          categories={categories}
          onAddCategory={addCategory}
          onAddPurchase={addPurchase}
          editingPurchase={editingPurchase}
          onUpdatePurchase={updatePurchase}
        />
      </div>
    </MainLayout>
  );
}
