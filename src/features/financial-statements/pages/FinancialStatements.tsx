import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Download, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { useSales } from '@/features/sales/hooks/useSales';
import { useCompanyProfile } from '@/features/onboarding';
import { usePurchases, usePurchaseCategories } from '@/features/purchases/hooks/usePurchases';
import { cn } from '@/lib/utils';
import jsPDF from 'jspdf';

const formatCurrency = (value: number) => {
  return `Rp ${value.toLocaleString('id-ID')}`;
};

export default function FinancialStatements() {
  const [date, setDate] = useState<Date>(new Date());
  const { company } = useCompanyProfile();
  const { sales } = useSales(company?.id);
  const { purchases } = usePurchases();
  const { categories } = usePurchaseCategories();

  const filteredSales = sales.filter((sale) => {
    const saleDate = new Date(sale.soldAt);
    return saleDate.getDate() === date.getDate() && saleDate.getMonth() === date.getMonth() && saleDate.getFullYear() === date.getFullYear();
  });

  const filteredPurchases = purchases.filter((purchase) => {
    const purchaseDate = new Date(purchase.date);
    return purchaseDate.getDate() === date.getDate() && purchaseDate.getMonth() === date.getMonth() && purchaseDate.getFullYear() === date.getFullYear();
  });

  const salesByProduct = filteredSales.reduce((acc, sale) => {
    acc[sale.productName] = (acc[sale.productName] || 0) + sale.totalPrice;
    return acc;
  }, {} as Record<string, number>);

  const purchasesByCategory = filteredPurchases.reduce((acc, purchase) => {
    const category = categories.find((c) => c.id === purchase.categoryId);
    const categoryName = category?.name || 'Lainnya';
    acc[categoryName] = (acc[categoryName] || 0) + purchase.totalCost;
    return acc;
  }, {} as Record<string, number>);

  const totalPendapatan = filteredSales.reduce((sum, sale) => sum + sale.totalPrice, 0);
  const totalBeban = filteredPurchases.reduce((sum, purchase) => sum + purchase.totalCost, 0);
  const labaRugi = totalPendapatan - totalBeban;
  const totalAsetPenjualan = sales.reduce((sum, sale) => sum + sale.totalPrice, 0);
  const totalUtang = purchases.reduce((sum, purchase) => sum + purchase.totalCost, 0);
  const totalEkuitas = totalAsetPenjualan - totalUtang;

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
                {formatCurrency(labaRugi)}
              </span>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-lg">Pendapatan</CardTitle></CardHeader>
            <CardContent>
              {Object.entries(salesByProduct).map(([name, amount]) => (
                <div key={name} className="flex justify-between py-2 border-b border-border/50">
                  <span>{name}</span><span>{formatCurrency(amount)}</span>
                </div>
              ))}
              <div className="flex justify-between py-2 font-bold"><span>Total</span><span>{formatCurrency(totalPendapatan)}</span></div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-lg">Beban</CardTitle></CardHeader>
            <CardContent>
              {Object.entries(purchasesByCategory).map(([name, amount]) => (
                <div key={name} className="flex justify-between py-2 border-b border-border/50">
                  <span>{name}</span><span>{formatCurrency(amount)}</span>
                </div>
              ))}
              <div className="flex justify-between py-2 font-bold"><span>Total</span><span>{formatCurrency(totalBeban)}</span></div>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}
