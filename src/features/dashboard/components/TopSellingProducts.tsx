import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { subMonths, startOfMonth, endOfMonth, isWithinInterval, parseISO } from 'date-fns';

interface TopSellingProductsProps {
  sales: Array<{ 
    date: string; 
    productName: string; 
    quantity: number; 
    total: number;
  }>;
}

export function TopSellingProducts({ sales }: TopSellingProductsProps) {
  const [period, setPeriod] = useState('bulan-lalu');

  const topProducts = useMemo(() => {
    const now = new Date();
    const start = startOfMonth(subMonths(now, period === 'bulan-lalu' ? 1 : 0));
    const end = endOfMonth(subMonths(now, period === 'bulan-lalu' ? 1 : 0));
    
    const filteredSales = sales.filter(s => {
      const date = parseISO(s.date);
      return isWithinInterval(date, { start, end });
    });
    
    const productTotals: Record<string, { quantity: number; total: number }> = {};
    filteredSales.forEach(s => {
      if (!productTotals[s.productName]) {
        productTotals[s.productName] = { quantity: 0, total: 0 };
      }
      productTotals[s.productName].quantity += s.quantity;
      productTotals[s.productName].total += s.total;
    });
    
    return Object.entries(productTotals)
      .sort((a, b) => b[1].total - a[1].total)
      .slice(0, 5)
      .map(([name, data]) => ({ name, ...data }));
  }, [sales, period]);

  const hasData = topProducts.length > 0;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base font-medium">Produk Terlaris</CardTitle>
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-[110px] h-8 text-sm text-primary border-0 bg-transparent">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="bulan-lalu">Bulan lalu</SelectItem>
            <SelectItem value="bulan-ini">Bulan ini</SelectItem>
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent>
        <div className="min-h-[200px] flex items-center justify-center">
          {hasData ? (
            <div className="w-full space-y-3">
              {topProducts.map((product, index) => (
                <div key={index} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                  <div className="flex items-center gap-3">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary">
                      {index + 1}
                    </span>
                    <span className="text-sm font-medium">{product.name}</span>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">Rp {product.total.toLocaleString('id-ID')}</p>
                    <p className="text-xs text-muted-foreground">{product.quantity} unit</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-4">
                Tidak ada transaksi pada periode ini.
              </p>
              <Link to="/sales">
                <Button className="bg-primary hover:bg-primary/90">
                  Buat penjualan
                </Button>
              </Link>
            </div>
          )}
        </div>
        <p className="text-xs text-muted-foreground text-right mt-2">
          Diperbarui baru saja
        </p>
      </CardContent>
    </Card>
  );
}
