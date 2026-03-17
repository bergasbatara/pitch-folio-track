import { useEffect, useMemo, useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CalendarIcon, Download, FileText } from 'lucide-react';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import { useCompanyProfile } from '@/features/onboarding';
import { cn } from '@/lib/utils';
import jsPDF from 'jspdf';
import { useToast } from '@/components/ui/use-toast';

type PeriodType = 'daily' | 'weekly' | 'monthly' | 'yearly';

const PERIOD_OPTIONS: { value: PeriodType; label: string }[] = [
  { value: 'daily', label: 'Harian' },
  { value: 'weekly', label: 'Mingguan' },
  { value: 'monthly', label: 'Bulanan' },
  { value: 'yearly', label: 'Tahunan' },
];

function getDateRange(date: Date, period: PeriodType): { start: Date; end: Date } {
  switch (period) {
    case 'daily':
      return { start: date, end: date };
    case 'weekly':
      return { start: startOfWeek(date, { weekStartsOn: 1 }), end: endOfWeek(date, { weekStartsOn: 1 }) };
    case 'monthly':
      return { start: startOfMonth(date), end: endOfMonth(date) };
    case 'yearly':
      return { start: startOfYear(date), end: endOfYear(date) };
  }
}

function getPeriodLabel(date: Date, period: PeriodType): string {
  switch (period) {
    case 'daily':
      return format(date, 'dd MMMM yyyy', { locale: idLocale });
    case 'weekly': {
      const s = startOfWeek(date, { weekStartsOn: 1 });
      const e = endOfWeek(date, { weekStartsOn: 1 });
      return `${format(s, 'dd MMM', { locale: idLocale })} – ${format(e, 'dd MMM yyyy', { locale: idLocale })}`;
    }
    case 'monthly':
      return format(date, 'MMMM yyyy', { locale: idLocale });
    case 'yearly':
      return format(date, 'yyyy');
  }
}

