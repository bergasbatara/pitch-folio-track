import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { Button } from '@/components/ui/button';
import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { format, subMonths, startOfMonth, endOfMonth, isWithinInterval, parseISO } from 'date-fns';
import { id } from 'date-fns/locale';

interface ReceivablesChartProps {
  receivables: Array<{ date: string; amount: number; status: string }>;
}

export function ReceivablesChart({ receivables }: ReceivablesChartProps) {
  const [period, setPeriod] = useState('bulanan');

  const chartData = useMemo(() => {
    const months = [];
    const now = new Date();
    
    for (let i = 5; i >= 0; i--) {
      const monthDate = subMonths(now, i);
      const start = startOfMonth(monthDate);
      const end = endOfMonth(monthDate);
      
      const monthReceivables = receivables
        .filter(r => {
          const date = parseISO(r.date);
          return isWithinInterval(date, { start, end }) && r.status === 'pending';
        })
        .reduce((sum, r) => sum + r.amount, 0);
      
      months.push({
        month: format(monthDate, 'MMM', { locale: id }),
        amount: monthReceivables,
      });
    }
    
    return months;
  }, [receivables]);

  const hasData = chartData.some(d => d.amount > 0);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base font-medium">Penjualan Terhutang</CardTitle>
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-[100px] h-8 text-sm text-primary border-0 bg-transparent">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="bulanan">Bulanan</SelectItem>
            <SelectItem value="mingguan">Mingguan</SelectItem>
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent>
        <div className="h-[200px] flex items-center justify-center">
          {hasData ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <XAxis 
                  dataKey="month" 
                  tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis hide />
                <Tooltip 
                  formatter={(value: number) => `Rp ${value.toLocaleString('id-ID')}`}
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    fontSize: '12px'
                  }}
                />
                <Bar dataKey="amount" fill="hsl(210 40% 85%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-center">
              <div className="space-y-2 mb-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="h-3 bg-muted rounded" style={{ width: `${60 + i * 10}%`, marginLeft: 'auto', marginRight: 'auto' }} />
                ))}
              </div>
              <Link to="/sales">
                <Button className="bg-primary hover:bg-primary/90">
                  Buat penjualan baru
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
