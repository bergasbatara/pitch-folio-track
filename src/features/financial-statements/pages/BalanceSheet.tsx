import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Download, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { useState } from 'react';
import { useSales } from '@/features/sales/hooks/useSales';
import { usePurchases } from '@/features/purchases/hooks/usePurchases';
import { useReceivables, usePayables } from '@/features/receivables/hooks/useReceivables';
import { useProducts } from '@/features/products/hooks/useProducts';
import { useCompanyProfile } from '@/features/onboarding';
import jsPDF from 'jspdf';

export default function BalanceSheet() {
  const [date, setDate] = useState<Date>(new Date());
  const { sales } = useSales();
  const { purchases } = usePurchases();
  const { getTotalReceivables } = useReceivables();
  const { getTotalPayables } = usePayables();
  const { company } = useCompanyProfile();
  const { products } = useProducts(company?.id);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(value);
  };

  // Calculate assets
  const totalSales = sales.reduce((sum, s) => sum + s.totalPrice, 0);
  const totalPurchases = purchases.reduce((sum, p) => sum + p.totalCost, 0);
  const cashBalance = totalSales - totalPurchases;
  const inventoryValue = products.reduce((sum, p) => sum + (p.price * p.stock), 0);
  const accountsReceivable = getTotalReceivables();
  const totalCurrentAssets = cashBalance + inventoryValue + accountsReceivable;
  
  // Calculate liabilities
  const accountsPayable = getTotalPayables();
  const totalLiabilities = accountsPayable;
  
  // Calculate equity
  const totalEquity = totalCurrentAssets - totalLiabilities;

  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text('NERACA (BALANCE SHEET)', 105, 20, { align: 'center' });
    doc.setFontSize(11);
    doc.text(`Per ${format(date, 'dd MMMM yyyy', { locale: id })}`, 105, 30, { align: 'center' });
    
    doc.setFontSize(12);
    doc.text('ASET', 20, 50);
    doc.text(`Kas: ${formatCurrency(cashBalance)}`, 25, 60);
    doc.text(`Piutang Usaha: ${formatCurrency(accountsReceivable)}`, 25, 70);
    doc.text(`Persediaan: ${formatCurrency(inventoryValue)}`, 25, 80);
    doc.text(`Total Aset: ${formatCurrency(totalCurrentAssets)}`, 20, 95);
    
    doc.text('KEWAJIBAN', 20, 115);
    doc.text(`Hutang Usaha: ${formatCurrency(accountsPayable)}`, 25, 125);
    doc.text(`Total Kewajiban: ${formatCurrency(totalLiabilities)}`, 20, 140);
    
    doc.text('EKUITAS', 20, 160);
    doc.text(`Modal Pemilik: ${formatCurrency(totalEquity)}`, 25, 170);
    
    doc.save(`Neraca_${format(date, 'yyyy-MM-dd')}.pdf`);
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <FileText className="h-6 w-6" />
              Neraca
            </h1>
            <p className="text-muted-foreground">Laporan posisi keuangan</p>
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
                <Calendar mode="single" selected={date} onSelect={(d) => d && setDate(d)} initialFocus />
              </PopoverContent>
            </Popover>
            <Button onClick={exportToPDF} className="gap-2">
              <Download className="h-4 w-4" />
              Ekspor PDF
            </Button>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Assets */}
          <Card>
            <CardHeader className="bg-primary/5">
              <CardTitle>ASET</CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Aset Lancar</h3>
                <div className="space-y-2 pl-4">
                  <div className="flex justify-between"><span>Kas</span><span>{formatCurrency(cashBalance)}</span></div>
                  <div className="flex justify-between"><span>Piutang Usaha</span><span>{formatCurrency(accountsReceivable)}</span></div>
                  <div className="flex justify-between"><span>Persediaan</span><span>{formatCurrency(inventoryValue)}</span></div>
                </div>
              </div>
              <div className="border-t pt-4">
                <div className="flex justify-between font-bold text-lg">
                  <span>Total Aset</span>
                  <span className="text-primary">{formatCurrency(totalCurrentAssets)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Liabilities & Equity */}
          <Card>
            <CardHeader className="bg-destructive/5">
              <CardTitle>KEWAJIBAN & EKUITAS</CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Kewajiban Lancar</h3>
                <div className="space-y-2 pl-4">
                  <div className="flex justify-between"><span>Hutang Usaha</span><span>{formatCurrency(accountsPayable)}</span></div>
                </div>
                <div className="flex justify-between font-medium mt-2 pl-4">
                  <span>Total Kewajiban</span>
                  <span>{formatCurrency(totalLiabilities)}</span>
                </div>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Ekuitas</h3>
                <div className="space-y-2 pl-4">
                  <div className="flex justify-between"><span>Modal Pemilik</span><span>{formatCurrency(totalEquity)}</span></div>
                </div>
              </div>
              <div className="border-t pt-4">
                <div className="flex justify-between font-bold text-lg">
                  <span>Total Kewajiban & Ekuitas</span>
                  <span className="text-primary">{formatCurrency(totalCurrentAssets)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}
