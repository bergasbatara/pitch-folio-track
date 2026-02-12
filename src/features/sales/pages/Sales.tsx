import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Plus, DollarSign, ShoppingCart, TrendingUp } from 'lucide-react';
import { useSales } from '../hooks/useSales';
import { useProducts } from '@/features/products/hooks/useProducts';
import { useCompanyProfile } from '@/features/onboarding';
import { SaleFormData } from '../types';
import { AddSaleModal } from '../components/AddSaleModal';
import { SalesTable } from '../components/SalesTable';

export default function Sales() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { sales, addSale, deleteSale, totalRevenue, totalUnitsSold, todaysRevenue } = useSales();
  const { company } = useCompanyProfile();
  const { products, updateStock } = useProducts(company?.id);

  const handleAddSale = (data: SaleFormData, productName: string) => {
    if (!company?.id) return;
    addSale(data, productName);
    updateStock(data.productId, data.quantity);
  };

  const stats = [
    {
      label: 'Total Pendapatan',
      value: `Rp${totalRevenue.toLocaleString('id-ID')}`,
      icon: DollarSign,
      color: 'text-primary',
    },
    {
      label: 'Pendapatan Hari Ini',
      value: `Rp${todaysRevenue.toLocaleString('id-ID')}`,
      icon: TrendingUp,
      color: 'text-emerald-400',
    },
    {
      label: 'Unit Terjual',
      value: totalUnitsSold.toLocaleString('id-ID'),
      icon: ShoppingCart,
      color: 'text-blue-400',
    },
  ];

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Penjualan</h1>
            <p className="text-muted-foreground">Lacak dan kelola penjualan produk Anda</p>
          </div>
          <Button onClick={() => setIsModalOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Catat Penjualan
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="p-4 rounded-xl bg-card border border-border"
            >
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg bg-muted ${stat.color}`}>
                  <stat.icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                  <p className="text-xl font-bold text-foreground">{stat.value}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Sales Table */}
        <div className="bg-card rounded-xl border border-border p-6">
          <h2 className="text-lg font-semibold mb-4">Penjualan Terbaru</h2>
          <SalesTable sales={sales} onDelete={deleteSale} />
        </div>
      </div>

      <AddSaleModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleAddSale}
        products={products}
      />
    </MainLayout>
  );
}
