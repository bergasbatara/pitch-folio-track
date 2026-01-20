import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { Button } from '@/components/ui/button';
import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { subMonths, startOfMonth, endOfMonth, isWithinInterval, parseISO } from 'date-fns';

interface OperationalCostsChartProps {
  purchases: Array<{ date: string; total: number; category: string }>;
}

export function OperationalCostsChart({ purchases }: OperationalCostsChartProps) {
  const [period, setPeriod] = useState('bulanan');

  const { chartData, categories, totalCosts } = useMemo(() => {
    const now = new Date();
    const start = startOfMonth(subMonths(now, 0));
    const end = endOfMonth(now);
    
    const monthlyPurchases = purchases.filter(p => {
      const date = parseISO(p.date);
      return isWithinInterval(date, { start, end });
    });
    
    const categoryTotals: Record<string, number> = {};
    monthlyPurchases.forEach(p => {
      const cat = p.category || 'Lainnya';
      categoryTotals[cat] = (categoryTotals[cat] || 0) + p.total;
    });
    
    const colors = [
      'hsl(200 80% 55%)',
      'hsl(142 76% 45%)',
      'hsl(38 92% 50%)',
      'hsl(270 70% 60%)',
      'hsl(0 72% 51%)',
    ];
    
    const categoriesArray = Object.entries(categoryTotals)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, value], index) => ({
        name,
        value,
        color: colors[index % colors.length],
      }));
    
    const total = categoriesArray.reduce((sum, c) => sum + c.value, 0);
    
    return {
      chartData: categoriesArray.length > 0 ? categoriesArray : [{ name: 'Tidak ada data', value: 1, color: 'hsl(var(--muted))' }],
      categories: categoriesArray,
      totalCosts: total,
    };
  }, [purchases]);

  const hasData = totalCosts > 0;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base font-medium">Biaya Operasional</CardTitle>
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
        <div className="flex items-center gap-4">
          <div className="relative h-[160px] w-[160px] flex-shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={70}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            {!hasData && (
              <div className="absolute inset-0 flex items-center justify-center">
                <Link to="/purchases">
                  <Button size="sm" className="bg-primary hover:bg-primary/90 text-xs">
                    Buat biaya baru
                  </Button>
                </Link>
              </div>
            )}
          </div>
          <div className="flex-1 space-y-2">
            {hasData ? (
              categories.map((cat, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div 
                    className="h-2 flex-1 rounded-full bg-muted overflow-hidden"
                  >
                    <div 
                      className="h-full rounded-full transition-all"
                      style={{ 
                        width: `${(cat.value / totalCosts) * 100}%`,
                        backgroundColor: cat.color 
                      }}
                    />
                  </div>
                  <span className="text-xs text-muted-foreground w-20 truncate">{cat.name}</span>
                </div>
              ))
            ) : (
              [1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-3 bg-muted rounded" style={{ width: `${100 - i * 10}%` }} />
              ))
            )}
          </div>
        </div>
        <p className="text-xs text-muted-foreground text-right mt-4">
          Diperbarui baru saja
        </p>
      </CardContent>
    </Card>
  );
}
