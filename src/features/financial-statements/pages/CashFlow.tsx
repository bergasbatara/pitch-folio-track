import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Download, TrendingUp, TrendingDown, ArrowRight } from 'lucide-react';
import { format, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import { id } from 'date-fns/locale';
import { useState } from 'react';
import { useSales } from '@/features/sales/hooks/useSales';
import { useCompanyProfile } from '@/features/onboarding';
import { usePurchases } from '@/features/purchases/hooks/usePurchases';
import jsPDF from 'jspdf';
import { cn } from '@/lib/utils';
import { useErrorToast } from '@/shared/hooks/useErrorToast';

export default function CashFlow() {
  const [date, setDate] = useState<Date>(new Date());
  const { company, error: companyError } = useCompanyProfile();
  const { sales, error: salesError } = useSales(company?.id);
  const { purchases, error: purchasesError } = usePurchases(company?.id);
  useErrorToast(companyError, 'Gagal memuat perusahaan');
  useErrorToast(salesError, 'Gagal memuat penjualan');
  useErrorToast(purchasesError, 'Gagal memuat pembelian');

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(value);
  };

  const monthStart = startOfMonth(date);
  const monthEnd = endOfMonth(date);

  const monthlySales = sales.filter((s) => {
    const saleDate = new Date(s.soldAt);
    return isWithinInterval(saleDate, { start: monthStart, end: monthEnd });
  });

  const monthlyPurchases = purchases.filter((p) => {
    const purchaseDate = new Date(p.date);
    return isWithinInterval(purchaseDate, { start: monthStart, end: monthEnd });
  });

  // Cash Flow from Operating Activities
  const cashFromSales = monthlySales.reduce((sum, s) => sum + s.totalPrice, 0);
  const cashForPurchases = monthlyPurchases.reduce((sum, p) => sum + p.totalCost, 0);
  const netOperatingCashFlow = cashFromSales - cashForPurchases;

  // Beginning balance (simplified - from all previous transactions)
  const previousSales = sales.filter((s) => new Date(s.soldAt) < monthStart);
  const previousPurchases = purchases.filter((p) => new Date(p.date) < monthStart);
  const beginningBalance = previousSales.reduce((sum, s) => sum + s.totalPrice, 0) - previousPurchases.reduce((sum, p) => sum + p.totalCost, 0);
  
  const endingBalance = beginningBalance + netOperatingCashFlow;

  const exportToPDF = () => {
    const doc = new jsPDF('p', 'mm', 'a4');
    const pageW = 210;
    const marginL = 15;
    const marginR = 15;
    const contentW = pageW - marginL - marginR;
    const periodLabel = format(date, 'MMMM yyyy', { locale: id });

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
    doc.text('[Periode 1]', colP1, y, { align: 'right' });
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
    addRow('Laba/Rugi Bersih', fmtNum(netOperatingCashFlow), '-', false, 4);
    addRow('Penyesuaian:', '', '', false, 4);
    addRow('Akumulasi Penyusutan', '-', '-', false, 8);
    addRow('Kenaikan & Penurunan Kas', '', '', false, 4);
    addRow('Piutang Usaha', '-', '-', false, 8);
    addRow('Persediaan', '-', '-', false, 8);
    addRow('Biaya Dibayar Dimuka (Down Payment)', '-', '-', false, 8);
    addRow('Aset Lancar Lainnya', '-', '-', false, 8);
    addRow('Total Arus Kas Bersih Aktivitas Operasional', fmtNum(netOperatingCashFlow), '-', true);
    y += 3;

    // Aktivitas Investasi
    addSectionHeader('Aktivitas Investasi');
    addRow('Pembelian Aset', '-', '-', false, 4);
    addRow('Penjualan Aset', '-', '-', false, 4);
    addRow('Total Arus Kas Bersih Aktivitas Investasi', '-', '-', true);
    y += 3;

    // Aktivitas Pendanaan
    addSectionHeader('Aktivitas Pendanaan');
    addRow('Pembayaran Utang Bank', '-', '-', false, 4);
    addRow('Penerimaan Utang Bank', '-', '-', false, 4);
    addRow('Total Arus Kas Bersih Aktivitas Pendanaan', '-', '-', true);
    y += 4;

    // Summary
    doc.setLineWidth(0.3);
    doc.line(marginL, y, pageW - marginR, y);
    y += 5;
    addRow('Kenaikan Bersih Kas dan Setara Kas', fmtNum(netOperatingCashFlow), '-', true);
    addRow('Kas dan Setara Kas Pada Awal Periode', fmtNum(beginningBalance), '-', false);
    addRow('Kas dan Setara Kas Pada Akhir Periode', fmtNum(endingBalance), '-', true);

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
          <Card className={cn(netOperatingCashFlow >= 0 ? 'border-emerald-500/50' : 'border-destructive/50')}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">Perubahan Kas</CardTitle>
            </CardHeader>
            <CardContent>
              <p className={cn('text-2xl font-bold', netOperatingCashFlow >= 0 ? 'text-emerald-500' : 'text-destructive')}>
                {netOperatingCashFlow >= 0 ? '+' : ''}{formatCurrency(netOperatingCashFlow)}
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
