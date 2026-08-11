import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Download, Scale } from 'lucide-react';
import { format, endOfMonth, startOfYear, subDays } from 'date-fns';
import { id } from 'date-fns/locale';
import { useEffect, useMemo, useState } from 'react';
import { useCompanyProfile } from '@/features/onboarding';
import jsPDF from 'jspdf';
import { cn } from '@/lib/utils';
import { useErrorToast } from '@/shared/hooks/useErrorToast';
import { useToast } from '@/components/ui/use-toast';

type ReportData = {
  totals: {
    revenue: number;
    expense: number;
    netProfit: number;
  };
};

type BalanceSnapshot = {
  categories: {
    equityCapital: number;
    retainedEarnings: number;
    totalEquity: number;
  };
};

export default function EquityStatement() {
  const [date, setDate] = useState<Date>(new Date());
  const { company, error: companyError } = useCompanyProfile();
  const [report, setReport] = useState<ReportData | null>(null);
  const [startBalance, setStartBalance] = useState<BalanceSnapshot | null>(null);
  const [endBalance, setEndBalance] = useState<BalanceSnapshot | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const { toast } = useToast();
  useErrorToast(companyError, 'Gagal memuat perusahaan');
  useErrorToast(loadError, 'Gagal memuat perubahan ekuitas');

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(value);
  };

  const yearStart = startOfYear(date);
  const monthEnd = endOfMonth(date);
  const emptyCategories = useMemo(
    () => ({ equityCapital: 0, retainedEarnings: 0, totalEquity: 0 }),
    [],
  );

  useEffect(() => {
    const load = async () => {
      if (!company?.id) return;
      setLoadError(null);
      try {
        const apiBase = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';
        const from = format(yearStart, 'yyyy-MM-dd');
        const to = format(monthEnd, 'yyyy-MM-dd');
        const startAsOf = format(subDays(yearStart, 1), 'yyyy-MM-dd');
        const endAsOf = format(monthEnd, 'yyyy-MM-dd');

        const fetchJson = async (url: string) => {
          const res = await fetch(url, { cache: 'no-store', credentials: 'include' });
          if (!res.ok) {
            const body = await res.json().catch(() => ({}));
            throw new Error(body.message ?? 'Gagal memuat perubahan ekuitas');
          }
          return res.json();
        };

        const [currentReport, openingSnap, closingSnap] = await Promise.all([
          fetchJson(`${apiBase}/companies/${company.id}/reports/range?from=${from}&to=${to}&ts=${Date.now()}`),
          fetchJson(`${apiBase}/companies/${company.id}/reports/balance?asOf=${startAsOf}&ts=${Date.now()}`),
          fetchJson(`${apiBase}/companies/${company.id}/reports/balance?asOf=${endAsOf}&ts=${Date.now()}`),
        ]);

        setReport(currentReport);
        setStartBalance(openingSnap);
        setEndBalance(closingSnap);
      } catch (err: any) {
        setReport(null);
        setStartBalance(null);
        setEndBalance(null);
        setLoadError(err.message ?? 'Gagal memuat perubahan ekuitas');
        toast({ title: 'Gagal memuat', description: err.message, variant: 'destructive' });
      }
    };
    load();
  }, [company?.id, yearStart, monthEnd, toast]);

  const startCategories = startBalance?.categories ?? emptyCategories;
  const endCategories = endBalance?.categories ?? emptyCategories;
  const beginningEquity = startCategories.totalEquity;
  const totalRevenue = report?.totals.revenue ?? 0;
  const totalExpenses = report?.totals.expense ?? 0;
  const netIncome = report?.totals.netProfit ?? 0;
  const capitalMovement = endCategories.equityCapital - startCategories.equityCapital;
  const additionalCapital = capitalMovement > 0 ? capitalMovement : 0;
  const endingEquity = endCategories.totalEquity;
  const withdrawals = Math.max(beginningEquity + additionalCapital + netIncome - endingEquity, 0);
  const retainedEarnings = endCategories.retainedEarnings;

  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text('LAPORAN PERUBAHAN EKUITAS', 105, 20, { align: 'center' });
    doc.setFontSize(11);
    doc.text(`Periode: ${format(yearStart, 'MMMM', { locale: id })} - ${format(date, 'MMMM yyyy', { locale: id })}`, 105, 30, { align: 'center' });
    
    doc.setFontSize(12);
    doc.text(`Ekuitas Awal: ${formatCurrency(beginningEquity)}`, 20, 50);
    doc.text(`Tambah: Laba Bersih: ${formatCurrency(netIncome)}`, 20, 65);
    doc.text(`Tambah: Setoran Modal: ${formatCurrency(additionalCapital)}`, 20, 75);
    doc.text(`Kurang: Penarikan/Reverse: ${formatCurrency(withdrawals)}`, 20, 85);
    doc.text(`Ekuitas Akhir: ${formatCurrency(endingEquity)}`, 20, 100);
    
    doc.save(`Ekuitas_${format(date, 'yyyy-MM')}.pdf`);
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Scale className="h-6 w-6" />
              Laporan Perubahan Ekuitas
            </h1>
            <p className="text-muted-foreground">Perubahan modal pemilik</p>
          </div>
          <div className="flex gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {format(date, 'MMMM yyyy', { locale: id })}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <Calendar mode="single" selected={date} onSelect={(d) => d && setDate(d)} initialFocus />
              </PopoverContent>
            </Popover>
            <Button onClick={exportToPDF} className="gap-2">
              <Download className="h-4 w-4" />
              Ekspor PDF
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Perubahan Ekuitas Tahun {format(date, 'yyyy')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex justify-between items-center p-4 bg-muted/50 rounded-lg">
              <span className="font-medium">Ekuitas Awal Periode</span>
              <span className="text-lg font-bold">{formatCurrency(beginningEquity)}</span>
            </div>

            <div className="space-y-3 pl-4 border-l-2 border-primary/30">
              <div className="flex justify-between items-center">
                <span>Tambah: Laba Bersih Periode Ini</span>
                <span className={cn('font-semibold', netIncome >= 0 ? 'text-emerald-500' : 'text-destructive')}>
                  {netIncome >= 0 ? '+' : ''}{formatCurrency(netIncome)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span>Tambah: Setoran Modal</span>
                <span className="font-semibold text-emerald-500">+{formatCurrency(additionalCapital)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Kurang: Penarikan (Prive)</span>
                <span className="font-semibold text-destructive">-{formatCurrency(withdrawals)}</span>
              </div>
            </div>

            <div className="flex justify-between items-center p-4 bg-primary/10 rounded-lg border border-primary/30">
              <span className="font-bold text-lg">Ekuitas Akhir Periode</span>
              <span className="text-2xl font-bold text-primary">{formatCurrency(endingEquity)}</span>
            </div>
          </CardContent>
        </Card>

        {/* Summary breakdown */}
        <div className="grid md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Modal Disetor</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-1">Saldo modal pemilik per akhir periode</p>
              <p className="text-2xl font-bold text-emerald-500">{formatCurrency(endCategories.equityCapital)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Saldo Laba</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-1">Akumulasi laba ditahan dan laba berjalan</p>
              <p className="text-2xl font-bold text-primary">{formatCurrency(retainedEarnings)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Laba Bersih YTD</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-1">Pendapatan {formatCurrency(totalRevenue)} dikurangi beban {formatCurrency(totalExpenses)}</p>
              <p className={cn('text-2xl font-bold', netIncome >= 0 ? 'text-emerald-500' : 'text-destructive')}>
                {formatCurrency(netIncome)}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}
