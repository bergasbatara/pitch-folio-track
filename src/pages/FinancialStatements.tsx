import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Download, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { useSales } from '@/data/hooks/useSales';
import { usePurchases, usePurchaseCategories } from '@/data/hooks/usePurchases';
import { cn } from '@/lib/utils';
import jsPDF from 'jspdf';

const formatCurrency = (value: number) => {
  return `Rp ${value.toLocaleString('id-ID')}`;
};

export default function FinancialStatements() {
  const [date, setDate] = useState<Date>(new Date());
  const { sales } = useSales();
  const { purchases } = usePurchases();
  const { categories } = usePurchaseCategories();

  // Filter sales by selected date
  const filteredSales = sales.filter((sale) => {
    const saleDate = new Date(sale.soldAt);
    return (
      saleDate.getDate() === date.getDate() &&
      saleDate.getMonth() === date.getMonth() &&
      saleDate.getFullYear() === date.getFullYear()
    );
  });

  // Filter purchases by selected date
  const filteredPurchases = purchases.filter((purchase) => {
    const purchaseDate = new Date(purchase.date);
    return (
      purchaseDate.getDate() === date.getDate() &&
      purchaseDate.getMonth() === date.getMonth() &&
      purchaseDate.getFullYear() === date.getFullYear()
    );
  });

  // Group sales by product
  const salesByProduct = filteredSales.reduce((acc, sale) => {
    if (!acc[sale.productName]) {
      acc[sale.productName] = 0;
    }
    acc[sale.productName] += sale.totalPrice;
    return acc;
  }, {} as Record<string, number>);

  // Group purchases by category
  const purchasesByCategory = filteredPurchases.reduce((acc, purchase) => {
    const category = categories.find((c) => c.id === purchase.categoryId);
    const categoryName = category?.name || 'Lainnya';
    if (!acc[categoryName]) {
      acc[categoryName] = 0;
    }
    acc[categoryName] += purchase.totalCost;
    return acc;
  }, {} as Record<string, number>);

  // Calculations
  const totalPendapatan = filteredSales.reduce((sum, sale) => sum + sale.totalPrice, 0);
  const totalBeban = filteredPurchases.reduce((sum, purchase) => sum + purchase.totalCost, 0);
  const labaRugi = totalPendapatan - totalBeban;

  // All-time calculations for assets
  const totalAsetPenjualan = sales.reduce((sum, sale) => sum + sale.totalPrice, 0);
  const totalUtang = purchases.reduce((sum, purchase) => sum + purchase.totalCost, 0);
  const totalEkuitas = totalAsetPenjualan - totalUtang;

  const exportToPDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    let yPos = 20;
    const lineHeight = 7;
    const margin = 20;
    const contentWidth = pageWidth - margin * 2;

    // Helper functions
    const addTitle = (text: string) => {
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text(text, pageWidth / 2, yPos, { align: 'center' });
      yPos += lineHeight * 1.5;
    };

    const addSectionTitle = (text: string) => {
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text(text, margin, yPos);
      yPos += lineHeight;
    };

    const addLine = (label: string, value: string, bold = false) => {
      doc.setFontSize(10);
      doc.setFont('helvetica', bold ? 'bold' : 'normal');
      doc.text(label, margin + 5, yPos);
      doc.text(value, pageWidth - margin, yPos, { align: 'right' });
      yPos += lineHeight;
    };

    const addSeparator = () => {
      doc.setDrawColor(200, 200, 200);
      doc.line(margin, yPos - 2, pageWidth - margin, yPos - 2);
    };

    const checkPageBreak = () => {
      if (yPos > 270) {
        doc.addPage();
        yPos = 20;
      }
    };

    // Title
    addTitle('LAPORAN KEUANGAN HARIAN');
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.text(`Tanggal: ${format(date, 'dd MMMM yyyy', { locale: id })}`, pageWidth / 2, yPos, { align: 'center' });
    yPos += lineHeight * 2;

    // Pendapatan Harian
    addSectionTitle('PENDAPATAN HARIAN');
    addSeparator();
    if (Object.keys(salesByProduct).length > 0) {
      Object.entries(salesByProduct).forEach(([productName, amount]) => {
        addLine(productName, formatCurrency(amount));
      });
    } else {
      addLine('Tidak ada penjualan', formatCurrency(0));
    }
    yPos += 2;
    addLine('Total Pendapatan', formatCurrency(totalPendapatan), true);
    yPos += lineHeight;
    checkPageBreak();

    // Beban Harian
    addSectionTitle('BEBAN HARIAN');
    addSeparator();
    if (Object.keys(purchasesByCategory).length > 0) {
      Object.entries(purchasesByCategory).forEach(([categoryName, amount]) => {
        addLine(categoryName, formatCurrency(amount));
      });
    } else {
      addLine('Tidak ada pembelian', formatCurrency(0));
    }
    yPos += 2;
    addLine('Total Beban', formatCurrency(totalBeban), true);
    yPos += lineHeight;
    checkPageBreak();

    // Laba Rugi Harian
    addSectionTitle('LABA RUGI HARIAN');
    addSeparator();
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    const labaRugiText = labaRugi >= 0 ? 'LABA' : 'RUGI';
    doc.text(`${labaRugiText}: ${formatCurrency(Math.abs(labaRugi))}`, pageWidth / 2, yPos, { align: 'center' });
    yPos += lineHeight * 2;
    checkPageBreak();

    // Arus Kas Harian
    addSectionTitle('ARUS KAS HARIAN');
    addSeparator();
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Arus Masuk Kas', margin + 5, yPos);
    yPos += lineHeight;
    doc.setFont('helvetica', 'normal');
    if (Object.keys(salesByProduct).length > 0) {
      Object.entries(salesByProduct).forEach(([productName, amount]) => {
        addLine(`  ${productName}`, formatCurrency(amount));
      });
    } else {
      addLine('  -', formatCurrency(0));
    }
    addLine('Total Arus Masuk', formatCurrency(totalPendapatan), true);
    yPos += 3;
    checkPageBreak();

    doc.setFont('helvetica', 'bold');
    doc.text('Arus Keluar Kas', margin + 5, yPos);
    yPos += lineHeight;
    doc.setFont('helvetica', 'normal');
    if (Object.keys(purchasesByCategory).length > 0) {
      Object.entries(purchasesByCategory).forEach(([categoryName, amount]) => {
        addLine(`  ${categoryName}`, formatCurrency(amount));
      });
    } else {
      addLine('  -', formatCurrency(0));
    }
    addLine('Total Arus Keluar', formatCurrency(totalBeban), true);
    yPos += 3;
    addLine('Total Arus Kas', formatCurrency(labaRugi), true);
    yPos += lineHeight;
    checkPageBreak();

    // Saldo Kas Harian
    addSectionTitle('SALDO KAS HARIAN');
    addSeparator();
    addLine('Saldo Kas', formatCurrency(labaRugi), true);
    yPos += lineHeight;
    checkPageBreak();

    // Aktiva dan Kewajiban
    addSectionTitle('AKTIVA DAN KEWAJIBAN (TOTAL)');
    addSeparator();
    addLine('Total Aset (Pendapatan)', formatCurrency(totalAsetPenjualan));
    addLine('Total Kewajiban (Pengeluaran)', formatCurrency(totalUtang));
    yPos += 2;
    addLine('Total Ekuitas', formatCurrency(totalEkuitas), true);

    // Footer
    yPos += lineHeight * 2;
    doc.setFontSize(8);
    doc.setFont('helvetica', 'italic');
    doc.text(`Dicetak pada: ${format(new Date(), 'dd MMMM yyyy HH:mm', { locale: id })}`, pageWidth / 2, yPos, { align: 'center' });
    yPos += lineHeight;
    doc.text('Asia Global Financial', pageWidth / 2, yPos, { align: 'center' });

    // Save the PDF
    doc.save(`Laporan_Keuangan_${format(date, 'yyyy-MM-dd')}.pdf`);
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <FileText className="h-6 w-6" />
              Laporan Keuangan
            </h1>
            <p className="text-muted-foreground">
              Laporan keuangan harian berdasarkan data penjualan dan pembelian
            </p>
          </div>
          <div className="flex gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="justify-start text-left font-normal">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {format(date, 'dd MMMM yyyy', { locale: id })}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={(newDate) => newDate && setDate(newDate)}
                  initialFocus
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
            <Button onClick={exportToPDF} className="gap-2">
              <Download className="h-4 w-4" />
              Ekspor PDF
            </Button>
          </div>
        </div>

        {/* Report Date */}
        <div className="text-center py-4 border-b border-border">
          <h2 className="text-lg font-semibold">
            Tanggal Laporan: {format(date, 'dd MMMM yyyy', { locale: id })}
          </h2>
        </div>

        {/* Pendapatan Harian */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Pendapatan Harian</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {Object.keys(salesByProduct).length > 0 ? (
                Object.entries(salesByProduct).map(([productName, amount]) => (
                  <div key={productName} className="flex justify-between py-2 border-b border-border/50">
                    <span className="text-muted-foreground">{productName}</span>
                    <span>{formatCurrency(amount)}</span>
                  </div>
                ))
              ) : (
                <div className="flex justify-between py-2 border-b border-border/50">
                  <span className="text-muted-foreground italic">Tidak ada penjualan</span>
                  <span>{formatCurrency(0)}</span>
                </div>
              )}
              <div className="flex justify-between py-2 font-bold">
                <span>Total Pendapatan</span>
                <span>{formatCurrency(totalPendapatan)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Beban Harian */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Beban Harian</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {Object.keys(purchasesByCategory).length > 0 ? (
                Object.entries(purchasesByCategory).map(([categoryName, amount]) => (
                  <div key={categoryName} className="flex justify-between py-2 border-b border-border/50">
                    <span className="text-muted-foreground">{categoryName}</span>
                    <span>{formatCurrency(amount)}</span>
                  </div>
                ))
              ) : (
                <div className="flex justify-between py-2 border-b border-border/50">
                  <span className="text-muted-foreground italic">Tidak ada pembelian</span>
                  <span>{formatCurrency(0)}</span>
                </div>
              )}
              <div className="flex justify-between py-2 font-bold">
                <span>Total Beban</span>
                <span>{formatCurrency(totalBeban)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Laba Rugi Harian */}
        <Card className={cn(labaRugi >= 0 ? 'border-emerald-500/50' : 'border-destructive/50')}>
          <CardContent className="py-4">
            <div className="flex justify-between items-center">
              <span className="text-lg font-bold">Laba Rugi Harian</span>
              <span className={cn(
                'text-xl font-bold',
                labaRugi >= 0 ? 'text-emerald-500' : 'text-destructive'
              )}>
                {formatCurrency(labaRugi)}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Arus Kas Harian */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Arus Kas Harian</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Arus Masuk */}
              <div>
                <h4 className="font-semibold text-muted-foreground mb-2">Arus Masuk Kas</h4>
                <div className="space-y-2 pl-4">
                  {Object.keys(salesByProduct).length > 0 ? (
                    Object.entries(salesByProduct).map(([productName, amount]) => (
                      <div key={productName} className="flex justify-between py-1">
                        <span className="text-muted-foreground">{productName}</span>
                        <span>{formatCurrency(amount)}</span>
                      </div>
                    ))
                  ) : (
                    <div className="flex justify-between py-1">
                      <span className="text-muted-foreground italic">-</span>
                      <span>{formatCurrency(0)}</span>
                    </div>
                  )}
                </div>
                <div className="flex justify-between py-2 font-semibold border-t border-border/50 mt-2">
                  <span>Total Arus Masuk</span>
                  <span>{formatCurrency(totalPendapatan)}</span>
                </div>
              </div>

              {/* Arus Keluar */}
              <div>
                <h4 className="font-semibold text-muted-foreground mb-2">Arus Keluar Kas</h4>
                <div className="space-y-2 pl-4">
                  {Object.keys(purchasesByCategory).length > 0 ? (
                    Object.entries(purchasesByCategory).map(([categoryName, amount]) => (
                      <div key={categoryName} className="flex justify-between py-1">
                        <span className="text-muted-foreground">{categoryName}</span>
                        <span>{formatCurrency(amount)}</span>
                      </div>
                    ))
                  ) : (
                    <div className="flex justify-between py-1">
                      <span className="text-muted-foreground italic">-</span>
                      <span>{formatCurrency(0)}</span>
                    </div>
                  )}
                </div>
                <div className="flex justify-between py-2 font-semibold border-t border-border/50 mt-2">
                  <span>Total Arus Keluar</span>
                  <span>{formatCurrency(totalBeban)}</span>
                </div>
              </div>

              {/* Total Arus Kas */}
              <div className="flex justify-between py-2 font-bold border-t border-border">
                <span>Total Arus Kas</span>
                <span className={cn(labaRugi >= 0 ? 'text-emerald-500' : 'text-destructive')}>
                  {formatCurrency(labaRugi)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Saldo Kas Harian */}
        <Card className="bg-muted/50">
          <CardContent className="py-4">
            <div className="flex justify-between items-center">
              <span className="text-lg font-bold">Saldo Kas Harian</span>
              <span className={cn(
                'text-xl font-bold',
                labaRugi >= 0 ? 'text-emerald-500' : 'text-destructive'
              )}>
                {formatCurrency(labaRugi)}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Aktiva dan Kewajiban */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Aktiva dan Kewajiban (Total)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between py-2 border-b border-border/50">
                <span className="text-muted-foreground">Total Aset (Pendapatan)</span>
                <span>{formatCurrency(totalAsetPenjualan)}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-border/50">
                <span className="text-muted-foreground">Total Kewajiban (Pengeluaran)</span>
                <span>{formatCurrency(totalUtang)}</span>
              </div>
              <div className="flex justify-between py-2 font-bold">
                <span>Total Ekuitas</span>
                <span className={cn(totalEkuitas >= 0 ? 'text-emerald-500' : 'text-destructive')}>
                  {formatCurrency(totalEkuitas)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
