import { useMemo } from 'react';
import { Sale } from '../types';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format, subDays, startOfDay, eachDayOfInterval } from 'date-fns';
import { id } from 'date-fns/locale';
import { parseApiDateToLocalDate } from '@/shared/lib/date';

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
        const saleDate = parseApiDateToLocalDate(sale.soldAt);
        return saleDate >= dayStart && saleDate <= dayEnd;
      });
      
      const revenue = daySales.reduce((sum, sale) => sum + sale.totalPrice, 0);
      const units = daySales.reduce((sum, sale) => sum + sale.quantity, 0);
      
      return {
        date: format(date, 'd MMM', { locale: id }),
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
          <h2 className="text-lg font-medium text-foreground">Tren Pendapatan</h2>
          <p className="text-sm text-muted-foreground">{days} hari terakhir</p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-primary">
            Rp{totalRevenue.toLocaleString('id-ID')}
          </p>
          <p className="text-sm text-muted-foreground">
            Rata-rata: Rp{Math.round(avgDailyRevenue).toLocaleString('id-ID')}/hari
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
              tickFormatter={(value) => `Rp${value.toLocaleString('id-ID')}`}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'hsl(222 47% 11%)', 
                border: '1px solid hsl(215 20% 20%)',
                borderRadius: '8px',
                color: 'hsl(210 40% 98%)'
              }}
              formatter={(value: number) => [`Rp${value.toLocaleString('id-ID')}`, 'Pendapatan']}
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
