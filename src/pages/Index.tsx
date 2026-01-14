import { DollarSign, ShoppingCart, Package, TrendingUp } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { useSales } from '@/hooks/useSales';
import { useProducts } from '@/hooks/useProducts';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

function QuickStat({ icon: Icon, label, value, color }: { icon: any; label: string; value: string; color: string }) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-border bg-card/50 px-4 py-3">
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
        <h1 className="page-title">Dashboard</h1>
        <p className="page-description">Track your retail business metrics at a glance</p>
      </div>

      {/* Quick Stats */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <QuickStat
          icon={DollarSign}
          label="Total Revenue"
          value={`$${totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
          color="hsl(160 84% 39%)"
        />
        <QuickStat
          icon={TrendingUp}
          label="Today's Revenue"
          value={`$${todaysRevenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
          color="hsl(142 76% 36%)"
        />
        <QuickStat
          icon={ShoppingCart}
          label="Units Sold"
          value={totalUnitsSold.toLocaleString()}
          color="hsl(200 80% 50%)"
        />
        <QuickStat
          icon={Package}
          label="Products"
          value={`${totalProducts} (${lowStockCount} low stock)`}
          color="hsl(270 70% 60%)"
        />
      </div>

      {/* Quick Actions */}
      <div className="mb-8">
        <h2 className="text-lg font-medium text-foreground mb-4">Quick Actions</h2>
        <div className="flex gap-4">
          <Link to="/sales">
            <Button className="gap-2">
              <ShoppingCart className="h-4 w-4" />
              Record a Sale
            </Button>
          </Link>
          <Link to="/products">
            <Button variant="outline" className="gap-2">
              <Package className="h-4 w-4" />
              Manage Products
            </Button>
          </Link>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Today's Summary */}
        <div className="rounded-xl border border-border bg-card p-6">
          <h2 className="text-lg font-medium text-foreground mb-4">Today's Summary</h2>
          <div className="space-y-4">
            <div className="flex justify-between items-center py-2 border-b border-border">
              <span className="text-muted-foreground">Sales Count</span>
              <span className="font-semibold">{todaysSales.length}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-border">
              <span className="text-muted-foreground">Revenue</span>
              <span className="font-semibold text-primary">
                ${todaysRevenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-muted-foreground">Avg Sale Value</span>
              <span className="font-semibold">
                ${avgSaleValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </div>

        {/* Recent Sales */}
        <div className="rounded-xl border border-border bg-card p-6">
          <h2 className="text-lg font-medium text-foreground mb-4">Recent Sales</h2>
          {sales.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No sales recorded yet</p>
          ) : (
            <div className="space-y-3">
              {sales.slice(0, 5).map((sale) => (
                <div key={sale.id} className="flex justify-between items-center py-2 border-b border-border last:border-0">
                  <div>
                    <p className="font-medium">{sale.productName}</p>
                    <p className="text-sm text-muted-foreground">Qty: {sale.quantity}</p>
                  </div>
                  <span className="font-semibold text-primary">
                    ${sale.totalPrice.toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          )}
          {sales.length > 5 && (
            <Link to="/sales" className="block mt-4 text-center text-sm text-primary hover:underline">
              View all sales →
            </Link>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
