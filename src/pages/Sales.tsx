import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Plus, DollarSign, ShoppingCart, TrendingUp } from 'lucide-react';
import { useSales } from '@/hooks/useSales';
import { useProducts } from '@/hooks/useProducts';
import { AddSaleModal } from '@/components/sales/AddSaleModal';
import { SalesTable } from '@/components/sales/SalesTable';
import { SaleFormData } from '@/types/sales';

export default function Sales() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { sales, addSale, deleteSale, totalRevenue, totalUnitsSold, todaysRevenue } = useSales();
  const { products, updateStock } = useProducts();

  const handleAddSale = (data: SaleFormData, productName: string) => {
    addSale(data, productName);
    updateStock(data.productId, data.quantity);
  };

  const stats = [
    {
      label: 'Total Revenue',
      value: `$${totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
      icon: DollarSign,
      color: 'text-primary',
    },
    {
      label: "Today's Revenue",
      value: `$${todaysRevenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
      icon: TrendingUp,
      color: 'text-emerald-400',
    },
    {
      label: 'Units Sold',
      value: totalUnitsSold.toLocaleString(),
      icon: ShoppingCart,
      color: 'text-blue-400',
    },
  ];

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Sales</h1>
            <p className="text-muted-foreground">Track and manage your product sales</p>
          </div>
          <Button onClick={() => setIsModalOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Record Sale
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
          <h2 className="text-lg font-semibold mb-4">Recent Sales</h2>
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
