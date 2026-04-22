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
import { useErrorToast } from '@/shared/hooks/useErrorToast';

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

function getPreviousRange(fromStr: string, toStr: string): { from: string; to: string } {
  const from = new Date(fromStr);
  const to = new Date(toStr);
  const dayMs = 24 * 60 * 60 * 1000;
  const lengthDays = Math.round((to.getTime() - from.getTime()) / dayMs) + 1;
  const prevEnd = new Date(from.getTime() - dayMs);
  const prevStart = new Date(prevEnd.getTime() - (lengthDays - 1) * dayMs);
  return { from: format(prevStart, 'yyyy-MM-dd'), to: format(prevEnd, 'yyyy-MM-dd') };
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
  const { company, error: companyError } = useCompanyProfile();
  const [report, setReport] = useState<ReportData | null>(null);
  const [prevReport, setPrevReport] = useState<ReportData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  useErrorToast(companyError, 'Gagal memuat perusahaan');

  useEffect(() => {
    const load = async () => {
      if (!company?.id) return;
      setIsLoading(true);
      try {
        const { from, to } = getDateRange(date, period);
        const prev = getPreviousRange(from, to);

        const fetchReport = async (rangeFrom: string, rangeTo: string) => {
          const url = period === 'daily'
            ? `${import.meta.env.VITE_API_URL ?? 'http://localhost:3000'}/companies/${company.id}/reports/daily?date=${rangeFrom}&ts=${Date.now()}`
            : `${import.meta.env.VITE_API_URL ?? 'http://localhost:3000'}/companies/${company.id}/reports/range?from=${rangeFrom}&to=${rangeTo}&ts=${Date.now()}`;
          const res = await fetch(url, {
            cache: 'no-store',
            credentials: 'include',
          });
          if (res.status === 304) {
            return null;
          }
          if (!res.ok) {
            const body = await res.json().catch(() => ({}));
            throw new Error(body.message ?? 'Gagal memuat laporan');
          }
          return res.json();
        };

        const [currentData, prevData] = await Promise.all([
          fetchReport(from, to),
          fetchReport(prev.from, prev.to),
        ]);

        if (currentData) {
          setReport(currentData);
        }
        if (prevData) {
          setPrevReport(prevData);
        }
      } catch (err: any) {
        setReport(null);
        setPrevReport(null);
        toast({ title: 'Gagal memuat', description: err.message, variant: 'destructive' });
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [company?.id, date, period, toast]);

  const revenueAccounts = report?.accounts
    .filter((acc) => acc.type === 'revenue' && acc.net !== 0)
    .sort((a, b) => b.net - a.net) ?? [];
  const expenseAccounts = report?.accounts
    .filter((acc) => acc.type === 'expense' && acc.net !== 0)
    .sort((a, b) => b.net - a.net) ?? [];
  const prevExpenseAccounts = prevReport?.accounts
    .filter((acc) => acc.type === 'expense' && acc.net !== 0)
    .sort((a, b) => b.net - a.net) ?? [];

  const totalPendapatan = report?.totals.revenue ?? 0;
  const totalBeban = report?.totals.expense ?? 0;
  const labaRugi = report?.totals.netProfit ?? 0;
  const prevTotalPendapatan = prevReport?.totals.revenue ?? 0;
  const prevTotalBeban = prevReport?.totals.expense ?? 0;
  const prevLabaRugi = prevReport?.totals.netProfit ?? 0;

  const periodLabel = getPeriodLabel(date, period);
  const { from: periodFrom, to: periodTo } = getDateRange(date, period);
  const prevRange = getPreviousRange(periodFrom, periodTo);
  const prevPeriodLabel = getPeriodLabel(new Date(prevRange.from), period);
  const periodTitle = PERIOD_OPTIONS.find(p => p.value === period)?.label ?? '';

  const exportToPDF = () => {
    const doc = new jsPDF('p', 'mm', 'a4');
    const pageW = 210;
    const marginL = 15;
    const marginR = 15;
    const contentW = pageW - marginL - marginR;

    const fmtNum = (v: number) => {
      if (v === 0) return '-';
      return new Intl.NumberFormat('id-ID').format(v);
    };

    // Header
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(company?.name || '[Nama Perusahaan]', marginL, 18);
    doc.setFontSize(11);
    doc.text('Laporan Laba Rugi', marginL, 24);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(`Periode ${periodLabel}`, marginL, 30);
    doc.setFontSize(9);
    doc.text('(Dinyatakan dalam Rupiah, kecuali dinyatakan lain)', marginL, 36);
    doc.setDrawColor(0);
    doc.setLineWidth(0.8);
    doc.line(marginL, 39, pageW - marginR, 39);

    // Table columns
    const colPos = marginL;
    const colCat = marginL + 105;
    const colP2 = marginL + 140;
    const colP1 = pageW - marginR;

    let y = 46;

    // Table header
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('Pos', colPos, y);
    doc.text('Catatan', colCat, y, { align: 'right' });
    doc.text(periodLabel, colP2 + 10, y, { align: 'right' });
    doc.text(prevPeriodLabel, colP1, y, { align: 'right' });
    doc.setLineWidth(0.5);
    doc.line(marginL, y + 2, pageW - marginR, y + 2);
    y += 7;

    const addRow = (label: string, catatan: string, val2: string, val1: string, bold = false, indent = 0) => {
      doc.setFont('helvetica', bold ? 'bold' : 'normal');
      doc.text(label, colPos + indent, y);
      if (catatan) doc.text(catatan, colCat, y, { align: 'right' });
      doc.text(val2, colP2 + 10, y, { align: 'right' });
      doc.text(val1, colP1, y, { align: 'right' });
      y += 5.5;
    };

    const prevAccountMap = new Map(prevReport?.accounts.map((acc) => [acc.id, acc]) ?? []);

    const sumByKeywords = (items: typeof revenueAccounts, keywords: string[]) => {
      const lower = (value: string) => value.toLowerCase();
      return items
        .filter((acc) => keywords.some((kw) => lower(acc.name).includes(kw)))
        .reduce((sum, acc) => sum + acc.net, 0);
    };

    const otherExpense = sumByKeywords(expenseAccounts, ['lain', 'bunga', 'administrasi bank']);
    const prevOtherExpense = sumByKeywords(prevExpenseAccounts, ['lain', 'bunga', 'administrasi bank']);
    const otherIncome = sumByKeywords(revenueAccounts, ['lain', 'bunga']);
    const prevOtherIncome = sumByKeywords(prevReport?.accounts?.filter((acc) => acc.type === 'revenue') ?? [], ['lain', 'bunga']);
    const taxEstimate = sumByKeywords(expenseAccounts, ['pajak']);
    const prevTaxEstimate = sumByKeywords(prevExpenseAccounts, ['pajak']);

    // Pendapatan
    addRow('Pendapatan', '11', fmtNum(totalPendapatan), fmtNum(prevTotalPendapatan), false);
    // HPP
    addRow('Harga Pokok Penjualan', '12', fmtNum(totalBeban), fmtNum(prevTotalBeban), false);
    y += 1;
    const labaKotor = totalPendapatan - totalBeban;
    const labaKotorPrev = prevTotalPendapatan - prevTotalBeban;
    addRow('LABA KOTOR', '', fmtNum(labaKotor), fmtNum(labaKotorPrev), true);
    y += 3;

    // Beban Usaha
    doc.setFont('helvetica', 'bold');
    doc.text('Beban Usaha', colPos, y);
    y += 5.5;

    let totalBebanUsaha = 0;
    let prevTotalBebanUsaha = 0;
    expenseAccounts.forEach((acc) => {
      const prevNet = prevAccountMap.get(acc.id)?.net ?? 0;
      addRow(`${acc.name}`, '', fmtNum(acc.net), fmtNum(prevNet), false, 4);
      totalBebanUsaha += acc.net;
      prevTotalBebanUsaha += prevNet;
    });
    if (expenseAccounts.length === 0) {
      addRow('Beban Umum dan Administrasi', '15', fmtNum(0), fmtNum(0), false, 4);
      addRow('Beban Penjualan', '13', fmtNum(0), fmtNum(0), false, 4);
    }
    addRow('Total Beban Usaha', '', fmtNum(totalBebanUsaha), fmtNum(prevTotalBebanUsaha), true);
    y += 2;

    // Beban/Pendapatan lain-lain
    const otherNet = otherIncome - otherExpense;
    const prevOtherNet = prevOtherIncome - prevOtherExpense;
    addRow('Beban/Pendapatan lain-lain', '14a.b.', fmtNum(otherNet), fmtNum(prevOtherNet), false);
    y += 1;

    // Laba Rugi Operasi
    addRow('LABA RUGI OPERASI', '', fmtNum(labaRugi), fmtNum(prevLabaRugi), true);
    y += 2;

    // Pajak
    addRow('Taksiran Pajak Penghasilan', '', fmtNum(taxEstimate), fmtNum(prevTaxEstimate), false);
    y += 1;

    // Laba Bersih
    doc.setLineWidth(0.3);
    doc.line(marginL, y, pageW - marginR, y);
    y += 4;
    addRow('LABA BERSIH', '', fmtNum(labaRugi), fmtNum(prevLabaRugi), true);

    // Footer note
    y += 8;
    doc.setFontSize(8);
    doc.setFont('helvetica', 'italic');
    const footer = 'Lihat catatan atas laporan keuangan terlampir yang merupakan bagian yang tidak terpisahkan dari laporan keuangan secara keseluruhan';
    const footerLines = doc.splitTextToSize(footer, contentW);
    doc.text(footerLines, marginL, y);

    // Page number
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text('1+1', pageW / 2, 285, { align: 'center' });

    const { from, to } = getDateRange(date, period);
    doc.save(`Laba_Rugi_${from}_${to}.pdf`);
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
