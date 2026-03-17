import { useEffect, useMemo, useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Download, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { useCompanyProfile } from '@/features/onboarding';
import { cn } from '@/lib/utils';
import jsPDF from 'jspdf';
import { useToast } from '@/components/ui/use-toast';

const formatCurrency = (value: number) => {
  return `Rp ${value.toLocaleString('id-ID')}`;
};

type DailyReport = {
  date: string;
  totals: {
    revenue: number;
    expense: number;
    netProfit: number;
    cashIn: number;
    cashOut: number;
    netCash: number;
    receivableChange: number;
    payableChange: number;
  };
  byType: Record<string, number>;
  accounts: Array<{
    id: string;
    code: string;
    name: string;
    type: string;
    normalBalance: string;
    debit: number;
    credit: number;
    net: number;
  }>;
};

export default function FinancialStatements() {
  const [date, setDate] = useState<Date>(new Date());
  const { company } = useCompanyProfile();
  const [report, setReport] = useState<DailyReport | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const accessToken = useMemo(() => localStorage.getItem('auth_access_token'), []);

  useEffect(() => {
    const load = async () => {
      if (!company?.id || !accessToken) return;
      setIsLoading(true);
      try {
        const dateStr = format(date, 'yyyy-MM-dd');
        const res = await fetch(`${import.meta.env.VITE_API_URL ?? 'http://localhost:3000'}/companies/${company.id}/reports/daily?date=${dateStr}`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.message ?? 'Gagal memuat laporan harian');
        }
        const data = await res.json();
        setReport(data);
      } catch (err: any) {
        setReport(null);
        toast({ title: 'Gagal memuat', description: err.message, variant: 'destructive' });
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [company?.id, accessToken, date, toast]);

  const revenueAccounts = report?.accounts
    .filter((acc) => acc.type === 'revenue' && acc.net !== 0)
    .sort((a, b) => b.net - a.net) ?? [];
  const expenseAccounts = report?.accounts
    .filter((acc) => acc.type === 'expense' && acc.net !== 0)
    .sort((a, b) => b.net - a.net) ?? [];

  const totalPendapatan = report?.totals.revenue ?? 0;
  const totalBeban = report?.totals.expense ?? 0;
  const labaRugi = report?.totals.netProfit ?? 0;

  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text('LAPORAN KEUANGAN HARIAN', 105, 20, { align: 'center' });
    doc.setFontSize(11);
    doc.text(`Tanggal: ${format(date, 'dd MMMM yyyy', { locale: id })}`, 105, 30, { align: 'center' });
    doc.setFontSize(12);
    doc.text(`Pendapatan: ${formatCurrency(totalPendapatan)}`, 20, 50);
    doc.text(`Beban: ${formatCurrency(totalBeban)}`, 20, 60);
    doc.text(`Laba/Rugi: ${formatCurrency(labaRugi)}`, 20, 70);
    doc.save(`Laporan_Keuangan_${format(date, 'yyyy-MM-dd')}.pdf`);
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <FileText className="h-6 w-6" />
              Laporan Keuangan
            </h1>
            <p className="text-muted-foreground">Laporan keuangan harian</p>
          </div>
          <div className="flex gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {format(date, 'dd MMMM yyyy', { locale: id })}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <Calendar mode="single" selected={date} onSelect={(newDate) => newDate && setDate(newDate)} initialFocus />
              </PopoverContent>
            </Popover>
            <Button onClick={exportToPDF} className="gap-2">
              <Download className="h-4 w-4" />
              Ekspor PDF
            </Button>
          </div>
        </div>

        <Card className={cn(labaRugi >= 0 ? 'border-emerald-500/50' : 'border-destructive/50')}>
          <CardContent className="py-4">
            <div className="flex justify-between items-center">
              <span className="text-lg font-bold">Laba Rugi Harian</span>
              <span className={cn('text-xl font-bold', labaRugi >= 0 ? 'text-emerald-500' : 'text-destructive')}>
                {isLoading ? 'Memuat...' : formatCurrency(labaRugi)}
              </span>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-lg">Pendapatan</CardTitle></CardHeader>
            <CardContent>
              {revenueAccounts.length ? (
                revenueAccounts.map((acc) => (
                  <div key={acc.id} className="flex justify-between py-2 border-b border-border/50">
                    <span>{acc.code} - {acc.name}</span><span>{formatCurrency(acc.net)}</span>
                  </div>
                ))
              ) : (
                <div className="text-sm text-muted-foreground py-2">Tidak ada pendapatan pada tanggal ini.</div>
              )}
              <div className="flex justify-between py-2 font-bold"><span>Total</span><span>{formatCurrency(totalPendapatan)}</span></div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-lg">Beban</CardTitle></CardHeader>
            <CardContent>
              {expenseAccounts.length ? (
                expenseAccounts.map((acc) => (
                  <div key={acc.id} className="flex justify-between py-2 border-b border-border/50">
                    <span>{acc.code} - {acc.name}</span><span>{formatCurrency(acc.net)}</span>
                  </div>
                ))
              ) : (
                <div className="text-sm text-muted-foreground py-2">Tidak ada beban pada tanggal ini.</div>
              )}
              <div className="flex justify-between py-2 font-bold"><span>Total</span><span>{formatCurrency(totalBeban)}</span></div>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}
