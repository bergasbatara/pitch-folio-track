import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid } from 'recharts';
import { MoreVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState, useMemo } from 'react';
import { format, subMonths, startOfMonth, endOfMonth, isWithinInterval, parseISO } from 'date-fns';
import { id } from 'date-fns/locale';

interface CashChartProps {
  sales: Array<{ date: string; total: number }>;
  purchases: Array<{ date: string; total: number }>;
}

export function CashChart({ sales, purchases }: CashChartProps) {
  const [period, setPeriod] = useState('bulanan');

  const { chartData, bankBalance, journalBalance } = useMemo(() => {
    const months = [];
    const now = new Date();
    let runningBalance = 0;
    
    for (let i = 5; i >= 0; i--) {
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
      
      runningBalance += (monthSales - monthPurchases);
      
      months.push({
        month: format(monthDate, 'MMM yy', { locale: id }),
        balance: runningBalance,
      });
    }
    
    return {
      chartData: months,
      bankBalance: 0,
      journalBalance: runningBalance,
    };
  }, [sales, purchases]);

  const formatValue = (value: number) => {
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `${(value / 1000).toFixed(0)}k`;
    return value.toString();
  };

  const formatCurrency = (value: number) => `Rp. ${value.toLocaleString('id-ID', { minimumFractionDigits: 2 })}`;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base font-medium">Kas</CardTitle>
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
        <div className="flex gap-8 mb-4">
          <div>
            <p className="text-xs text-muted-foreground">Saldo di Bank</p>
            <p className="text-sm font-medium">{formatCurrency(bankBalance)}</p>
          </div>
          <div className="border-l border-border pl-8">
            <p className="text-xs text-muted-foreground">Saldo di Jurnal</p>
            <p className="text-sm font-medium">{formatCurrency(journalBalance)}</p>
          </div>
        </div>
        <p className="text-xs text-primary mb-4 cursor-pointer hover:underline">
          Rekonsiliasi 0 Transaksi
        </p>
        <div className="h-[150px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
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
              <Line 
                type="monotone" 
                dataKey="balance" 
                stroke="hsl(var(--foreground))" 
                strokeWidth={2}
                dot={{ fill: 'hsl(var(--foreground))', strokeWidth: 0, r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <p className="text-xs text-muted-foreground text-right mt-2">
          Diperbarui baru saja
        </p>
      </CardContent>
    </Card>
  );
}
