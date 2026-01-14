import { useMemo } from 'react';
import { Sale } from '@/types/sales';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface TopProductsChartProps {
  sales: Sale[];
  limit?: number;
}

export function TopProductsChart({ sales, limit = 5 }: TopProductsChartProps) {
  const chartData = useMemo(() => {
    const productMap = new Map<string, { name: string; revenue: number; units: number }>();
    
    sales.forEach(sale => {
      const existing = productMap.get(sale.productId);
      if (existing) {
        existing.revenue += sale.totalPrice;
        existing.units += sale.quantity;
      } else {
        productMap.set(sale.productId, {
          name: sale.productName,
          revenue: sale.totalPrice,
          units: sale.quantity,
        });
      }
    });
    
    return Array.from(productMap.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, limit);
  }, [sales, limit]);

  if (chartData.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card p-6">
        <h2 className="text-lg font-medium text-foreground mb-4">Top Products</h2>
        <p className="text-muted-foreground text-center py-8">No sales data yet</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <div className="mb-6">
        <h2 className="text-lg font-medium text-foreground">Top Products</h2>
        <p className="text-sm text-muted-foreground">By revenue</p>
      </div>
      
      <div className="h-[250px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} layout="vertical" margin={{ top: 0, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(215 20% 20%)" horizontal={false} />
            <XAxis 
              type="number"
              stroke="hsl(215 20% 55%)" 
              fontSize={12}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => `$${value}`}
            />
            <YAxis 
              type="category"
              dataKey="name" 
              stroke="hsl(215 20% 55%)" 
              fontSize={12}
              tickLine={false}
              axisLine={false}
              width={100}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'hsl(222 47% 11%)', 
                border: '1px solid hsl(215 20% 20%)',
                borderRadius: '8px',
                color: 'hsl(210 40% 98%)'
              }}
              formatter={(value: number, name: string) => [
                name === 'revenue' ? `$${value.toFixed(2)}` : value,
                name === 'revenue' ? 'Revenue' : 'Units'
              ]}
            />
            <Bar 
              dataKey="revenue" 
              fill="hsl(160 84% 39%)" 
              radius={[0, 4, 4, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
