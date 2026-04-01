import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { CalendarIcon, Download, Calculator } from 'lucide-react';
import { format, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import { id } from 'date-fns/locale';
import { useState } from 'react';
import { useSales } from '@/features/sales/hooks/useSales';
import { usePurchases } from '@/features/purchases/hooks/usePurchases';
import { useProducts } from '@/features/products/hooks/useProducts';
import { useCompanyProfile } from '@/features/onboarding';
import jsPDF from 'jspdf';
import { useErrorToast } from '@/shared/hooks/useErrorToast';

export default function COGS() {
  const [date, setDate] = useState<Date>(new Date());
  const { company, error: companyError } = useCompanyProfile();
  const { sales, error: salesError } = useSales(company?.id);
  const { purchases, error: purchasesError } = usePurchases(company?.id);
  const { products, error: productsError } = useProducts(company?.id);
  useErrorToast(companyError, 'Gagal memuat perusahaan');
  useErrorToast(salesError, 'Gagal memuat penjualan');
  useErrorToast(purchasesError, 'Gagal memuat pembelian');
  useErrorToast(productsError, 'Gagal memuat produk');

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

  // Calculate beginning inventory (simplified - current inventory + sold - purchased)
  const currentInventoryValue = products.reduce((sum, p) => sum + (p.price * p.stock), 0);
  const soldValue = monthlySales.reduce((sum, s) => sum + s.totalPrice, 0);
  const purchasedValue = monthlyPurchases.reduce((sum, p) => sum + p.totalCost, 0);

  // COGS = Beginning Inventory + Purchases - Ending Inventory
  const beginningInventory = currentInventoryValue + soldValue - purchasedValue;
  const endingInventory = currentInventoryValue;
  const cogs = beginningInventory + purchasedValue - endingInventory;

  // Gross Profit
  const totalRevenue = soldValue;
  const grossProfit = totalRevenue - cogs;
  const grossProfitMargin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;

  // Sales by product
  const salesByProduct = monthlySales.reduce((acc, sale) => {
    if (!acc[sale.productName]) {
      acc[sale.productName] = { quantity: 0, revenue: 0 };
    }
    acc[sale.productName].quantity += sale.quantity;
    acc[sale.productName].revenue += sale.totalPrice;
    return acc;
  }, {} as Record<string, { quantity: number; revenue: number }>);

  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text('LAPORAN HARGA POKOK PENJUALAN (HPP)', 105, 20, { align: 'center' });
    doc.setFontSize(11);
    doc.text(`Periode: ${format(date, 'MMMM yyyy', { locale: id })}`, 105, 30, { align: 'center' });
    
    doc.setFontSize(12);
    doc.text(`Persediaan Awal: ${formatCurrency(beginningInventory)}`, 20, 50);
    doc.text(`Pembelian: ${formatCurrency(purchasedValue)}`, 20, 60);
    doc.text(`Persediaan Akhir: (${formatCurrency(endingInventory)})`, 20, 70);
    doc.text(`HPP: ${formatCurrency(cogs)}`, 20, 85);
    doc.text(`Pendapatan: ${formatCurrency(totalRevenue)}`, 20, 100);
    doc.text(`Laba Kotor: ${formatCurrency(grossProfit)}`, 20, 110);
    doc.text(`Margin Laba Kotor: ${grossProfitMargin.toFixed(1)}%`, 20, 120);
    
    doc.save(`HPP_${format(date, 'yyyy-MM')}.pdf`);
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Calculator className="h-6 w-6" />
              Harga Pokok Penjualan (HPP)
            </h1>
            <p className="text-muted-foreground">Perhitungan biaya produk yang terjual</p>
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
        <div className="grid md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">Persediaan Awal</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xl font-bold">{formatCurrency(beginningInventory)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">Pembelian</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xl font-bold">+{formatCurrency(purchasedValue)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">Persediaan Akhir</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xl font-bold">-{formatCurrency(endingInventory)}</p>
            </CardContent>
          </Card>
          <Card className="border-primary/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">HPP</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xl font-bold text-primary">{formatCurrency(cogs)}</p>
            </CardContent>
          </Card>
        </div>

        {/* Gross Profit */}
        <Card>
          <CardHeader>
            <CardTitle>Perhitungan Laba Kotor</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between py-2">
              <span>Pendapatan Penjualan</span>
              <span className="font-semibold">{formatCurrency(totalRevenue)}</span>
            </div>
            <div className="flex justify-between py-2 text-destructive">
              <span>Dikurangi: Harga Pokok Penjualan</span>
              <span className="font-semibold">({formatCurrency(cogs)})</span>
            </div>
            <div className="border-t pt-4 flex justify-between">
              <span className="font-bold text-lg">Laba Kotor</span>
              <div className="text-right">
                <p className="text-2xl font-bold text-emerald-500">{formatCurrency(grossProfit)}</p>
                <p className="text-sm text-muted-foreground">Margin: {grossProfitMargin.toFixed(1)}%</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Product Sales Detail */}
        <Card>
          <CardHeader>
            <CardTitle>Detail Penjualan per Produk</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Produk</TableHead>
                  <TableHead className="text-right">Kuantitas</TableHead>
                  <TableHead className="text-right">Pendapatan</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Object.entries(salesByProduct).map(([productName, data]) => (
                  <TableRow key={productName}>
                    <TableCell className="font-medium">{productName}</TableCell>
                    <TableCell className="text-right">{data.quantity}</TableCell>
                    <TableCell className="text-right">{formatCurrency(data.revenue)}</TableCell>
                  </TableRow>
                ))}
                {Object.keys(salesByProduct).length === 0 && (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center text-muted-foreground py-8">
                      Belum ada penjualan di bulan ini
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
