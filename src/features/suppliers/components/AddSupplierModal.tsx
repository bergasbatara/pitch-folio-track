import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Supplier, SupplierFormData, SupplierType } from '../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: SupplierFormData) => void;
  editingSupplier?: Supplier | null;
}

const initial: SupplierFormData = { name: '', type: 'perusahaan', address: '', email: '', phone: '', npwp: '' };

export function AddSupplierModal({ isOpen, onClose, onSubmit, editingSupplier }: Props) {
  const [form, setForm] = useState<SupplierFormData>(initial);

  useEffect(() => {
    if (editingSupplier) {
      setForm({ name: editingSupplier.name, type: editingSupplier.type, address: editingSupplier.address ?? '', email: editingSupplier.email ?? '', phone: editingSupplier.phone ?? '', npwp: editingSupplier.npwp ?? '' });
    } else {
      setForm(initial);
    }
  }, [editingSupplier, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(form);
    onClose();
    setForm(initial);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-foreground">{editingSupplier ? 'Edit Supplier' : 'Tambah Supplier'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Nama</Label>
            <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Nama supplier" className="bg-background border-border" required />
          </div>
          <div className="space-y-2">
            <Label>Jenis Supplier</Label>
            <Select value={form.type} onValueChange={(v: SupplierType) => setForm({ ...form, type: v })}>
              <SelectTrigger className="bg-background border-border"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="individu">Individu</SelectItem>
                <SelectItem value="perusahaan">Perusahaan</SelectItem>
                <SelectItem value="lainnya">Lainnya</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Alamat</Label>
            <Input value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} placeholder="Alamat" className="bg-background border-border" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Email</Label>
              <Input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="email@contoh.com" className="bg-background border-border" />
            </div>
            <div className="space-y-2">
              <Label>Telepon</Label>
              <Input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="08xx" className="bg-background border-border" />
            </div>
          </div>
          <div className="space-y-2">
            <Label>NPWP</Label>
            <Input value={form.npwp} onChange={e => setForm({ ...form, npwp: e.target.value })} placeholder="Nomor NPWP" className="bg-background border-border" />
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>Batal</Button>
            <Button type="submit" disabled={!form.name}>{editingSupplier ? 'Simpan' : 'Tambah'}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
