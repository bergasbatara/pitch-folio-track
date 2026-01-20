import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Download, Scale } from 'lucide-react';
import { format, startOfMonth, endOfMonth, isWithinInterval, startOfYear } from 'date-fns';
import { id } from 'date-fns/locale';
import { useState } from 'react';
import { useSales } from '@/features/sales/hooks/useSales';
import { usePurchases } from '@/features/purchases/hooks/usePurchases';
import jsPDF from 'jspdf';
import { cn } from '@/lib/utils';

export default function EquityStatement() {
  const [date, setDate] = useState<Date>(new Date());
  const { sales } = useSales();
  const { purchases } = usePurchases();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(value);
  };

  const yearStart = startOfYear(date);
  const monthEnd = endOfMonth(date);

  // Calculate beginning equity (all transactions before current year)
  const previousYearSales = sales.filter((s) => new Date(s.soldAt) < yearStart);
  const previousYearPurchases = purchases.filter((p) => new Date(p.date) < yearStart);
  const beginningEquity = previousYearSales.reduce((sum, s) => sum + s.totalPrice, 0) - 
                          previousYearPurchases.reduce((sum, p) => sum + p.totalCost, 0);

  // Calculate net income for current period (year to date)
  const ytdSales = sales.filter((s) => {
    const saleDate = new Date(s.soldAt);
    return isWithinInterval(saleDate, { start: yearStart, end: monthEnd });
  });
  const ytdPurchases = purchases.filter((p) => {
    const purchaseDate = new Date(p.date);
    return isWithinInterval(purchaseDate, { start: yearStart, end: monthEnd });
  });

  const totalRevenue = ytdSales.reduce((sum, s) => sum + s.totalPrice, 0);
  const totalExpenses = ytdPurchases.reduce((sum, p) => sum + p.totalCost, 0);
  const netIncome = totalRevenue - totalExpenses;

  // For simplicity, assume no additional capital or withdrawals
  const additionalCapital = 0;
  const withdrawals = 0;

  const endingEquity = beginningEquity + netIncome + additionalCapital - withdrawals;

  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text('LAPORAN PERUBAHAN EKUITAS', 105, 20, { align: 'center' });
    doc.setFontSize(11);
    doc.text(`Periode: ${format(yearStart, 'MMMM', { locale: id })} - ${format(date, 'MMMM yyyy', { locale: id })}`, 105, 30, { align: 'center' });
    
    doc.setFontSize(12);
    doc.text(`Ekuitas Awal: ${formatCurrency(beginningEquity)}`, 20, 50);
    doc.text(`Tambah: Laba Bersih: ${formatCurrency(netIncome)}`, 20, 65);
    doc.text(`Ekuitas Akhir: ${formatCurrency(endingEquity)}`, 20, 85);
    
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
        <div className="grid md:grid-cols-2 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Ringkasan Pendapatan</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-1">Total dari {ytdSales.length} transaksi penjualan</p>
              <p className="text-2xl font-bold text-emerald-500">{formatCurrency(totalRevenue)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Ringkasan Beban</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-1">Total dari {ytdPurchases.length} transaksi pembelian</p>
              <p className="text-2xl font-bold text-destructive">{formatCurrency(totalExpenses)}</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}
