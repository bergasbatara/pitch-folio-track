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
import { usePurchases } from '@/features/purchases/hooks/usePurchases';
import jsPDF from 'jspdf';
import { cn } from '@/lib/utils';

export default function CashFlow() {
  const [date, setDate] = useState<Date>(new Date());
  const { sales } = useSales();
  const { purchases } = usePurchases();

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
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text('LAPORAN ARUS KAS', 105, 20, { align: 'center' });
    doc.setFontSize(11);
    doc.text(`Periode: ${format(date, 'MMMM yyyy', { locale: id })}`, 105, 30, { align: 'center' });
    
    doc.setFontSize(12);
    doc.text('ARUS KAS DARI AKTIVITAS OPERASI', 20, 50);
    doc.text(`Penerimaan dari Penjualan: ${formatCurrency(cashFromSales)}`, 25, 60);
    doc.text(`Pembayaran untuk Pembelian: (${formatCurrency(cashForPurchases)})`, 25, 70);
    doc.text(`Arus Kas Bersih dari Operasi: ${formatCurrency(netOperatingCashFlow)}`, 20, 85);
    
    doc.text(`Saldo Awal Kas: ${formatCurrency(beginningBalance)}`, 20, 105);
    doc.text(`Saldo Akhir Kas: ${formatCurrency(endingBalance)}`, 20, 115);
    
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
