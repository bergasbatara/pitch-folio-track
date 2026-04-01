import { useEffect, useMemo, useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CalendarIcon, ChevronDown, Download, FileText } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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

  const { start, end } = useMemo(() => getDateRange(date, period), [date, period]);
  const from = useMemo(() => format(start, 'yyyy-MM-dd'), [start]);
  const to = useMemo(() => format(end, 'yyyy-MM-dd'), [end]);

  useEffect(() => {
    const load = async () => {
      if (!company?.id || !accessToken) return;
      setIsLoading(true);
      try {
        const url = `${import.meta.env.VITE_API_URL ?? 'http://localhost:3000'}/companies/${company.id}/reports/notes?from=${from}&to=${to}&ts=${Date.now()}`;
        const res = await fetch(url, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Cache-Control': 'no-cache',
            Pragma: 'no-cache',
          },
          cache: 'no-store',
        });
        if (res.status === 304) {
          return;
        }
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
  }, [company?.id, accessToken, from, to, toast]);

  const totalSales = report?.totals.revenue ?? 0;
  const totalPurchases = report?.totals.expense ?? 0;
  const inventoryValue = report?.totals.inventoryValue ?? 0;

  const periodLabel = getPeriodLabel(date, period);

  const exportToPDF = () => {
    const doc = new jsPDF('p', 'mm', 'a4');
    const pageW = 210;
    const marginL = 20;
    const marginR = 20;
    const contentW = pageW - marginL - marginR;
    const totalPages = 5;
    let pageNum = 1;

    const addPageNumber = () => {
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text(`${pageNum}+${totalPages}`, pageW / 2, 285, { align: 'center' });
    };

    const addHeader = () => {
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text(company?.name || '[Nama Perusahaan]', marginL, 20);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('Catatan atas laporan keuangan', marginL, 26);
      doc.setFont('helvetica', 'normal');
      doc.text(`Per ${periodLabel}`, marginL, 32);
      doc.setFontSize(9);
      doc.text('(Dinyatakan dalam Rupiah, kecuali dinyatakan lain)', marginL, 38);
      doc.setDrawColor(0);
      doc.setLineWidth(0.8);
      doc.line(marginL, 41, pageW - marginR, 41);
    };

    const addContinuationHeader = (section: string) => {
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text(section, marginL, 20);
      doc.setLineWidth(0.3);
    };

    // ── PAGE 1: UMUM ──
    addHeader();
    let y = 52;

    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('1.', marginL, y);
    doc.text('UMUM', marginL + 10, y);
    y += 12;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const umumText1 = `${company?.name || '[Nama Perusahaan]'} (Perusahaan) didirikan berdasarkan Akta Notaris. Anggaran dasar pendirian perusahaan telah memperoleh pengesahan oleh Menteri Hukum dan Hak Asasi Manusia Republik Indonesia.`;
    const lines1 = doc.splitTextToSize(umumText1, contentW - 10);
    doc.text(lines1, marginL + 10, y);
    y += lines1.length * 5 + 10;

    const umumText2 = `Susunan Direksi dan Komisaris Perusahaan per ${periodLabel} adalah sebagai berikut :`;
    const lines2 = doc.splitTextToSize(umumText2, contentW - 10);
    doc.text(lines2, marginL + 10, y);
    y += lines2.length * 5 + 8;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text(`Tahun ${format(date, 'yyyy')}`, marginL + 10, y);
    doc.line(marginL + 10, y + 1, marginL + 50, y + 1);
    y += 8;

    doc.setFont('helvetica', 'normal');
    doc.text('Komisaris', marginL + 10, y);
    doc.text(':', marginL + 55, y);
    doc.text('-', marginL + 60, y);
    y += 6;
    doc.text('Direktur', marginL + 10, y);
    doc.text(':', marginL + 55, y);
    doc.text('-', marginL + 60, y);
    y += 14;

    doc.text('Dalam menjalankan usahanya, Perusahaan memiliki perijinan-perijinan yang terdiri dari :', marginL + 10, y);
    y += 8;
    doc.text('a.  Nomor Induk Berusaha (NIB) :', marginL + 10, y);
    y += 6;
    doc.text(`b.  Nomor Pokok Wajib Pajak (NPWP) dengan No. : ${company?.taxId || '-'}`, marginL + 10, y);
    y += 6;
    doc.text('c.  Pengusaha Kena Pajak (PKP) No. :', marginL + 10, y);

    addPageNumber();

    // ── PAGE 2: KEBIJAKAN AKUNTANSI ──
    doc.addPage();
    pageNum = 2;

    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    y = 20;
    doc.text('2.', marginL, y);
    doc.text('KEBIJAKAN AKUNTANSI', marginL + 10, y);
    y += 12;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('a.  Dasar Penyusunan Laporan Keuangan', marginL + 10, y);
    y += 10;
    doc.setFont('helvetica', 'normal');
    const kebijakanA = 'Laporan keuangan disusun sesuai dengan Standar Akuntansi Keuangan Entitas Tanpa Akuntabilitas Publik (SAK ETAP). Laporan arus kas menyajikan informasi perubahan historis atas kas dan setara kas entitas, yang menunjukkan secara terpisah perubahan yang terjadi selama satu periode dari aktivitas operasi, investasi, dan pendanaan.';
    const linesA = doc.splitTextToSize(kebijakanA, contentW - 15);
    doc.text(linesA, marginL + 15, y);
    y += linesA.length * 5 + 14;

    doc.setFont('helvetica', 'bold');
    doc.text('b.  Transaksi dan Saldo dalam Mata Uang Asing', marginL + 10, y);
    y += 10;
    doc.setFont('helvetica', 'normal');
    const kebijakanB = 'Transaksi dalam mata uang asing dijabarkan ke dalam Rupiah dengan kurs yang berlaku pada saat terjadinya transaksi. Pada tanggal neraca, aset dan kewajiban moneter dalam mata uang asing dijabarkan ke dalam Rupiah dengan menggunakan kurs tengah Bank Indonesia.';
    const linesB = doc.splitTextToSize(kebijakanB, contentW - 15);
    doc.text(linesB, marginL + 15, y);
    y += linesB.length * 5 + 14;

    doc.setFont('helvetica', 'bold');
    doc.text('c.  Kas dan Setara Kas', marginL + 10, y);
    y += 10;
    doc.setFont('helvetica', 'normal');
    const kebijakanC = 'Kas dan setara kas terdiri dari saldo kas, bank dan semua investasi yang jatuh tempo dalam waktu tiga bulan atau kurang dari tanggal perolehannya dan yang tidak dijaminkan serta tidak dibatasi penggunaannya.';
    const linesC = doc.splitTextToSize(kebijakanC, contentW - 15);
    doc.text(linesC, marginL + 15, y);

    addPageNumber();

    // ── PAGE 3: KEBIJAKAN AKUNTANSI - Lanjutan ──
    doc.addPage();
    pageNum = 3;

    addContinuationHeader('2.  KEBIJAKAN AKUNTANSI - Lanjutan');
    y = 30;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('d.  Piutang dan Penyisihan Piutang Tak Tertagih', marginL + 10, y);
    y += 10;
    doc.setFont('helvetica', 'normal');
    const kebijakanD = 'Piutang disajikan sebesar jumlah neto setelah dikurangi dengan penyisihan piutang tak tertagih. Penyisihan piutang tak tertagih ditentukan berdasarkan hasil penelaahan terhadap keadaan akun piutang masing-masing pelanggan pada akhir tahun.';
    const linesD = doc.splitTextToSize(kebijakanD, contentW - 15);
    doc.text(linesD, marginL + 15, y);
    y += linesD.length * 5 + 12;

    doc.setFont('helvetica', 'bold');
    doc.text('e.  Transaksi dengan Pihak-pihak yang Mempunyai Hubungan Istimewa', marginL + 10, y);
    y += 10;
    doc.setFont('helvetica', 'normal');
    const kebijakanE = 'Perusahaan melakukan transasksi dengan pihak-pihak tertentu sebagai transaksi hubungan istimewa sebagaimana dimaksud SAK ETAP Bab 28 "Pengungkapan Pihak-pihak yang Mempunyai Hubungan Istimewa".';
    const linesE = doc.splitTextToSize(kebijakanE, contentW - 15);
    doc.text(linesE, marginL + 15, y);
    y += linesE.length * 5 + 12;

    doc.setFont('helvetica', 'bold');
    doc.text('f.  Persediaan', marginL + 10, y);
    y += 10;
    doc.setFont('helvetica', 'normal');
    const kebijakanF = 'Persediaan dinyatakan dengan biaya atau realisasi bersih mana yang lebih rendah. Penilaian biaya ditentukan berdasarkan metode [ Masuk Pertama Keluar Pertama (MPKP)/Berdasarkan Expired Date/ Masuk Terakhir Keluar Pertama (MTKP)].';
    const linesF = doc.splitTextToSize(kebijakanF, contentW - 15);
    doc.text(linesF, marginL + 15, y);
    y += linesF.length * 5 + 12;

    doc.setFont('helvetica', 'bold');
    doc.text('g.  Aset Tetap', marginL + 10, y);
    y += 10;
    doc.setFont('helvetica', 'normal');
    const kebijakanG = 'Aset tetap dibukukan berdasarkan biaya perolehan setelah dikurangi akumulasi penyusutan. Kecuali tanah yang tidak disusutkan. Penyusutan dihitung dengan menggunakan metode garis lurus (straight-line method) berdasarkan taksiran masa manfaat ekonomis aset tetap.';
    const linesG = doc.splitTextToSize(kebijakanG, contentW - 15);
    doc.text(linesG, marginL + 15, y);
    y += linesG.length * 5 + 8;

    // Asset table
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    const col1X = marginL + 15;
    const col2X = marginL + 80;
    doc.text('Jenis aset tetap', col1X, y);
    doc.text('Masa manfaat', col2X, y);
    doc.line(col1X, y + 1, col1X + 40, y + 1);
    doc.line(col2X, y + 1, col2X + 35, y + 1);
    y += 6;
    doc.text('Inventaris Kantor', col1X, y);
    doc.text('4 Tahun', col2X, y);
    y += 10;

    const kebijakanG2 = 'Pengeluaran untuk perbaikan dan pemeliharaan dibebankan pada laporan laba rugi pada saat terjadinya. Pengeluaran yang memperpanjang masa manfaat atau memberi manfaat ekonomis di masa yang akan datang dikapitalisasi.';
    const linesG2 = doc.splitTextToSize(kebijakanG2, contentW - 15);
    doc.text(linesG2, marginL + 15, y);

    addPageNumber();

    // ── PAGE 4: KEBIJAKAN AKUNTANSI - Lanjutan 2 ──
    doc.addPage();
    pageNum = 4;

    addContinuationHeader('2.  KEBIJAKAN AKUNTANSI - Lanjutan');
    y = 30;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('h.  Kewajiban Imbalan Kerja', marginL + 10, y);
    y += 10;
    doc.setFont('helvetica', 'normal');
    const kebijakanH = 'Perusahaan belum mengakui kewajiban imbalan pasca kerja sebagaimana diatur dalam SAK ETAP Bab 23 "Imbalan Kerja".';
    const linesH = doc.splitTextToSize(kebijakanH, contentW - 15);
    doc.text(linesH, marginL + 15, y);
    y += linesH.length * 5 + 12;

    doc.setFont('helvetica', 'bold');
    doc.text('i.  Pengakuan Pendapatan dan Beban', marginL + 10, y);
    y += 10;
    doc.setFont('helvetica', 'normal');
    const kebijakanI = 'Pendapatan diakui pada saat penyerahan barang dan pemberian jasa kepada pelanggan. Beban diakui pada saat terjadinya (basis akrual).';
    const linesI = doc.splitTextToSize(kebijakanI, contentW - 15);
    doc.text(linesI, marginL + 15, y);
    y += linesI.length * 5 + 12;

    doc.setFont('helvetica', 'bold');
    doc.text('j.  Pajak Penghasilan', marginL + 10, y);
    y += 10;
    doc.setFont('helvetica', 'normal');
    const kebijakanJ1 = 'Pajak penghasilan pada laba rugi ditentukan berdasarkan taksiran laba kena pajak dalam tahun berjalan sesuai dengan peraturan perpajakan yang berlaku.';
    const linesJ1 = doc.splitTextToSize(kebijakanJ1, contentW - 15);
    doc.text(linesJ1, marginL + 15, y);
    y += linesJ1.length * 5 + 6;
    const kebijakanJ2 = 'Perusahaan mengakui kewajiban atas seluruh pajak penghasilan periode berjalan dan periode sebelumnya yang belum dibayar.';
    const linesJ2 = doc.splitTextToSize(kebijakanJ2, contentW - 15);
    doc.text(linesJ2, marginL + 15, y);
    y += linesJ2.length * 5 + 6;
    const kebijakanJ3 = 'Perubahan terhadap kewajiban perpajakan diakui pada saat Surat Ketetapan Pajak (SKP) diterima atau jika Perusahaan mengajukan keberatan, pada saat keputusan atas keberatan tersebut telah ditetapkan.';
    const linesJ3 = doc.splitTextToSize(kebijakanJ3, contentW - 15);
    doc.text(linesJ3, marginL + 15, y);
    y += linesJ3.length * 5 + 12;

    doc.setFont('helvetica', 'bold');
    doc.text('k.  Penggunaan Estimasi', marginL + 10, y);
    y += 10;
    doc.setFont('helvetica', 'normal');
    const kebijakanK = 'Penyusunan laporan keuangan yang sesuai dengan prinsip akuntansi yang berlaku umum mengharuskan manajemen membuat estimasi dan asumsi yang mempengaruhi jumlah aset dan kewajiban yang dilaporkan.';
    const linesK = doc.splitTextToSize(kebijakanK, contentW - 15);
    doc.text(linesK, marginL + 15, y);

    addPageNumber();

    // ── PAGE 5: RINGKASAN TRANSAKSI ──
    doc.addPage();
    pageNum = 5;

    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    y = 20;
    doc.text('3.', marginL, y);
    doc.text('RINGKASAN TRANSAKSI', marginL + 10, y);
    y += 6;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(`Periode: ${periodLabel}`, marginL + 10, y);
    y += 12;

    doc.setFontSize(10);
    // Table header
    const tCol1 = marginL + 10;
    const tCol2 = pageW - marginR - 10;
    doc.setFont('helvetica', 'bold');
    doc.text('Keterangan', tCol1, y);
    doc.text('Jumlah (Rp)', tCol2, y, { align: 'right' });
    doc.setLineWidth(0.5);
    doc.line(tCol1, y + 2, tCol2, y + 2);
    y += 9;

    doc.setFont('helvetica', 'normal');
    doc.text('Total Penjualan', tCol1, y);
    doc.text(formatCurrency(totalSales), tCol2, y, { align: 'right' });
    y += 7;
    doc.text('Total Pembelian', tCol1, y);
    doc.text(formatCurrency(totalPurchases), tCol2, y, { align: 'right' });
    y += 7;
    doc.text('Nilai Persediaan', tCol1, y);
    doc.text(formatCurrency(inventoryValue), tCol2, y, { align: 'right' });
    y += 3;
    doc.setLineWidth(0.5);
    doc.line(tCol1, y, tCol2, y);

    addPageNumber();

    doc.save(`Catatan_Laporan_Keuangan_1_${format(start, 'yyyy-MM-dd')}.pdf`);
  };

  const exportToPDF2 = () => {
    const doc = new jsPDF('p', 'mm', 'a4');
    const pageW = 210;
    const marginL = 20;
    const marginR = 20;
    const contentW = pageW - marginL - marginR;
    let pageNum = 1;
    const totalPages = 4;

    const fmtCur = (v: number) => {
      if (v === 0) return '( -)';
      return `( ${new Intl.NumberFormat('id-ID').format(Math.abs(v))})`;
    };

    const addFooter = () => {
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text(`${pageNum}+${totalPages}`, pageW / 2, 285, { align: 'center' });
    };

    const addHeader = () => {
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text(company?.name || '[Nama Perusahaan]', marginL, 20);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('Catatan atas laporan keuangan', marginL, 26);
      doc.setFont('helvetica', 'normal');
      doc.text(`Per ${periodLabel}`, marginL, 32);
      doc.setFontSize(9);
      doc.text('(Dinyatakan dalam Rupiah, kecuali dinyatakan lain)', marginL, 38);
      doc.setDrawColor(0);
      doc.setLineWidth(0.8);
      doc.line(marginL, 41, pageW - marginR, 41);
    };

    const drawTable2Col = (y: number, title: string, desc: string, rows: [string, string, string][], totalRow: [string, string, string]) => {
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text(title, marginL, y);
      y += 8;
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      const descLines = doc.splitTextToSize(desc, contentW);
      doc.text(descLines, marginL, y);
      y += descLines.length * 4.5 + 6;

      const col1 = marginL;
      const col2 = marginL + 90;
      const col3 = pageW - marginR;

      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text('', col1, y);
      doc.text(periodLabel, col2, y, { align: 'right' });
      doc.text('[Periode 1]', col3, y, { align: 'right' });
      doc.setLineWidth(0.3);
      doc.line(col1, y + 1.5, col3, y + 1.5);
      y += 6;

      doc.setFont('helvetica', 'normal');
      for (const [label, v1, v2] of rows) {
        doc.text(label, col1 + 2, y);
        doc.text(v1, col2, y, { align: 'right' });
        doc.text(v2, col3, y, { align: 'right' });
        y += 5.5;
      }

      doc.setFont('helvetica', 'bold');
      doc.text(totalRow[0], col1 + 2, y);
      doc.text(totalRow[1], col2, y, { align: 'right' });
      doc.text(totalRow[2], col3, y, { align: 'right' });
      doc.setLineWidth(0.3);
      doc.line(col1, y + 1.5, col3, y + 1.5);
      y += 8;
      return y;
    };

    // ── PAGE 1 ──
    addHeader();
    let y = 50;

    y = drawTable2Col(y, '3. KAS DAN SETARA KAS',
      `Akun tersebut merupakan saldo kas dan setara kas per ${periodLabel}, dengan rincian sebagai berikut :`,
      [['Kas', fmtCur(0), fmtCur(0)]],
      ['Jumlah Kas', fmtCur(0), fmtCur(0)]);

    y = drawTable2Col(y, '4. PIUTANG USAHA',
      `Akun tersebut merupakan saldo piutang usaha per ${periodLabel}, dengan rincian sebagai berikut :`,
      [['Piutang Usaha', fmtCur(0), fmtCur(0)]],
      ['Jumlah Piutang Usaha', fmtCur(0), fmtCur(0)]);

    y = drawTable2Col(y, '5. PERSEDIAAN',
      `Akun tersebut merupakan saldo persediaan per ${periodLabel}, dengan rincian sebagai berikut :`,
      [['- [List Item Persediaan]', fmtCur(0), fmtCur(0)]],
      ['Jumlah Persediaan', fmtCur(inventoryValue), fmtCur(0)]);

    y = drawTable2Col(y, '6. BIAYA DIBAYAR DIMUKA',
      `Akun tersebut merupakan saldo biaya dibayar dimuka per ${periodLabel}, dengan rincian sebagai berikut :`,
      [['Biaya Dibayar Dimuka', fmtCur(0), fmtCur(0)]],
      ['Jumlah Biaya Dibayar Dimuka', fmtCur(0), fmtCur(0)]);

    addFooter();

    // ── PAGE 2 ──
    doc.addPage();
    pageNum = 2;
    y = 20;

    y = drawTable2Col(y, '7. PAJAK DIBAYAR DIMUKA',
      `Akun tersebut merupakan saldo pajak dibayar dimuka per ${periodLabel}, dengan rincian sebagai berikut :`,
      [['Pajak Dibayar Dimuka', fmtCur(0), fmtCur(0)]],
      ['Jumlah Pajak Dibayar Dimuka', fmtCur(0), fmtCur(0)]);

    // 8. ASET TETAP
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('8. ASET TETAP', marginL, y);
    y += 8;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    const asetDesc = `Saldo aset tetap setelah dikurangi akumulasi penyusutan per ${periodLabel}, adalah sebagai berikut :`;
    const asetLines = doc.splitTextToSize(asetDesc, contentW);
    doc.text(asetLines, marginL, y);
    y += asetLines.length * 4.5 + 6;

    // Asset table header
    const ac1 = marginL;
    const ac2 = marginL + 45;
    const ac3 = marginL + 75;
    const ac4 = marginL + 105;
    const ac5 = pageW - marginR;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.text('', ac1, y);
    doc.text('Saldo Awal', ac2, y, { align: 'right' });
    doc.text('Penambahan', ac3, y, { align: 'right' });
    doc.text('Pengurangan', ac4, y, { align: 'right' });
    doc.text('Saldo Akhir', ac5, y, { align: 'right' });
    doc.line(ac1, y + 1.5, ac5, y + 1.5);
    y += 5.5;
    doc.setFont('helvetica', 'normal');
    doc.text('Harga perolehan :', ac1 + 2, y);
    doc.text(fmtCur(0), ac2, y, { align: 'right' });
    doc.text(fmtCur(0), ac3, y, { align: 'right' });
    doc.text(fmtCur(0), ac4, y, { align: 'right' });
    doc.text(fmtCur(0), ac5, y, { align: 'right' });
    y += 5;
    doc.text('Akumulasi penyusutan :', ac1 + 2, y);
    doc.text(fmtCur(0), ac2, y, { align: 'right' });
    doc.text(fmtCur(0), ac3, y, { align: 'right' });
    doc.text(fmtCur(0), ac4, y, { align: 'right' });
    doc.text(fmtCur(0), ac5, y, { align: 'right' });
    y += 5;
    doc.setFont('helvetica', 'bold');
    doc.text('Nilai Buku', ac1 + 2, y);
    doc.text(fmtCur(0), ac2, y, { align: 'right' });
    doc.text(fmtCur(0), ac5, y, { align: 'right' });
    doc.line(ac1, y + 1.5, ac5, y + 1.5);
    y += 10;

    y = drawTable2Col(y, '9. KEWAJIBAN JANGKA PENDEK',
      `Akun tersebut merupakan saldo kewajiban per ${periodLabel}, dengan rincian sebagai berikut :`,
      [
        ['a. Utang Usaha', fmtCur(0), fmtCur(0)],
        ['b. Utang Bank', fmtCur(0), fmtCur(0)],
        ['c. Kewajiban Jangka Pendek Lainnya', fmtCur(0), fmtCur(0)],
      ],
      ['Jumlah Kewajiban Jangka Pendek', fmtCur(0), fmtCur(0)]);

    addFooter();

    // ── PAGE 3 ──
    doc.addPage();
    pageNum = 3;
    y = 20;

    y = drawTable2Col(y, '10. KEWAJIBAN JANGKA PANJANG',
      `Akun tersebut merupakan saldo kewajiban jangka panjang per ${periodLabel}, dengan rincian sebagai berikut :`,
      [
        ['a. Utang Bank', fmtCur(0), fmtCur(0)],
        ['b. Utang Pembiayaan dan Utang Lainnya', fmtCur(0), fmtCur(0)],
      ],
      ['Jumlah Kewajiban Jangka Panjang', fmtCur(0), fmtCur(0)]);

    // 11. MODAL SAHAM
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('11. MODAL SAHAM', marginL, y);
    y += 8;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    const modalDesc = 'Berdasarkan akta pendirian perusahaan, rincian pemegang saham adalah sebagai berikut :';
    const modalLines = doc.splitTextToSize(modalDesc, contentW);
    doc.text(modalLines, marginL, y);
    y += modalLines.length * 4.5 + 6;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    const mc1 = marginL;
    const mc2 = marginL + 50;
    const mc3 = marginL + 75;
    const mc4 = pageW - marginR;
    doc.text('Pemegang Saham', mc1 + 2, y);
    doc.text('Jumlah Saham', mc2, y, { align: 'right' });
    doc.text('Kepemilikan', mc3, y, { align: 'right' });
    doc.text('Jumlah Modal (Rp)', mc4, y, { align: 'right' });
    doc.line(mc1, y + 1.5, mc4, y + 1.5);
    y += 5.5;
    doc.setFont('helvetica', 'normal');
    doc.text('[Nama Pemegang Saham]', mc1 + 2, y);
    doc.text('-', mc2, y, { align: 'right' });
    doc.text('-', mc3, y, { align: 'right' });
    doc.text(fmtCur(0), mc4, y, { align: 'right' });
    y += 5;
    doc.setFont('helvetica', 'bold');
    doc.text('Jumlah', mc1 + 2, y);
    doc.text('-', mc2, y, { align: 'right' });
    doc.text('100%', mc3, y, { align: 'right' });
    doc.text(fmtCur(0), mc4, y, { align: 'right' });
    doc.line(mc1, y + 1.5, mc4, y + 1.5);
    y += 10;

    y = drawTable2Col(y, '11. PENDAPATAN',
      `Akun tersebut merupakan saldo pendapatan untuk periode per ${periodLabel}, dengan rincian sebagai berikut :`,
      [
        ['a. Penjualan', fmtCur(totalSales), fmtCur(0)],
      ],
      ['Jumlah Pendapatan', fmtCur(totalSales), fmtCur(0)]);

    y = drawTable2Col(y, '12. BEBAN POKOK PENDAPATAN',
      `Akun tersebut merupakan saldo beban pokok pendapatan untuk periode per ${periodLabel}, dengan rincian sebagai berikut :`,
      [['Beban Pokok Pendapatan', fmtCur(totalPurchases), fmtCur(0)]],
      ['Jumlah Beban Pokok Pendapatan', fmtCur(totalPurchases), fmtCur(0)]);

    y = drawTable2Col(y, '13. BEBAN PENJUALAN',
      `Akun tersebut merupakan saldo beban penjualan untuk periode per ${periodLabel}, dengan rincian sebagai berikut :`,
      [
        ['Iklan dan Promosi', fmtCur(0), fmtCur(0)],
        ['Entertainment', fmtCur(0), fmtCur(0)],
      ],
      ['Jumlah Beban Penjualan', fmtCur(0), fmtCur(0)]);

    addFooter();

    // ── PAGE 4 ──
    doc.addPage();
    pageNum = 4;
    y = 20;

    y = drawTable2Col(y, '14. LAIN-LAIN',
      `Akun tersebut merupakan saldo beban lain-lain dan pendapatan lain-lain untuk periode per ${periodLabel}, dengan rincian sebagai berikut :`,
      [
        ['a. Beban Lain-Lain:', '', ''],
        ['   - Beban Bunga', fmtCur(0), fmtCur(0)],
        ['   - Beban Administrasi Bank', fmtCur(0), fmtCur(0)],
        ['Total Beban Lain-Lain', fmtCur(0), fmtCur(0)],
        ['b. Pendapatan Lain-Lain:', '', ''],
        ['   - Pendapatan Bunga Bank', fmtCur(0), fmtCur(0)],
        ['Total Pendapatan Lain-Lain', fmtCur(0), fmtCur(0)],
      ],
      ['Jumlah Beban(Pendapatan) Lain-Lain', fmtCur(0), fmtCur(0)]);

    y = drawTable2Col(y, '15. BEBAN UMUM DAN ADMINISTRASI',
      `Akun tersebut merupakan beban umum dan administrasi untuk periode per ${periodLabel}, dengan rincian sebagai berikut :`,
      [
        ['Beban Gaji Karyawan', fmtCur(0), fmtCur(0)],
        ['Beban Listrik', fmtCur(0), fmtCur(0)],
        ['Beban Perlengkapan', fmtCur(0), fmtCur(0)],
        ['Beban Transportasi', fmtCur(0), fmtCur(0)],
        ['Beban Pemeliharaan', fmtCur(0), fmtCur(0)],
        ['Beban ATK', fmtCur(0), fmtCur(0)],
        ['Penyusutan', fmtCur(0), fmtCur(0)],
        ['Lain-lain', fmtCur(0), fmtCur(0)],
      ],
      ['Jumlah Beban Umum dan Administrasi', fmtCur(0), fmtCur(0)]);

    // 16. PENYELESAIAN
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('16. PENYELESAIAN LAPORAN KEUANGAN', marginL, y);
    y += 8;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    const penyelesaian = `Manajemen Perusahaan bertanggung jawab atas penyusunan laporan keuangan untuk tahun yang berakhir pada tanggal ${periodLabel} yang telah diselesaikan pada tanggal tersebut.`;
    const penLines = doc.splitTextToSize(penyelesaian, contentW);
    doc.text(penLines, marginL, y);

    addFooter();

    doc.save(`Catatan_Laporan_Keuangan_2_${format(start, 'yyyy-MM-dd')}.pdf`);
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
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button className="gap-2">
                  <Download className="h-4 w-4" />
                  Ekspor PDF
                  <ChevronDown className="h-3.5 w-3.5 opacity-60" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={exportToPDF}>
                  Catatan Laporan Keuangan 1
                </DropdownMenuItem>
                <DropdownMenuItem onClick={exportToPDF2}>
                  Catatan Laporan Keuangan 2
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
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
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="sm" className="text-sm font-normal text-muted-foreground gap-1">
                    <CalendarIcon className="h-3.5 w-3.5" />
                    {periodLabel}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end">
                  <div className="p-3 border-b">
                    <Select value={period} onValueChange={(v) => setPeriod(v as PeriodType)}>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {PERIOD_OPTIONS.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={(newDate) => newDate && setDate(newDate)}
                    initialFocus
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>
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
