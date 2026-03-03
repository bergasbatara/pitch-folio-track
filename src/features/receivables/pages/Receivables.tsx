import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Users, CreditCard, AlertCircle, Trash2, Banknote } from 'lucide-react';
import { useReceivables } from '../hooks/useReceivables';
import { format } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import { useCompanyProfile } from '@/features/onboarding';

export default function Receivables() {
  const { company } = useCompanyProfile();
  const { receivables, addReceivable, deleteReceivable, getTotalReceivables, getPendingReceivables, recordPayment } = useReceivables(company?.id);
  const [isOpen, setIsOpen] = useState(false);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentTarget, setPaymentTarget] = useState<null | { id: string; amount: number; paidAmount: number; customerName: string }>(null);
  const [formData, setFormData] = useState({
    customerName: '',
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
    await addReceivable({
      customerName: formData.customerName,
      description: formData.description,
      amount: parseFloat(formData.amount),
      dueDate: formData.dueDate,
      paidAmount: parseFloat(formData.paidAmount || '0'),
    });
    setFormData({ customerName: '', description: '', amount: '', dueDate: '', paidAmount: '0' });
    setIsOpen(false);
  };

  const openPayment = (receivable: { id: string; amount: number; paidAmount: number; customerName: string }) => {
    setPaymentTarget(receivable);
    const remaining = Math.max(receivable.amount - receivable.paidAmount, 0);
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
            <h1 className="text-2xl font-bold text-foreground">Piutang Usaha</h1>
            <p className="text-muted-foreground">Kelola piutang dari pelanggan Anda</p>
          </div>
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Tambah Piutang
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Tambah Piutang Baru</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label>Nama Pelanggan</Label>
                  <Input value={formData.customerName} onChange={(e) => setFormData({ ...formData, customerName: e.target.value })} required />
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
                Total Piutang
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{formatCurrency(getTotalReceivables())}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Users className="h-4 w-4" />
                Jumlah Piutang
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{receivables.length}</p>
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
              <p className="text-2xl font-bold">{getPendingReceivables().length}</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Daftar Piutang</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Pelanggan</TableHead>
                  <TableHead>Deskripsi</TableHead>
                  <TableHead>Jumlah</TableHead>
                  <TableHead>Dibayar</TableHead>
                  <TableHead>Jatuh Tempo</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {receivables.map((receivable) => (
                  <TableRow key={receivable.id}>
                    <TableCell className="font-medium">{receivable.customerName}</TableCell>
                    <TableCell>{receivable.description}</TableCell>
                    <TableCell>{formatCurrency(receivable.amount)}</TableCell>
                    <TableCell>{formatCurrency(receivable.paidAmount)}</TableCell>
                    <TableCell>{format(new Date(receivable.dueDate), 'dd MMM yyyy', { locale: localeId })}</TableCell>
                    <TableCell>{getStatusBadge(receivable.status)}</TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          disabled={receivable.amount <= receivable.paidAmount}
                          onClick={() => openPayment(receivable)}
                        >
                          <Banknote className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => deleteReceivable(receivable.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {receivables.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                      Belum ada data piutang
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
            <DialogTitle>Catat Pembayaran Piutang</DialogTitle>
          </DialogHeader>
          <form onSubmit={handlePaymentSubmit} className="space-y-4">
            <div className="text-sm text-muted-foreground">
              {paymentTarget ? `Pelanggan: ${paymentTarget.customerName}` : ''}
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
