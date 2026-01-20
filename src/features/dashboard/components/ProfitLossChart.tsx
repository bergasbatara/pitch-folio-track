import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { CalendarDays } from 'lucide-react';
import { useState, useMemo } from 'react';
import { format, subMonths, startOfMonth, endOfMonth, isWithinInterval, parseISO } from 'date-fns';
import { id } from 'date-fns/locale';

interface ProfitLossChartProps {
  sales: Array<{ date: string; total: number }>;
  purchases: Array<{ date: string; total: number }>;
}

export function ProfitLossChart({ sales, purchases }: ProfitLossChartProps) {
  const [period, setPeriod] = useState('bulanan');

  const chartData = useMemo(() => {
    const months = [];
    const now = new Date();
    
    for (let i = 11; i >= 0; i--) {
      const monthDate = subMonths(now, i);
      const start = startOfMonth(monthDate);
      const end = endOfMonth(monthDate);
      
      const monthSales = sales
        .filter(s => {
          const date = parseISO(s.date);
          return isWithinInterval(date, { start, end });
        })
        .reduce((sum, s) => sum + s.total, 0);
        
      const monthPurchases = purchases
        .filter(p => {
          const date = parseISO(p.date);
          return isWithinInterval(date, { start, end });
        })
        .reduce((sum, p) => sum + p.total, 0);
      
      months.push({
        month: format(monthDate, 'MMM yy', { locale: id }),
        pemasukan: monthSales,
        biaya: monthPurchases,
        profit: monthSales - monthPurchases,
      });
    }
    
    return months;
  }, [sales, purchases]);

  const formatValue = (value: number) => {
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `${(value / 1000).toFixed(0)}k`;
    return value.toString();
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base font-medium">Laba Rugi</CardTitle>
        <div className="flex items-center gap-2">
          <CalendarDays className="h-4 w-4 text-muted-foreground" />
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-[100px] h-8 text-sm text-primary border-0 bg-transparent">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="bulanan">Bulanan</SelectItem>
              <SelectItem value="mingguan">Mingguan</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis 
                dataKey="month" 
                tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                axisLine={{ stroke: 'hsl(var(--border))' }}
              />
              <YAxis 
                tickFormatter={formatValue}
                tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                axisLine={{ stroke: 'hsl(var(--border))' }}
              />
              <Tooltip 
                formatter={(value: number) => `Rp ${value.toLocaleString('id-ID')}`}
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--card))', 
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  fontSize: '12px'
                }}
              />
              <Legend 
                wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }}
                formatter={(value) => {
                  const labels: Record<string, string> = {
                    pemasukan: 'Pemasukan',
                    biaya: 'Biaya',
                    profit: 'Net Profit'
                  };
                  return labels[value] || value;
                }}
              />
              <Bar dataKey="pemasukan" fill="hsl(142 76% 45%)" radius={[2, 2, 0, 0]} />
              <Bar dataKey="biaya" fill="hsl(200 80% 55%)" radius={[2, 2, 0, 0]} />
              <Line 
                type="monotone" 
                dataKey="profit" 
                stroke="hsl(var(--foreground))" 
                strokeWidth={2}
                dot={{ fill: 'hsl(var(--foreground))', strokeWidth: 0, r: 3 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
        <p className="text-xs text-muted-foreground text-right mt-2">
          Diperbarui baru saja
        </p>
      </CardContent>
    </Card>
  );
}
