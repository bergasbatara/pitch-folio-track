import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Building, CreditCard, AlertCircle, Trash2, Banknote } from 'lucide-react';
import { usePayables } from '../hooks/useReceivables';
import { format } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import { useCompanyProfile } from '@/features/onboarding';
import { useErrorToast } from '@/shared/hooks/useErrorToast';

export default function Payables() {
  const { company, error: companyError } = useCompanyProfile();
  const { payables, addPayable, deletePayable, getTotalPayables, getPendingPayables, recordPayment, error: payablesError } = usePayables(company?.id);
  useErrorToast(companyError, 'Gagal memuat perusahaan');
  useErrorToast(payablesError, 'Gagal memuat hutang');
  const [isOpen, setIsOpen] = useState(false);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentTarget, setPaymentTarget] = useState<null | { id: string; amount: number; paidAmount: number; supplierName: string }>(null);
  const [formData, setFormData] = useState({
    supplierName: '',
    description: '',
    amount: '',
    dueDate: '',
    paidAmount: '0',
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!company?.id) return;
    await addPayable({
      supplierName: formData.supplierName,
      description: formData.description,
      amount: parseFloat(formData.amount),
      dueDate: formData.dueDate,
      paidAmount: parseFloat(formData.paidAmount || '0'),
    });
    setFormData({ supplierName: '', description: '', amount: '', dueDate: '', paidAmount: '0' });
    setIsOpen(false);
  };

  const openPayment = (payable: { id: string; amount: number; paidAmount: number; supplierName: string }) => {
    setPaymentTarget(payable);
    const remaining = Math.max(payable.amount - payable.paidAmount, 0);
    setPaymentAmount(remaining ? String(remaining) : '');
    setPaymentOpen(true);
  };

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentTarget) return;
    const remaining = Math.max(paymentTarget.amount - paymentTarget.paidAmount, 0);
    const amount = Math.min(parseFloat(paymentAmount), remaining);
    if (!amount || amount <= 0) return;
    await recordPayment(paymentTarget.id, amount);
    setPaymentOpen(false);
    setPaymentAmount('');
    setPaymentTarget(null);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <Badge className="bg-emerald-500">Lunas</Badge>;
      case 'partial':
        return <Badge className="bg-yellow-500">Sebagian</Badge>;
      case 'overdue':
        return <Badge variant="destructive">Jatuh Tempo</Badge>;
      default:
        return <Badge variant="secondary">Tertunda</Badge>;
    }
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Hutang Usaha</h1>
            <p className="text-muted-foreground">Kelola hutang ke supplier Anda</p>
          </div>
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Tambah Hutang
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Tambah Hutang Baru</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label>Nama Supplier</Label>
                  <Input value={formData.supplierName} onChange={(e) => setFormData({ ...formData, supplierName: e.target.value })} required />
                </div>
                <div className="space-y-2">
                  <Label>Deskripsi</Label>
                  <Input value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} required />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Jumlah (Rp)</Label>
                    <Input type="number" value={formData.amount} onChange={(e) => setFormData({ ...formData, amount: e.target.value })} required />
                  </div>
                  <div className="space-y-2">
                    <Label>Jatuh Tempo</Label>
                    <Input type="date" value={formData.dueDate} onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })} required />
                  </div>
                </div>
                <Button type="submit" className="w-full">Simpan</Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                Total Hutang
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{formatCurrency(getTotalPayables())}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Building className="h-4 w-4" />
                Jumlah Hutang
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{payables.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                Belum Lunas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{getPendingPayables().length}</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Daftar Hutang</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Supplier</TableHead>
                  <TableHead>Deskripsi</TableHead>
                  <TableHead>Jumlah</TableHead>
                  <TableHead>Dibayar</TableHead>
                  <TableHead>Jatuh Tempo</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payables.map((payable) => (
                  <TableRow key={payable.id}>
                    <TableCell className="font-medium">{payable.supplierName}</TableCell>
                    <TableCell>{payable.description}</TableCell>
                    <TableCell>{formatCurrency(payable.amount)}</TableCell>
                    <TableCell>{formatCurrency(payable.paidAmount)}</TableCell>
                    <TableCell>{format(new Date(payable.dueDate), 'dd MMM yyyy', { locale: localeId })}</TableCell>
                    <TableCell>{getStatusBadge(payable.status)}</TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          disabled={payable.amount <= payable.paidAmount}
                          onClick={() => openPayment(payable)}
                        >
                          <Banknote className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => deletePayable(payable.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {payables.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                      Belum ada data hutang
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <Dialog open={paymentOpen} onOpenChange={setPaymentOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Catat Pembayaran Hutang</DialogTitle>
          </DialogHeader>
          <form onSubmit={handlePaymentSubmit} className="space-y-4">
            <div className="text-sm text-muted-foreground">
              {paymentTarget ? `Supplier: ${paymentTarget.supplierName}` : ''}
            </div>
            <div className="space-y-2">
              <Label>Jumlah Pembayaran (Rp)</Label>
              <Input
                type="number"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                min="0"
                step="1"
                required
              />
            </div>
            <Button type="submit" className="w-full">Simpan</Button>
          </form>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}
