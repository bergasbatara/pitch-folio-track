import { useEffect, useMemo, useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CalendarIcon, Download, FileText } from 'lucide-react';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear } from 'date-fns';
import { id } from 'date-fns/locale';
import { useCompanyProfile } from '@/features/onboarding';
import { cn } from '@/lib/utils';
import jsPDF from 'jspdf';
import { useToast } from '@/components/ui/use-toast';

const formatCurrency = (value: number) => {
  return `Rp ${value.toLocaleString('id-ID')}`;
};

type PeriodType = 'daily' | 'weekly' | 'monthly' | 'yearly';

type ReportData = {
  from: string;
  to: string;
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

function getDateRange(date: Date, period: PeriodType): { from: string; to: string } {
  const fmt = (d: Date) => format(d, 'yyyy-MM-dd');
  switch (period) {
    case 'daily':
      return { from: fmt(date), to: fmt(date) };
    case 'weekly':
      return { from: fmt(startOfWeek(date, { weekStartsOn: 1 })), to: fmt(endOfWeek(date, { weekStartsOn: 1 })) };
    case 'monthly':
      return { from: fmt(startOfMonth(date)), to: fmt(endOfMonth(date)) };
    case 'yearly':
      return { from: fmt(startOfYear(date)), to: fmt(endOfYear(date)) };
  }
}

function getPeriodLabel(date: Date, period: PeriodType): string {
  switch (period) {
    case 'daily':
      return format(date, 'dd MMMM yyyy', { locale: id });
    case 'weekly': {
      const s = startOfWeek(date, { weekStartsOn: 1 });
      const e = endOfWeek(date, { weekStartsOn: 1 });
      return `${format(s, 'dd MMM', { locale: id })} – ${format(e, 'dd MMM yyyy', { locale: id })}`;
    }
    case 'monthly':
      return format(date, 'MMMM yyyy', { locale: id });
    case 'yearly':
      return format(date, 'yyyy');
  }
}

const PERIOD_OPTIONS: { value: PeriodType; label: string }[] = [
  { value: 'daily', label: 'Harian' },
  { value: 'weekly', label: 'Mingguan' },
  { value: 'monthly', label: 'Bulanan' },
  { value: 'yearly', label: 'Tahunan' },
];

export default function FinancialStatements() {
  const [date, setDate] = useState<Date>(new Date());
  const [period, setPeriod] = useState<PeriodType>('daily');
  const { company } = useCompanyProfile();
  const [report, setReport] = useState<ReportData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const accessToken = useMemo(() => localStorage.getItem('auth_access_token'), []);

  useEffect(() => {
    const load = async () => {
      if (!company?.id || !accessToken) return;
      setIsLoading(true);
      try {
        const { from, to } = getDateRange(date, period);
        const url = period === 'daily'
          ? `${import.meta.env.VITE_API_URL ?? 'http://localhost:3000'}/companies/${company.id}/reports/daily?date=${from}`
          : `${import.meta.env.VITE_API_URL ?? 'http://localhost:3000'}/companies/${company.id}/reports/range?from=${from}&to=${to}`;
        const res = await fetch(url, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.message ?? 'Gagal memuat laporan');
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
  }, [company?.id, accessToken, date, period, toast]);

  const revenueAccounts = report?.accounts
    .filter((acc) => acc.type === 'revenue' && acc.net !== 0)
    .sort((a, b) => b.net - a.net) ?? [];
  const expenseAccounts = report?.accounts
    .filter((acc) => acc.type === 'expense' && acc.net !== 0)
    .sort((a, b) => b.net - a.net) ?? [];

  const totalPendapatan = report?.totals.revenue ?? 0;
  const totalBeban = report?.totals.expense ?? 0;
  const labaRugi = report?.totals.netProfit ?? 0;

  const periodLabel = getPeriodLabel(date, period);
  const periodTitle = PERIOD_OPTIONS.find(p => p.value === period)?.label ?? '';

  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text(`LAPORAN KEUANGAN ${periodTitle.toUpperCase()}`, 105, 20, { align: 'center' });
    doc.setFontSize(11);
    doc.text(`Periode: ${periodLabel}`, 105, 30, { align: 'center' });
    doc.setFontSize(12);
    let y = 50;

    doc.text(`Pendapatan:`, 20, y);
    y += 8;
    revenueAccounts.forEach((acc) => {
      doc.setFontSize(10);
      doc.text(`  ${acc.code} - ${acc.name}`, 20, y);
      doc.text(formatCurrency(acc.net), 190, y, { align: 'right' });
      y += 7;
    });
    doc.setFontSize(12);
    doc.text(`Total Pendapatan: ${formatCurrency(totalPendapatan)}`, 20, y + 3);
    y += 15;

    doc.text(`Beban:`, 20, y);
    y += 8;
    expenseAccounts.forEach((acc) => {
      doc.setFontSize(10);
      doc.text(`  ${acc.code} - ${acc.name}`, 20, y);
      doc.text(formatCurrency(acc.net), 190, y, { align: 'right' });
      y += 7;
    });
    doc.setFontSize(12);
    doc.text(`Total Beban: ${formatCurrency(totalBeban)}`, 20, y + 3);
    y += 15;

    doc.setFontSize(14);
    doc.text(`Laba/Rugi: ${formatCurrency(labaRugi)}`, 20, y);

    const { from, to } = getDateRange(date, period);
    doc.save(`Laporan_Keuangan_${from}_${to}.pdf`);
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
            <p className="text-muted-foreground">Laporan keuangan {periodTitle.toLowerCase()}</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Select value={period} onValueChange={(v) => setPeriod(v as PeriodType)}>
              <SelectTrigger className="w-[130px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PERIOD_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {periodLabel}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={(newDate) => newDate && setDate(newDate)}
                  initialFocus
                  className={cn("p-3 pointer-events-auto")}
                />
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
              <div>
                <span className="text-lg font-bold">Laba Rugi {periodTitle}</span>
                <p className="text-sm text-muted-foreground">{periodLabel}</p>
              </div>
              <span className={cn('text-xl font-bold', labaRugi >= 0 ? 'text-emerald-500' : 'text-destructive')}>
                {isLoading ? 'Memuat...' : formatCurrency(labaRugi)}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Cash flow summary */}
        <div className="grid gap-4 sm:grid-cols-3">
          <Card>
            <CardContent className="py-4">
              <p className="text-sm text-muted-foreground">Kas Masuk</p>
              <p className="text-lg font-bold text-emerald-500">{isLoading ? '...' : formatCurrency(report?.totals.cashIn ?? 0)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="py-4">
              <p className="text-sm text-muted-foreground">Kas Keluar</p>
              <p className="text-lg font-bold text-destructive">{isLoading ? '...' : formatCurrency(report?.totals.cashOut ?? 0)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="py-4">
              <p className="text-sm text-muted-foreground">Arus Kas Bersih</p>
              <p className={cn('text-lg font-bold', (report?.totals.netCash ?? 0) >= 0 ? 'text-emerald-500' : 'text-destructive')}>
                {isLoading ? '...' : formatCurrency(report?.totals.netCash ?? 0)}
              </p>
            </CardContent>
          </Card>
        </div>

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
                <div className="text-sm text-muted-foreground py-2">Tidak ada pendapatan pada periode ini.</div>
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
                <div className="text-sm text-muted-foreground py-2">Tidak ada beban pada periode ini.</div>
              )}
              <div className="flex justify-between py-2 font-bold"><span>Total</span><span>{formatCurrency(totalBeban)}</span></div>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}
