import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MoreVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useMemo } from 'react';

interface AccountsTableProps {
  sales: Array<{ date: string; total: number }>;
  purchases: Array<{ date: string; total: number }>;
  receivables: Array<{ amount: number; status: string }>;
}

export function AccountsTable({ sales, purchases, receivables }: AccountsTableProps) {
  const formatCurrency = (value: number) => `Rp. ${value.toLocaleString('id-ID', { minimumFractionDigits: 2 })}`;

  const accounts = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    const totalSales = sales.reduce((sum, s) => sum + s.total, 0);
    const totalPurchases = purchases.reduce((sum, p) => sum + p.total, 0);
    const totalReceivables = receivables.filter(r => r.status === 'pending').reduce((sum, r) => sum + r.amount, 0);
    
    const monthlySales = sales
      .filter(s => {
        const date = new Date(s.date);
        return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
      })
      .reduce((sum, s) => sum + s.total, 0);
    
    const monthlyPurchases = purchases
      .filter(p => {
        const date = new Date(p.date);
        return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
      })
      .reduce((sum, p) => sum + p.total, 0);
    
    const kas = totalSales - totalPurchases;
    
    return [
      { code: '1-10001', name: 'Kas', thisMonth: kas > 0 ? kas : 0, thisYear: kas > 0 ? kas : 0 },
      { code: '1-10002', name: 'Rekening Bank', thisMonth: 0, thisYear: 0 },
      { code: '1-10003', name: 'Kas di Mesin Kasir', thisMonth: 0, thisYear: 0 },
      { code: '1-10004', name: 'Giro', thisMonth: 0, thisYear: 0 },
      { code: '1-10100', name: 'Piutang Usaha', thisMonth: totalReceivables, thisYear: totalReceivables },
    ];
  }, [sales, purchases, receivables]);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base font-medium">Daftar Akun Terpantau</CardTitle>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <MoreVertical className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="py-3 text-left text-sm font-medium text-foreground">Akun</th>
                <th className="py-3 text-right text-sm font-medium text-foreground">Bulan Ini</th>
                <th className="py-3 text-right text-sm font-medium text-foreground">Tahun Ini</th>
              </tr>
            </thead>
            <tbody>
              {accounts.map((account) => (
                <tr key={account.code} className="border-b border-border/50 last:border-0">
                  <td className="py-3">
                    <span className="text-sm text-primary hover:underline cursor-pointer">
                      ({account.code}) {account.name}
                    </span>
                  </td>
                  <td className="py-3 text-right text-sm text-foreground">
                    {formatCurrency(account.thisMonth)}
                  </td>
                  <td className="py-3 text-right text-sm text-foreground">
                    {formatCurrency(account.thisYear)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
