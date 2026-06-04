import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Plus, Package, AlertTriangle, XCircle } from 'lucide-react';
import { useProducts } from '../hooks/useProducts';
import { useCompanyProfile } from '@/features/onboarding';
import { Product, ProductFormData } from '../types';
import { AddProductModal } from '../components/AddProductModal';
import { ProductsTable } from '../components/ProductsTable';
import { useErrorToast } from '@/shared/hooks/useErrorToast';
import { PageHeader, StatCard, EmptyState } from '@/shared';

export default function Products() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const { company, error: companyError } = useCompanyProfile();
  const { products, addProduct, updateProduct, deleteProduct, error: productsError } = useProducts(company?.id);
  useErrorToast(companyError, 'Gagal memuat perusahaan');
  useErrorToast(productsError, 'Gagal memuat produk');

  const handleSubmit = (data: ProductFormData) => {
    if (!company?.id) return;
    if (editingProduct) {
      updateProduct(editingProduct.id, data);
    } else {
      addProduct(data);
    }
    setEditingProduct(null);
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setIsModalOpen(true);
  };

  const handleClose = () => {
    setIsModalOpen(false);
    setEditingProduct(null);
  };

  const totalProducts = products.length;
  const lowStockProducts = products.filter(p => p.stock < 10 && p.stock > 0).length;
  const outOfStockProducts = products.filter(p => p.stock === 0).length;

  return (
    <MainLayout>
      <div className="space-y-6">
        <PageHeader
          icon={Package}
          title="Produk"
          description="Kelola inventaris produk Anda"
          tip="Daftarkan produk beserta harga jual dan stoknya. Stok akan berkurang otomatis setiap kali Anda mencatat penjualan."
          action={<Button onClick={() => setIsModalOpen(true)} className="gap-2"><Plus className="h-4 w-4" />Tambah Produk</Button>}
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatCard icon={Package} tone="primary" label="Total Produk" value={totalProducts} hint="Produk dalam katalog" />
          <StatCard icon={AlertTriangle} tone="warning" label="Stok Rendah" value={lowStockProducts} hint="Stok di bawah 10" />
          <StatCard icon={XCircle} tone="destructive" label="Stok Habis" value={outOfStockProducts} hint="Perlu segera diisi ulang" />
        </div>

        <div className="bg-card rounded-xl border border-border p-6 shadow-[var(--shadow-card)]">
          <h2 className="text-lg font-semibold mb-4">Semua Produk</h2>
          {products.length === 0 ? (
            <EmptyState
              icon={Package}
              title="Belum ada produk"
              description="Tambahkan produk pertama Anda agar bisa langsung dipakai saat mencatat penjualan."
              action={<Button onClick={() => setIsModalOpen(true)} className="gap-2"><Plus className="h-4 w-4" />Tambah Produk</Button>}
            />
          ) : (
            <ProductsTable products={products} onEdit={handleEdit} onDelete={deleteProduct} />
          )}
        </div>
      </div>

      <AddProductModal
        isOpen={isModalOpen}
        onClose={handleClose}
        onSubmit={handleSubmit}
        editingProduct={editingProduct}
      />
    </MainLayout>
  );
}
