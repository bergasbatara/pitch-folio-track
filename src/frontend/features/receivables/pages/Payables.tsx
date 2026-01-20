import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Building, CreditCard, AlertCircle, Trash2 } from 'lucide-react';
import { usePayables } from '../hooks/useReceivables';
import { format } from 'date-fns';
import { id as localeId } from 'date-fns/locale';

export default function Payables() {
  const { payables, addPayable, deletePayable, getTotalPayables, getPendingPayables } = usePayables();
  const [isOpen, setIsOpen] = useState(false);
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addPayable({
      supplierName: formData.supplierName,
      description: formData.description,
      amount: parseFloat(formData.amount),
      dueDate: formData.dueDate,
      paidAmount: parseFloat(formData.paidAmount || '0'),
    });
    setFormData({ supplierName: '', description: '', amount: '', dueDate: '', paidAmount: '0' });
    setIsOpen(false);
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
                      <Button variant="ghost" size="icon" onClick={() => deletePayable(payable.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
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
    </MainLayout>
  );
}
