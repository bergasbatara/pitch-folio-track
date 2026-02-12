import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, FileText } from 'lucide-react';
import { useSales } from '@/features/sales/hooks/useSales';
import { usePurchases } from '@/features/purchases/hooks/usePurchases';
import { useProducts } from '@/features/products/hooks/useProducts';
import { useCompanyProfile } from '@/features/onboarding';
import jsPDF from 'jspdf';

export default function NotesFS() {
  const { company } = useCompanyProfile();
  const { sales } = useSales();
  const { purchases } = usePurchases();
  const { products } = useProducts(company?.id);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(value);
  };

  const totalSales = sales.reduce((sum, s) => sum + s.totalPrice, 0);
  const totalPurchases = purchases.reduce((sum, p) => sum + p.totalCost, 0);
  const inventoryValue = products.reduce((sum, p) => sum + (p.price * p.stock), 0);

  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text('CATATAN ATAS LAPORAN KEUANGAN', 105, 20, { align: 'center' });
    doc.setFontSize(11);
    doc.text(company?.name || 'Perusahaan', 105, 30, { align: 'center' });
    
    doc.setFontSize(12);
    doc.text('1. GAMBARAN UMUM PERUSAHAAN', 20, 50);
    doc.setFontSize(10);
    doc.text(`Nama: ${company?.name || '-'}`, 25, 60);
    doc.text(`Alamat: ${company?.address || '-'}`, 25, 68);
    doc.text(`Telepon: ${company?.phone || '-'}`, 25, 76);
    
    doc.setFontSize(12);
    doc.text('2. KEBIJAKAN AKUNTANSI', 20, 95);
    doc.setFontSize(10);
    doc.text('Pencatatan menggunakan basis kas.', 25, 105);
    doc.text('Persediaan dicatat dengan metode FIFO.', 25, 113);
    
    doc.setFontSize(12);
    doc.text('3. RINGKASAN', 20, 130);
    doc.setFontSize(10);
    doc.text(`Total Penjualan: ${formatCurrency(totalSales)}`, 25, 140);
    doc.text(`Total Pembelian: ${formatCurrency(totalPurchases)}`, 25, 148);
    doc.text(`Nilai Persediaan: ${formatCurrency(inventoryValue)}`, 25, 156);
    
    doc.save('Catatan_Laporan_Keuangan.pdf');
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
          <Button onClick={exportToPDF} className="gap-2">
            <Download className="h-4 w-4" />
            Ekspor PDF
          </Button>
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
            <CardTitle>3. Ringkasan Transaksi</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="p-4 bg-emerald-500/10 rounded-lg">
                <p className="text-sm text-muted-foreground">Total Penjualan</p>
                <p className="text-xl font-bold text-emerald-500">{formatCurrency(totalSales)}</p>
                <p className="text-xs text-muted-foreground mt-1">{sales.length} transaksi</p>
              </div>
              <div className="p-4 bg-destructive/10 rounded-lg">
                <p className="text-sm text-muted-foreground">Total Pembelian</p>
                <p className="text-xl font-bold text-destructive">{formatCurrency(totalPurchases)}</p>
                <p className="text-xs text-muted-foreground mt-1">{purchases.length} transaksi</p>
              </div>
              <div className="p-4 bg-primary/10 rounded-lg">
                <p className="text-sm text-muted-foreground">Nilai Persediaan</p>
                <p className="text-xl font-bold text-primary">{formatCurrency(inventoryValue)}</p>
                <p className="text-xs text-muted-foreground mt-1">{products.length} produk</p>
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
