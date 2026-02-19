import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Plus, Receipt, Pencil, Trash2 } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useTaxCodes } from '../hooks/useTaxCodes';
import { TaxCode, TaxCodeFormData } from '../types';
import { useCompanyProfile } from '@/features/onboarding';

const initial: TaxCodeFormData = { name: '', code: '', rate: 0, description: '' };

export default function Taxes() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState<TaxCode | null>(null);
  const [form, setForm] = useState<TaxCodeFormData>(initial);
  const { company } = useCompanyProfile();
  const { taxCodes, addTaxCode, updateTaxCode, deleteTaxCode } = useTaxCodes(company?.id);

  const openEdit = (t: TaxCode) => {
    setEditing(t);
    setForm({ name: t.name, code: t.code, rate: t.rate, description: t.description ?? '' });
    setIsModalOpen(true);
  };

  const handleClose = () => { setIsModalOpen(false); setEditing(null); setForm(initial); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!company?.id) return;
    if (editing) { await updateTaxCode(editing.id, form); } else { await addTaxCode(form); }
    handleClose();
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Pajak</h1>
            <p className="text-muted-foreground">Kelola kode pajak untuk penjualan dan pembelian</p>
          </div>
          <Button onClick={() => setIsModalOpen(true)} className="gap-2"><Plus className="h-4 w-4" />Tambah Pajak</Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-card border border-border">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-muted text-primary"><Receipt className="h-5 w-5" /></div>
              <div>
                <p className="text-sm text-muted-foreground">Total Kode Pajak</p>
                <p className="text-xl font-bold text-foreground">{taxCodes.length}</p>
              </div>
            </div>
          </div>
        </div>
        <div className="bg-card rounded-xl border border-border p-6">
          <h2 className="text-lg font-semibold mb-4">Daftar Kode Pajak</h2>
          {!taxCodes.length ? (
            <p className="text-center text-muted-foreground py-8">Belum ada kode pajak.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Kode</TableHead>
                    <TableHead>Nama</TableHead>
                    <TableHead>Tarif</TableHead>
                    <TableHead>Keterangan</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {taxCodes.map(t => (
                    <TableRow key={t.id}>
                      <TableCell><Badge variant="outline">{t.code}</Badge></TableCell>
                      <TableCell className="font-medium">{t.name}</TableCell>
                      <TableCell>{t.rate}%</TableCell>
                      <TableCell className="text-muted-foreground">{t.description || '-'}</TableCell>
                      <TableCell className="text-right space-x-1">
                        <Button variant="ghost" size="icon" onClick={() => openEdit(t)}><Pencil className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => deleteTaxCode(t.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </div>

      <Dialog open={isModalOpen} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-[425px] bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground">{editing ? 'Edit Pajak' : 'Tambah Kode Pajak'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Kode</Label>
                <Input value={form.code} onChange={e => setForm({ ...form, code: e.target.value })} placeholder="PPN" className="bg-background border-border" required />
              </div>
              <div className="space-y-2">
                <Label>Tarif (%)</Label>
                <Input type="number" min="0" max="100" step="0.1" value={form.rate} onChange={e => setForm({ ...form, rate: parseFloat(e.target.value) || 0 })} className="bg-background border-border" required />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Nama</Label>
              <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Pajak Pertambahan Nilai" className="bg-background border-border" required />
            </div>
            <div className="space-y-2">
              <Label>Keterangan</Label>
              <Input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Deskripsi opsional" className="bg-background border-border" />
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={handleClose}>Batal</Button>
              <Button type="submit" disabled={!form.name || !form.code}>{editing ? 'Simpan' : 'Tambah'}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}
