import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Download, TrendingUp, TrendingDown, ArrowRight } from 'lucide-react';
import { format, startOfMonth, endOfMonth, isWithinInterval, subMonths, subDays } from 'date-fns';
import { id } from 'date-fns/locale';
import { useEffect, useMemo, useState } from 'react';
import { useSales } from '@/features/sales/hooks/useSales';
import { useCompanyProfile } from '@/features/onboarding';
import { usePurchases } from '@/features/purchases/hooks/usePurchases';
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
  accounts: Array<{
    id: string;
    name: string;
    type: string;
    net: number;
  }>;
};

type BalanceSnapshot = {
  asOf: string;
  categories: {
    cash: number;
    receivable: number;
    inventory: number;
    prepaid: number;
    otherCurrentAssets: number;
    fixedAssetsGross: number;
    payables: number;
    bankDebtShort: number;
    bankDebtLong: number;
    financingDebt: number;
    totalCurrentLiabilities: number;
  };
};

export default function CashFlow() {
  const [date, setDate] = useState<Date>(new Date());
  const { company, error: companyError } = useCompanyProfile();
  const { sales, error: salesError } = useSales(company?.id);
  const { purchases, error: purchasesError } = usePurchases(company?.id);
  const [report, setReport] = useState<ReportData | null>(null);
  const [prevReport, setPrevReport] = useState<ReportData | null>(null);
  const [startBalance, setStartBalance] = useState<BalanceSnapshot | null>(null);
  const [endBalance, setEndBalance] = useState<BalanceSnapshot | null>(null);
  const [prevStartBalance, setPrevStartBalance] = useState<BalanceSnapshot | null>(null);
  const [prevEndBalance, setPrevEndBalance] = useState<BalanceSnapshot | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const { toast } = useToast();
  useErrorToast(companyError, 'Gagal memuat perusahaan');
  useErrorToast(salesError, 'Gagal memuat penjualan');
  useErrorToast(purchasesError, 'Gagal memuat pembelian');
  useErrorToast(loadError, 'Gagal memuat arus kas');

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(value);
  };

  const monthStart = startOfMonth(date);
  const monthEnd = endOfMonth(date);
  const prevMonth = subMonths(date, 1);
  const prevMonthStart = startOfMonth(prevMonth);
  const prevMonthEnd = endOfMonth(prevMonth);

  const emptyCategories: BalanceSnapshot['categories'] = useMemo(() => ({
    cash: 0,
    receivable: 0,
    inventory: 0,
    prepaid: 0,
    otherCurrentAssets: 0,
    fixedAssetsGross: 0,
    payables: 0,
    bankDebtShort: 0,
    bankDebtLong: 0,
    financingDebt: 0,
    totalCurrentLiabilities: 0,
  }), []);

  useEffect(() => {
    const load = async () => {
      if (!company?.id) return;
      setLoadError(null);
      try {
        const apiBase = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';
        const from = format(monthStart, 'yyyy-MM-dd');
        const to = format(monthEnd, 'yyyy-MM-dd');
        const prevFrom = format(prevMonthStart, 'yyyy-MM-dd');
        const prevTo = format(prevMonthEnd, 'yyyy-MM-dd');

        const fetchReport = async (rangeFrom: string, rangeTo: string) => {
          const res = await fetch(`${apiBase}/companies/${company.id}/reports/range?from=${rangeFrom}&to=${rangeTo}&ts=${Date.now()}`, {
            cache: 'no-store',
            credentials: 'include',
          });
          if (!res.ok) {
            const body = await res.json().catch(() => ({}));
            throw new Error(body.message ?? 'Gagal memuat arus kas');
          }
          return res.json();
        };

        const fetchBalance = async (asOf: string) => {
          const res = await fetch(`${apiBase}/companies/${company.id}/reports/balance?asOf=${asOf}&ts=${Date.now()}`, {
            cache: 'no-store',
            credentials: 'include',
          });
          if (!res.ok) {
            const body = await res.json().catch(() => ({}));
            throw new Error(body.message ?? 'Gagal memuat arus kas');
          }
          return res.json();
        };

        const [currentReport, previousReport, startSnap, endSnap, prevStartSnap, prevEndSnap] = await Promise.all([
          fetchReport(from, to),
          fetchReport(prevFrom, prevTo),
          fetchBalance(format(subDays(monthStart, 1), 'yyyy-MM-dd')),
          fetchBalance(format(monthEnd, 'yyyy-MM-dd')),
          fetchBalance(format(subDays(prevMonthStart, 1), 'yyyy-MM-dd')),
          fetchBalance(format(prevMonthEnd, 'yyyy-MM-dd')),
        ]);

        setReport(currentReport);
        setPrevReport(previousReport);
        setStartBalance(startSnap);
        setEndBalance(endSnap);
        setPrevStartBalance(prevStartSnap);
        setPrevEndBalance(prevEndSnap);
      } catch (err: any) {
        setReport(null);
        setPrevReport(null);
        setStartBalance(null);
        setEndBalance(null);
        setPrevStartBalance(null);
        setPrevEndBalance(null);
        setLoadError(err.message ?? 'Gagal memuat arus kas');
        toast({ title: 'Gagal memuat', description: err.message, variant: 'destructive' });
      }
    };
    load();
  }, [company?.id, monthStart, monthEnd, prevMonthStart, prevMonthEnd, toast]);

  const monthlySales = sales.filter((s) => {
    const saleDate = new Date(s.soldAt);
    return isWithinInterval(saleDate, { start: monthStart, end: monthEnd });
  });

  const monthlyPurchases = purchases.filter((p) => {
    const purchaseDate = new Date(p.date);
    return isWithinInterval(purchaseDate, { start: monthStart, end: monthEnd });
  });

  const currentStart = startBalance?.categories ?? emptyCategories;
  const currentEnd = endBalance?.categories ?? emptyCategories;
  const prevStart = prevStartBalance?.categories ?? emptyCategories;
  const prevEnd = prevEndBalance?.categories ?? emptyCategories;

  const sumByKeywords = (items: ReportData['accounts'] | undefined, keywords: string[]) => {
    if (!items) return 0;
    const lower = (value: string) => value.toLowerCase();
    return items
      .filter((acc) => keywords.some((kw) => lower(acc.name).includes(kw)))
      .reduce((sum, acc) => sum + acc.net, 0);
  };

  const netIncome = report?.totals.netProfit ?? 0;
  const prevNetIncome = prevReport?.totals.netProfit ?? 0;
  const depreciation = sumByKeywords(report?.accounts, ['penyusutan']);
  const prevDepreciation = sumByKeywords(prevReport?.accounts, ['penyusutan']);

  const receivableEffect = -(currentEnd.receivable - currentStart.receivable);
  const inventoryEffect = -(currentEnd.inventory - currentStart.inventory);
  const prepaidEffect = -(currentEnd.prepaid - currentStart.prepaid);
  const otherAssetEffect = -(currentEnd.otherCurrentAssets - currentStart.otherCurrentAssets);
  const payableEffect = currentEnd.payables - currentStart.payables;

  const prevReceivableEffect = -(prevEnd.receivable - prevStart.receivable);
  const prevInventoryEffect = -(prevEnd.inventory - prevStart.inventory);
  const prevPrepaidEffect = -(prevEnd.prepaid - prevStart.prepaid);
  const prevOtherAssetEffect = -(prevEnd.otherCurrentAssets - prevStart.otherCurrentAssets);
  const prevPayableEffect = prevEnd.payables - prevStart.payables;

  const netOperatingCashFlow =
    netIncome +
    depreciation +
    receivableEffect +
    inventoryEffect +
    prepaidEffect +
    otherAssetEffect +
    payableEffect;

  const prevOperatingCashFlow =
    prevNetIncome +
    prevDepreciation +
    prevReceivableEffect +
    prevInventoryEffect +
    prevPrepaidEffect +
    prevOtherAssetEffect +
    prevPayableEffect;

  const fixedAssetChange = currentEnd.fixedAssetsGross - currentStart.fixedAssetsGross;
  const prevFixedAssetChange = prevEnd.fixedAssetsGross - prevStart.fixedAssetsGross;
  const purchaseAsset = fixedAssetChange > 0 ? fixedAssetChange : 0;
  const saleAsset = fixedAssetChange < 0 ? -fixedAssetChange : 0;
  const prevPurchaseAsset = prevFixedAssetChange > 0 ? prevFixedAssetChange : 0;
  const prevSaleAsset = prevFixedAssetChange < 0 ? -prevFixedAssetChange : 0;
  const netInvesting = saleAsset - purchaseAsset;
  const prevNetInvesting = prevSaleAsset - prevPurchaseAsset;

  const bankDebtChange = (currentEnd.bankDebtShort + currentEnd.bankDebtLong) - (currentStart.bankDebtShort + currentStart.bankDebtLong);
  const prevBankDebtChange = (prevEnd.bankDebtShort + prevEnd.bankDebtLong) - (prevStart.bankDebtShort + prevStart.bankDebtLong);
  const bankDebtPayment = bankDebtChange < 0 ? -bankDebtChange : 0;
  const bankDebtProceeds = bankDebtChange > 0 ? bankDebtChange : 0;
  const prevBankDebtPayment = prevBankDebtChange < 0 ? -prevBankDebtChange : 0;
  const prevBankDebtProceeds = prevBankDebtChange > 0 ? prevBankDebtChange : 0;

  const financingDebtChange = currentEnd.financingDebt - currentStart.financingDebt;
  const prevFinancingDebtChange = prevEnd.financingDebt - prevStart.financingDebt;
  const financingPayment = financingDebtChange < 0 ? -financingDebtChange : 0;
  const financingProceeds = financingDebtChange > 0 ? financingDebtChange : 0;
  const prevFinancingPayment = prevFinancingDebtChange < 0 ? -prevFinancingDebtChange : 0;
  const prevFinancingProceeds = prevFinancingDebtChange > 0 ? prevFinancingDebtChange : 0;

  const netFinancing = bankDebtProceeds - bankDebtPayment + financingProceeds - financingPayment;
  const prevNetFinancing = prevBankDebtProceeds - prevBankDebtPayment + prevFinancingProceeds - prevFinancingPayment;

  const beginningBalance = currentStart.cash;
  const endingBalance = currentEnd.cash;
  const cashChange = endingBalance - beginningBalance;

  const prevBeginningBalance = prevStart.cash;
  const prevEndingBalance = prevEnd.cash;
  const prevCashChange = prevEndingBalance - prevBeginningBalance;

  const cashFromSales = report?.totals.revenue ?? 0;
  const cashForPurchases = report?.totals.expense ?? 0;

  const exportToPDF = () => {
    const doc = new jsPDF('p', 'mm', 'a4');
    const pageW = 210;
    const marginL = 15;
    const marginR = 15;
    const contentW = pageW - marginL - marginR;
    const periodLabel = format(date, 'MMMM yyyy', { locale: id });
    const prevPeriodLabel = format(prevMonth, 'MMMM yyyy', { locale: id });

    const fmtNum = (v: number) => {
      if (v === 0) return '-';
      return new Intl.NumberFormat('id-ID').format(v);
    };

    // Header
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(company?.name || '[Nama Perusahaan]', marginL, 18);
    doc.setFontSize(11);
    doc.text('Laporan Arus Kas', marginL, 24);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(`Per ${periodLabel}`, marginL, 30);
    doc.setFontSize(9);
    doc.text('(Dinyatakan dalam Rupiah, kecuali dinyatakan lain)', marginL, 36);
    doc.setDrawColor(0);
    doc.setLineWidth(0.8);
    doc.line(marginL, 39, pageW - marginR, 39);

    // Table columns
    const colPos = marginL;
    const colP2 = marginL + 140;
    const colP1 = pageW - marginR;

    let y = 46;

    // Table header
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('Pos', colPos, y);
    doc.text(periodLabel, colP2 + 10, y, { align: 'right' });
    doc.text(prevPeriodLabel, colP1, y, { align: 'right' });
    doc.setLineWidth(0.5);
    doc.line(marginL, y + 2, pageW - marginR, y + 2);
    y += 7;

    const addRow = (label: string, val2: string, val1: string, bold = false, indent = 0) => {
      doc.setFont('helvetica', bold ? 'bold' : 'normal');
      doc.text(label, colPos + indent, y);
      doc.text(val2, colP2 + 10, y, { align: 'right' });
      doc.text(val1, colP1, y, { align: 'right' });
      y += 5.5;
    };

    const addSectionHeader = (label: string) => {
      doc.setFont('helvetica', 'bold');
      doc.text(label, colPos, y);
      y += 5.5;
    };

    // Aktivitas Operasi
    addSectionHeader('Aktivitas Operasi');
    addRow('Laba/Rugi Bersih', fmtNum(netIncome), fmtNum(prevNetIncome), false, 4);
    addRow('Penyesuaian:', '', '', false, 4);
    addRow('Akumulasi Penyusutan', fmtNum(depreciation), fmtNum(prevDepreciation), false, 8);
    addRow('Kenaikan & Penurunan Kas', '', '', false, 4);
    addRow('Piutang Usaha', fmtNum(receivableEffect), fmtNum(prevReceivableEffect), false, 8);
    addRow('Persediaan', fmtNum(inventoryEffect), fmtNum(prevInventoryEffect), false, 8);
    addRow('Biaya Dibayar Dimuka (Down Payment)', fmtNum(prepaidEffect), fmtNum(prevPrepaidEffect), false, 8);
    addRow('Aset Lancar Lainnya', fmtNum(otherAssetEffect), fmtNum(prevOtherAssetEffect), false, 8);
    addRow('Total Arus Kas Bersih Aktivitas Operasional', fmtNum(netOperatingCashFlow), fmtNum(prevOperatingCashFlow), true);
    y += 3;

    // Aktivitas Investasi
    addSectionHeader('Aktivitas Investasi');
    addRow('Pembelian Aset', fmtNum(purchaseAsset), fmtNum(prevPurchaseAsset), false, 4);
    addRow('Penjualan Aset', fmtNum(saleAsset), fmtNum(prevSaleAsset), false, 4);
    addRow('Total Arus Kas Bersih Aktivitas Investasi', fmtNum(netInvesting), fmtNum(prevNetInvesting), true);
    y += 3;

    // Aktivitas Pendanaan
    addSectionHeader('Aktivitas Pendanaan');
    addRow('Pembayaran Utang Bank', fmtNum(bankDebtPayment), fmtNum(prevBankDebtPayment), false, 4);
    addRow('Penerimaan Utang Bank', fmtNum(bankDebtProceeds), fmtNum(prevBankDebtProceeds), false, 4);
    addRow('Total Arus Kas Bersih Aktivitas Pendanaan', fmtNum(netFinancing), fmtNum(prevNetFinancing), true);
    y += 4;

    // Summary
    doc.setLineWidth(0.3);
    doc.line(marginL, y, pageW - marginR, y);
    y += 5;
    addRow('Kenaikan Bersih Kas dan Setara Kas', fmtNum(cashChange), fmtNum(prevCashChange), true);
    addRow('Kas dan Setara Kas Pada Awal Periode', fmtNum(beginningBalance), fmtNum(prevBeginningBalance), false);
    addRow('Kas dan Setara Kas Pada Akhir Periode', fmtNum(endingBalance), fmtNum(prevEndingBalance), true);

    // Footer
    y += 8;
    doc.setFontSize(8);
    doc.setFont('helvetica', 'italic');
    const footer = 'Lihat catatan atas laporan keuangan terlampir yang merupakan bagian yang tidak terpisahkan dari laporan keuangan secara keseluruhan';
    const footerLines = doc.splitTextToSize(footer, contentW);
    doc.text(footerLines, marginL, y);

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text('1+1', pageW / 2, 285, { align: 'center' });

    doc.save(`Arus_Kas_${format(date, 'yyyy-MM')}.pdf`);
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <ArrowRight className="h-6 w-6" />
              Laporan Arus Kas
            </h1>
            <p className="text-muted-foreground">Pergerakan kas bulanan</p>
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

        {/* Summary Cards */}
        <div className="grid md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">Saldo Awal</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{formatCurrency(beginningBalance)}</p>
            </CardContent>
          </Card>
          <Card className={cn(cashChange >= 0 ? 'border-emerald-500/50' : 'border-destructive/50')}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">Perubahan Kas</CardTitle>
            </CardHeader>
            <CardContent>
              <p className={cn('text-2xl font-bold', cashChange >= 0 ? 'text-emerald-500' : 'text-destructive')}>
                {cashChange >= 0 ? '+' : ''}{formatCurrency(cashChange)}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">Saldo Akhir</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-primary">{formatCurrency(endingBalance)}</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Arus Kas dari Aktivitas Operasi</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-emerald-500/10 rounded-lg">
              <div className="flex items-center gap-3">
                <TrendingUp className="h-5 w-5 text-emerald-500" />
                <div>
                  <p className="font-medium">Penerimaan dari Penjualan</p>
                  <p className="text-sm text-muted-foreground">{monthlySales.length} transaksi</p>
                </div>
              </div>
              <span className="text-lg font-bold text-emerald-500">{formatCurrency(cashFromSales)}</span>
            </div>
            
            <div className="flex items-center justify-between p-4 bg-destructive/10 rounded-lg">
              <div className="flex items-center gap-3">
                <TrendingDown className="h-5 w-5 text-destructive" />
                <div>
                  <p className="font-medium">Pembayaran untuk Pembelian</p>
                  <p className="text-sm text-muted-foreground">{monthlyPurchases.length} transaksi</p>
                </div>
              </div>
              <span className="text-lg font-bold text-destructive">({formatCurrency(cashForPurchases)})</span>
            </div>

            <div className="border-t pt-4">
              <div className="flex justify-between items-center">
                <span className="font-semibold">Arus Kas Bersih dari Aktivitas Operasi</span>
                <span className={cn('text-xl font-bold', netOperatingCashFlow >= 0 ? 'text-emerald-500' : 'text-destructive')}>
                  {formatCurrency(netOperatingCashFlow)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