export default function NotesFS() {
  const [date, setDate] = useState<Date>(new Date());
  const [period, setPeriod] = useState<PeriodType>('monthly');
  const { company } = useCompanyProfile();
  const [report, setReport] = useState<{ totals: { revenue: number; expense: number; netProfit: number; inventoryValue: number } } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const accessToken = useMemo(() => localStorage.getItem('auth_access_token'), []);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(value);
  };

  const { start, end } = getDateRange(date, period);

  useEffect(() => {
    const load = async () => {
      if (!company?.id || !accessToken) return;
      setIsLoading(true);
      try {
        const from = format(start, 'yyyy-MM-dd');
        const to = format(end, 'yyyy-MM-dd');
        const res = await fetch(`${import.meta.env.VITE_API_URL ?? 'http://localhost:3000'}/companies/${company.id}/reports/notes?from=${from}&to=${to}`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.message ?? 'Gagal memuat catatan keuangan');
        }
        const data = await res.json();
        setReport(data);
      } catch (err: any) {
        setReport(null);
        toast({ title: 'Gagal memuat', description: err.message, variant: 'destructive' });
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [company?.id, accessToken, start, end, toast]);

  const totalSales = report?.totals.revenue ?? 0;
  const totalPurchases = report?.totals.expense ?? 0;
  const inventoryValue = report?.totals.inventoryValue ?? 0;

  const periodLabel = getPeriodLabel(date, period);

  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text('CATATAN ATAS LAPORAN KEUANGAN', 105, 20, { align: 'center' });
    doc.setFontSize(11);
    doc.text(company?.name || 'Perusahaan', 105, 30, { align: 'center' });
    doc.text(`Periode: ${periodLabel}`, 105, 38, { align: 'center' });

    doc.setFontSize(12);
    doc.text('1. GAMBARAN UMUM PERUSAHAAN', 20, 55);
    doc.setFontSize(10);
    doc.text(`Nama: ${company?.name || '-'}`, 25, 65);
    doc.text(`Alamat: ${company?.address || '-'}`, 25, 73);
    doc.text(`Telepon: ${company?.phone || '-'}`, 25, 81);

    doc.setFontSize(12);
    doc.text('2. KEBIJAKAN AKUNTANSI', 20, 100);
    doc.setFontSize(10);
    doc.text('Pencatatan menggunakan basis kas.', 25, 110);
    doc.text('Persediaan dicatat dengan metode FIFO.', 25, 118);

    doc.setFontSize(12);
    doc.text('3. RINGKASAN', 20, 135);
    doc.setFontSize(10);
    doc.text(`Total Penjualan: ${formatCurrency(totalSales)}`, 25, 145);
    doc.text(`Total Pembelian: ${formatCurrency(totalPurchases)}`, 25, 153);
    doc.text(`Nilai Persediaan: ${formatCurrency(inventoryValue)}`, 25, 161);

    doc.save(`Catatan_Laporan_Keuangan_${format(start, 'yyyy-MM-dd')}.pdf`);
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <FileText className="h-6 w-6" />
              Catatan atas Laporan Keuangan
            </h1>
            <p className="text-muted-foreground">Informasi tambahan dan penjelasan</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Select value={period} onValueChange={(v) => setPeriod(v as PeriodType)}>
              <SelectTrigger className="w-[130px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PERIOD_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {periodLabel}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={(newDate) => newDate && setDate(newDate)}
                  initialFocus
                  className={cn("p-3 pointer-events-auto")}
                />
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
            <CardTitle>1. Gambaran Umum Perusahaan</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Nama Perusahaan</p>
                <p className="font-medium">{company?.name || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Alamat</p>
                <p className="font-medium">{company?.address || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Telepon</p>
                <p className="font-medium">{company?.phone || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="font-medium">{company?.email || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">NPWP</p>
                <p className="font-medium">{company?.taxId || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Mata Uang</p>
                <p className="font-medium">{company?.currency || 'IDR'}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>2. Kebijakan Akuntansi</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-semibold mb-2">a. Dasar Penyusunan</h4>
              <p className="text-muted-foreground">
                Laporan keuangan disusun berdasarkan prinsip akuntansi yang berlaku umum di Indonesia (SAK EMKM).
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-2">b. Pengakuan Pendapatan</h4>
              <p className="text-muted-foreground">
                Pendapatan diakui pada saat penjualan barang dilakukan dan pembayaran diterima (basis kas).
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-2">c. Persediaan</h4>
              <p className="text-muted-foreground">
                Persediaan dicatat dengan metode FIFO (First In First Out) dan dinilai berdasarkan harga perolehan.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>3. Ringkasan Transaksi</span>
              <span className="text-sm font-normal text-muted-foreground">{periodLabel}</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="p-4 bg-emerald-500/10 rounded-lg">
                <p className="text-sm text-muted-foreground">Total Penjualan</p>
                <p className="text-xl font-bold text-emerald-500">{isLoading ? 'Memuat...' : formatCurrency(totalSales)}</p>
                <p className="text-xs text-muted-foreground mt-1">Periode: {periodLabel}</p>
              </div>
              <div className="p-4 bg-destructive/10 rounded-lg">
                <p className="text-sm text-muted-foreground">Total Pembelian</p>
                <p className="text-xl font-bold text-destructive">{isLoading ? 'Memuat...' : formatCurrency(totalPurchases)}</p>
                <p className="text-xs text-muted-foreground mt-1">Periode: {periodLabel}</p>
              </div>
              <div className="p-4 bg-primary/10 rounded-lg">
                <p className="text-sm text-muted-foreground">Nilai Persediaan</p>
                <p className="text-xl font-bold text-primary">{isLoading ? 'Memuat...' : formatCurrency(inventoryValue)}</p>
                <p className="text-xs text-muted-foreground mt-1">Posisi saat ini</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>4. Penjelasan Tambahan</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-semibold mb-2">a. Piutang Usaha</h4>
              <p className="text-muted-foreground">
                Piutang usaha merupakan tagihan kepada pelanggan atas penjualan secara kredit.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-2">b. Hutang Usaha</h4>
              <p className="text-muted-foreground">
                Hutang usaha merupakan kewajiban kepada supplier atas pembelian secara kredit.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
