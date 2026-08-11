import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { CalendarIcon, Download, Calculator } from 'lucide-react';
import { format, startOfMonth, endOfMonth, subDays } from 'date-fns';
import { id } from 'date-fns/locale';
import { useEffect, useMemo, useState } from 'react';
import { useCompanyProfile } from '@/features/onboarding';
import jsPDF from 'jspdf';
import { useErrorToast } from '@/shared/hooks/useErrorToast';
import { useToast } from '@/components/ui/use-toast';

type ReportData = {
  totals: {
    revenue: number;
  };
  accounts: Array<{
    id: string;
    code: string;
    name: string;
    type: string;
    net: number;
  }>;
};

type BalanceSnapshot = {
  categories: {
    inventory: number;
  };
};

export default function COGS() {
  const [date, setDate] = useState<Date>(new Date());
  const { company, error: companyError } = useCompanyProfile();
  const [report, setReport] = useState<ReportData | null>(null);
  const [startBalance, setStartBalance] = useState<BalanceSnapshot | null>(null);
  const [endBalance, setEndBalance] = useState<BalanceSnapshot | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const { toast } = useToast();
  useErrorToast(companyError, 'Gagal memuat perusahaan');
  useErrorToast(loadError, 'Gagal memuat HPP');

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(value);
  };

  const monthStart = startOfMonth(date);
  const monthEnd = endOfMonth(date);
  const emptyCategories = useMemo(() => ({ inventory: 0 }), []);

  useEffect(() => {
    const load = async () => {
      if (!company?.id) return;
      setLoadError(null);
      try {
        const apiBase = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';
        const from = format(monthStart, 'yyyy-MM-dd');
        const to = format(monthEnd, 'yyyy-MM-dd');
        const startAsOf = format(subDays(monthStart, 1), 'yyyy-MM-dd');
        const endAsOf = format(monthEnd, 'yyyy-MM-dd');

        const fetchJson = async (url: string) => {
          const res = await fetch(url, { cache: 'no-store', credentials: 'include' });
          if (!res.ok) {
            const body = await res.json().catch(() => ({}));
            throw new Error(body.message ?? 'Gagal memuat HPP');
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
        setLoadError(err.message ?? 'Gagal memuat HPP');
        toast({ title: 'Gagal memuat', description: err.message, variant: 'destructive' });
      }
    };
    load();
  }, [company?.id, monthStart, monthEnd, toast]);

  const sumByKeywords = (keywords: string[]) =>
    (report?.accounts ?? [])
      .filter((acc) => acc.type === 'expense' && keywords.some((kw) => acc.name.toLowerCase().includes(kw)))
      .reduce((sum, acc) => sum + acc.net, 0);

  const startCategories = startBalance?.categories ?? emptyCategories;
  const endCategories = endBalance?.categories ?? emptyCategories;
  const beginningInventory = startCategories.inventory;
  const endingInventory = endCategories.inventory;
  const purchasedValue = sumByKeywords(['pembelian']);
  const reportedCogs = sumByKeywords(['hpp', 'harga pokok penjualan']);
  const calculatedCogs = beginningInventory + purchasedValue - endingInventory;
  const cogs = reportedCogs !== 0 ? reportedCogs : calculatedCogs;
  const totalRevenue = report?.totals.revenue ?? 0;
  const grossProfit = totalRevenue - cogs;
  const grossProfitMargin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;
  const hppComponents = [
    { label: 'Persediaan Awal', value: beginningInventory },
    { label: 'Pembelian Bersih', value: purchasedValue },
    { label: 'Persediaan Akhir', value: -endingInventory },
    { label: reportedCogs !== 0 ? 'HPP dari Jurnal Expense' : 'HPP Terkalkulasi', value: cogs },
  ];

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

        {/* COGS Detail */}
        <Card>
          <CardHeader>
            <CardTitle>Rincian Perhitungan HPP</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Komponen</TableHead>
                  <TableHead className="text-right">Nilai</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {hppComponents.map((item) => (
                  <TableRow key={item.label}>
                    <TableCell className="font-medium">{item.label}</TableCell>
                    <TableCell className="text-right">{formatCurrency(item.value)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
