import { DollarSign, ShoppingCart, Package, TrendingUp } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { useSales, useProducts } from '@/data';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { SalesChart } from '@/components/charts/SalesChart';
import { TopProductsChart } from '@/components/charts/TopProductsChart';

function QuickStat({ icon: Icon, label, value, color }: { icon: any; label: string; value: string; color: string }) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-border bg-card/50 px-4 py-3 animate-fade-in">
      <div
        className="flex h-10 w-10 items-center justify-center rounded-lg"
        style={{ backgroundColor: `${color}20` }}
      >
        <Icon className="h-5 w-5" style={{ color }} />
      </div>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-lg font-semibold text-foreground">{value}</p>
      </div>
    </div>
  );
}

export default function Index() {
  const { sales, totalRevenue, totalUnitsSold, todaysRevenue, todaysSales } = useSales();
  const { products } = useProducts();

  const totalProducts = products.length;
  const lowStockCount = products.filter(p => p.stock < 10).length;
  const avgSaleValue = sales.length > 0 ? totalRevenue / sales.length : 0;

  return (
    <MainLayout>
      {/* Header */}
      <div className="page-header">
        <h1 className="page-title">Dasbor</h1>
        <p className="page-description">Pantau metrik bisnis retail Anda secara ringkas</p>
      </div>

      {/* Quick Stats */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <QuickStat
          icon={DollarSign}
          label="Total Pendapatan"
          value={`Rp${totalRevenue.toLocaleString('id-ID')}`}
          color="hsl(160 84% 39%)"
        />
        <QuickStat
          icon={TrendingUp}
          label="Pendapatan Hari Ini"
          value={`Rp${todaysRevenue.toLocaleString('id-ID')}`}
          color="hsl(142 76% 36%)"
        />
        <QuickStat
          icon={ShoppingCart}
          label="Unit Terjual"
          value={totalUnitsSold.toLocaleString('id-ID')}
          color="hsl(200 80% 50%)"
        />
        <QuickStat
          icon={Package}
          label="Produk"
          value={`${totalProducts} (${lowStockCount} stok rendah)`}
          color="hsl(270 70% 60%)"
        />
      </div>

      {/* Quick Actions */}
      <div className="mb-8">
        <h2 className="text-lg font-medium text-foreground mb-4">Aksi Cepat</h2>
        <div className="flex gap-4">
          <Link to="/sales">
            <Button className="gap-2">
              <ShoppingCart className="h-4 w-4" />
              Catat Penjualan
            </Button>
          </Link>
          <Link to="/products">
            <Button variant="outline" className="gap-2">
              <Package className="h-4 w-4" />
              Kelola Produk
            </Button>
          </Link>
        </div>
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2 mb-8">
        <SalesChart sales={sales} days={7} />
        <TopProductsChart sales={sales} limit={5} />
      </div>

      {/* Recent Activity */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Today's Summary */}
        <div className="rounded-xl border border-border bg-card p-6">
          <h2 className="text-lg font-medium text-foreground mb-4">Ringkasan Hari Ini</h2>
          <div className="space-y-4">
            <div className="flex justify-between items-center py-2 border-b border-border">
              <span className="text-muted-foreground">Jumlah Penjualan</span>
              <span className="font-semibold">{todaysSales.length}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-border">
              <span className="text-muted-foreground">Pendapatan</span>
              <span className="font-semibold text-primary">
                Rp{todaysRevenue.toLocaleString('id-ID')}
              </span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-muted-foreground">Rata-rata Nilai Penjualan</span>
              <span className="font-semibold">
                Rp{avgSaleValue.toLocaleString('id-ID')}
              </span>
            </div>
          </div>
        </div>

        {/* Recent Sales */}
        <div className="rounded-xl border border-border bg-card p-6">
          <h2 className="text-lg font-medium text-foreground mb-4">Penjualan Terakhir</h2>
          {sales.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">Belum ada penjualan tercatat</p>
          ) : (
            <div className="space-y-3">
              {sales.slice(0, 5).map((sale) => (
                <div key={sale.id} className="flex justify-between items-center py-2 border-b border-border last:border-0">
                  <div>
                    <p className="font-medium">{sale.productName}</p>
                    <p className="text-sm text-muted-foreground">Jml: {sale.quantity}</p>
                  </div>
                  <span className="font-semibold text-primary">
                    Rp{sale.totalPrice.toLocaleString('id-ID')}
                  </span>
                </div>
              ))}
            </div>
          )}
          {sales.length > 5 && (
            <Link to="/sales" className="block mt-4 text-center text-sm text-primary hover:underline">
              Lihat semua penjualan →
            </Link>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
