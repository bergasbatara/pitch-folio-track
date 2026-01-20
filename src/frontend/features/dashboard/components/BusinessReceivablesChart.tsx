import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { Button } from '@/components/ui/button';
import { MoreVertical } from 'lucide-react';
import { useState, useMemo } from 'react';
import { format, subMonths, startOfMonth, endOfMonth, isWithinInterval, parseISO } from 'date-fns';
import { id } from 'date-fns/locale';

interface BusinessReceivablesChartProps {
  receivables: Array<{ date: string; amount: number; status: string }>;
}

export function BusinessReceivablesChart({ receivables }: BusinessReceivablesChartProps) {
  const [period, setPeriod] = useState('bulanan');

  const chartData = useMemo(() => {
    const months = [];
    const now = new Date();
    
    for (let i = 11; i >= 0; i--) {
      const monthDate = subMonths(now, i);
      const start = startOfMonth(monthDate);
      const end = endOfMonth(monthDate);
      
      const monthReceivables = receivables
        .filter(r => {
          const date = parseISO(r.date);
          return isWithinInterval(date, { start, end });
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
        <CardTitle className="text-base font-medium">Piutang Usaha</CardTitle>
        <div className="flex items-center gap-1">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-[100px] h-8 text-sm text-primary border-0 bg-transparent">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="bulanan">Bulanan</SelectItem>
              <SelectItem value="mingguan">Mingguan</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[200px] flex items-center justify-center">
          {hasData ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
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
                <Line 
                  type="monotone" 
                  dataKey="amount" 
                  stroke="hsl(200 80% 55%)" 
                  strokeWidth={2}
                  dot={{ fill: 'hsl(200 80% 55%)', strokeWidth: 0, r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-center">
              <div className="space-y-2 mb-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-3 bg-muted rounded" style={{ width: `${50 + i * 15}%`, marginLeft: 'auto', marginRight: 'auto' }} />
                ))}
              </div>
              <Button className="bg-primary hover:bg-primary/90">
                Pilih akun
              </Button>
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
