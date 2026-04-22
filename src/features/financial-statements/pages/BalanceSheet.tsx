import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Download, FileText } from 'lucide-react';
import { format, subMonths } from 'date-fns';
import { id } from 'date-fns/locale';
import { useEffect, useMemo, useState } from 'react';
import { useCompanyProfile } from '@/features/onboarding';
import jsPDF from 'jspdf';
import { useErrorToast } from '@/shared/hooks/useErrorToast';
import { useToast } from '@/components/ui/use-toast';

type BalanceSnapshot = {
  asOf: string;
  categories: {
    cash: number;
    receivable: number;
    inventory: number;
    prepaid: number;
    prepaidTax: number;
    otherCurrentAssets: number;
    fixedAssetsGross: number;
    accumulatedDepreciation: number;
    fixedAssetsNet: number;
    payables: number;
    bankDebtShort: number;
    otherCurrentLiabilities: number;
    bankDebtLong: number;
    financingDebt: number;
    equityCapital: number;
    retainedEarnings: number;
    totalCurrentAssets: number;
    totalNonCurrentAssets: number;
    totalAssets: number;
    totalCurrentLiabilities: number;
    totalLongTermLiabilities: number;
    totalLiabilities: number;
    totalEquity: number;
  };
};

export default function BalanceSheet() {
  const [date, setDate] = useState<Date>(new Date());
  const { company, error: companyError } = useCompanyProfile();
  const [balance, setBalance] = useState<BalanceSnapshot | null>(null);
  const [prevBalance, setPrevBalance] = useState<BalanceSnapshot | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const { toast } = useToast();
  useErrorToast(companyError, 'Gagal memuat perusahaan');
  useErrorToast(loadError, 'Gagal memuat neraca');

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(value);
  };

  const emptyCategories: BalanceSnapshot['categories'] = useMemo(() => ({
    cash: 0,
    receivable: 0,
    inventory: 0,
    prepaid: 0,
    prepaidTax: 0,
    otherCurrentAssets: 0,
    fixedAssetsGross: 0,
    accumulatedDepreciation: 0,
    fixedAssetsNet: 0,
    payables: 0,
    bankDebtShort: 0,
    otherCurrentLiabilities: 0,
    bankDebtLong: 0,
    financingDebt: 0,
    equityCapital: 0,
    retainedEarnings: 0,
    totalCurrentAssets: 0,
    totalNonCurrentAssets: 0,
    totalAssets: 0,
    totalCurrentLiabilities: 0,
    totalLongTermLiabilities: 0,
    totalLiabilities: 0,
    totalEquity: 0,
  }), []);

  useEffect(() => {
    const load = async () => {
      if (!company?.id) return;
      setLoadError(null);
      try {
        const apiBase = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';
        const asOf = format(date, 'yyyy-MM-dd');
        const prevDate = subMonths(date, 1);
        const prevAsOf = format(prevDate, 'yyyy-MM-dd');

        const fetchBalance = async (value: string) => {
          const res = await fetch(`${apiBase}/companies/${company.id}/reports/balance?asOf=${value}&ts=${Date.now()}`, {
            cache: 'no-store',
            credentials: 'include',
          });
          if (!res.ok) {
            const body = await res.json().catch(() => ({}));
            throw new Error(body.message ?? 'Gagal memuat neraca');
          }
          return res.json();
        };

        const [currentData, prevData] = await Promise.all([
          fetchBalance(asOf),
          fetchBalance(prevAsOf),
        ]);
        setBalance(currentData);
        setPrevBalance(prevData);
      } catch (err: any) {
        setBalance(null);
        setPrevBalance(null);
        setLoadError(err.message ?? 'Gagal memuat neraca');
        toast({ title: 'Gagal memuat', description: err.message, variant: 'destructive' });
      }
    };
    load();
  }, [company?.id, date, toast]);

  const categories = balance?.categories ?? emptyCategories;
  const prevCategories = prevBalance?.categories ?? emptyCategories;

  const cashBalance = categories.cash;
  const accountsReceivable = categories.receivable;
  const inventoryValue = categories.inventory;
  const prepaidValue = categories.prepaid;
  const otherCurrentAssets = categories.otherCurrentAssets;
  const fixedAssetsGross = categories.fixedAssetsGross;
  const fixedAssetsNet = categories.fixedAssetsNet;

  const totalCurrentAssets = categories.totalCurrentAssets;
  const totalAssets = categories.totalAssets;

  const accountsPayable = categories.payables;
  const bankDebtShort = categories.bankDebtShort;
  const otherCurrentLiabilities = categories.otherCurrentLiabilities;
  const bankDebtLong = categories.bankDebtLong;
  const financingDebt = categories.financingDebt;

  const totalLiabilities = categories.totalLiabilities;
  const totalEquity = categories.totalEquity;
  const equityCapital = categories.equityCapital;
  const retainedEarnings = categories.retainedEarnings;

  const exportToPDF = () => {
    const doc = new jsPDF('p', 'mm', 'a4');
    const pageW = 210;
    const marginL = 15;
    const marginR = 15;
    const contentW = pageW - marginL - marginR;
    const periodLabel = format(date, 'dd MMMM yyyy', { locale: id });
    const prevPeriodLabel = format(subMonths(date, 1), 'dd MMMM yyyy', { locale: id });

    const fmtNum = (v: number) => {
      if (v === 0) return '-';
      return new Intl.NumberFormat('id-ID').format(v);
    };

    // Header
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(company?.name || '[Nama Perusahaan]', marginL, 18);
    doc.setFontSize(11);
    doc.text('Laporan Neraca', marginL, 24);
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
    const colCat = marginL + 105;
    const colP2 = marginL + 135;
    const colP1 = pageW - marginR;

    let y = 46;

    // Table header
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('Pos', colPos, y);
    doc.text('Catatan', colCat, y, { align: 'right' });
    doc.text(periodLabel, colP2 + 15, y, { align: 'right' });
    doc.text(prevPeriodLabel, colP1, y, { align: 'right' });
    doc.setLineWidth(0.5);
    doc.line(marginL, y + 2, pageW - marginR, y + 2);
    y += 7;

    const addRow = (label: string, catatan: string, val2: string, val1: string, bold = false, indent = 0) => {
      doc.setFont('helvetica', bold ? 'bold' : 'normal');
      doc.text(label, colPos + indent, y);
      if (catatan) doc.text(catatan, colCat, y, { align: 'right' });
      doc.text(val2, colP2 + 15, y, { align: 'right' });
      doc.text(val1, colP1, y, { align: 'right' });
      y += 5.5;
    };

    const addSectionHeader = (label: string) => {
      doc.setFont('helvetica', 'bold');
      doc.text(label, colPos, y);
      y += 5.5;
    };

    // ASET
    addSectionHeader('Aset');
    addSectionHeader('Aset Lancar');
    addRow('Kas', '3', fmtNum(cashBalance), fmtNum(prevCategories.cash), false, 4);
    addRow('Piutang Usaha', '4', fmtNum(accountsReceivable), fmtNum(prevCategories.receivable), false, 4);
    addRow('Persediaan', '5', fmtNum(inventoryValue), fmtNum(prevCategories.inventory), false, 4);
    addRow('Biaya Dibayar Dimuka (Down Payment)', '6', fmtNum(prepaidValue), fmtNum(prevCategories.prepaid), false, 4);
    addRow('Aset Lancar Lainnya', '7', fmtNum(otherCurrentAssets), fmtNum(prevCategories.otherCurrentAssets), false, 4);
    addRow('Total Aset Lancar', '', fmtNum(totalCurrentAssets), fmtNum(prevCategories.totalCurrentAssets), true);
    y += 2;

    addSectionHeader('Aset Tetap (Tidak Lancar)');
    addRow('Peralatan', '8', fmtNum(fixedAssetsGross), fmtNum(prevCategories.fixedAssetsGross), false, 4);
    addRow('Total Aset Tidak Lancar', '', fmtNum(fixedAssetsNet), fmtNum(prevCategories.fixedAssetsNet), true);
    y += 2;
    addRow('Total Aset', '', fmtNum(totalAssets), fmtNum(prevCategories.totalAssets), true);

    y += 4;
    doc.setLineWidth(0.3);
    doc.line(marginL, y, pageW - marginR, y);
    y += 6;

    // LIABILITAS
    addSectionHeader('Liabilitas');
    addSectionHeader('Liabilitas Jangka Pendek');
    addRow('Utang Usaha', '9a.', fmtNum(accountsPayable), fmtNum(prevCategories.payables), false, 4);
    addRow('Utang Bank dan Lembaga Keuangan Lainnya', '9b.', fmtNum(bankDebtShort), fmtNum(prevCategories.bankDebtShort), false, 4);
    addRow('Kewajiban Jangka Pendek Lainnya', '9c.', fmtNum(otherCurrentLiabilities), fmtNum(prevCategories.otherCurrentLiabilities), false, 4);
    addRow('Total Liabilitas Jangka Pendek', '', fmtNum(categories.totalCurrentLiabilities), fmtNum(prevCategories.totalCurrentLiabilities), true);
    y += 2;

    addSectionHeader('Liabilitas Jangka Panjang');
    addRow('Utang Bank (Jth Tempo Lebih dari 1 Tahun)', '10a.', fmtNum(bankDebtLong), fmtNum(prevCategories.bankDebtLong), false, 4);
    addRow('Utang Pembiayaan dan Utang Lainnya', '10b.', fmtNum(financingDebt), fmtNum(prevCategories.financingDebt), false, 4);
    addRow('Total Liabilitas Jangka Panjang', '', fmtNum(categories.totalLongTermLiabilities), fmtNum(prevCategories.totalLongTermLiabilities), true);
    y += 2;
    addRow('Total Liabilitas', '', fmtNum(totalLiabilities), fmtNum(prevCategories.totalLiabilities), true);

    y += 4;
    doc.setLineWidth(0.3);
    doc.line(marginL, y, pageW - marginR, y);
    y += 6;

    // EKUITAS
    addSectionHeader('Ekuitas');
    addRow('Modal Pemilik', '11', fmtNum(equityCapital), fmtNum(prevCategories.equityCapital), false, 4);
    addRow('Saldo Laba', '', fmtNum(retainedEarnings), fmtNum(prevCategories.retainedEarnings), false, 4);
    addRow('Total Modal', '', fmtNum(totalEquity), fmtNum(prevCategories.totalEquity), true);
    y += 2;
    addRow('Total Kewajiban dan Modal', '', fmtNum(totalAssets), fmtNum(prevCategories.totalAssets), true);

    y += 6;
    doc.setFontSize(8);
    doc.setFont('helvetica', 'italic');
    const footer = 'Lihat catatan atas laporan keuangan terlampir yang merupakan bagian yang tidak terpisahkan dari laporan keuangan secara keseluruhan';
    const footerLines = doc.splitTextToSize(footer, contentW);
    doc.text(footerLines, marginL, y);

    // Page number
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text('1+1', pageW / 2, 285, { align: 'center' });

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
                  <span className="text-primary">{formatCurrency(totalAssets)}</span>
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
                  <div className="flex justify-between"><span>Modal Pemilik</span><span>{formatCurrency(equityCapital)}</span></div>
                  <div className="flex justify-between"><span>Saldo Laba</span><span>{formatCurrency(retainedEarnings)}</span></div>
                </div>
              </div>
              <div className="border-t pt-4">
                <div className="flex justify-between font-bold text-lg">
                  <span>Total Kewajiban & Ekuitas</span>
                  <span className="text-primary">{formatCurrency(totalAssets)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}
