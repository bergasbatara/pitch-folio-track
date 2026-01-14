import { useMemo } from 'react';
import { Sale } from '@/types/sales';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format, subDays, startOfDay, eachDayOfInterval } from 'date-fns';

interface SalesChartProps {
  sales: Sale[];
  days?: number;
}

export function SalesChart({ sales, days = 7 }: SalesChartProps) {
  const chartData = useMemo(() => {
    const today = startOfDay(new Date());
    const startDate = subDays(today, days - 1);
    
    const dateRange = eachDayOfInterval({ start: startDate, end: today });
    
    return dateRange.map(date => {
      const dayStart = startOfDay(date);
      const dayEnd = new Date(dayStart);
      dayEnd.setHours(23, 59, 59, 999);
      
      const daySales = sales.filter(sale => {
        const saleDate = new Date(sale.soldAt);
        return saleDate >= dayStart && saleDate <= dayEnd;
      });
      
      const revenue = daySales.reduce((sum, sale) => sum + sale.totalPrice, 0);
      const units = daySales.reduce((sum, sale) => sum + sale.quantity, 0);
      
      return {
        date: format(date, 'MMM d'),
        revenue,
        units,
        salesCount: daySales.length,
      };
    });
  }, [sales, days]);

  const totalRevenue = chartData.reduce((sum, day) => sum + day.revenue, 0);
  const avgDailyRevenue = totalRevenue / days;

  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-medium text-foreground">Revenue Trend</h2>
          <p className="text-sm text-muted-foreground">Last {days} days</p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-primary">
            ${totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </p>
          <p className="text-sm text-muted-foreground">
            Avg: ${avgDailyRevenue.toFixed(2)}/day
          </p>
        </div>
      </div>
      
      <div className="h-[250px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(160 84% 39%)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(160 84% 39%)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(215 20% 20%)" />
            <XAxis 
              dataKey="date" 
              stroke="hsl(215 20% 55%)" 
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <YAxis 
              stroke="hsl(215 20% 55%)" 
              fontSize={12}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => `$${value}`}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'hsl(222 47% 11%)', 
                border: '1px solid hsl(215 20% 20%)',
                borderRadius: '8px',
                color: 'hsl(210 40% 98%)'
              }}
              formatter={(value: number) => [`$${value.toFixed(2)}`, 'Revenue']}
            />
            <Area 
              type="monotone" 
              dataKey="revenue" 
              stroke="hsl(160 84% 39%)" 
              strokeWidth={2}
              fill="url(#revenueGradient)" 
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
