import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FixedAsset, FixedAssetFormData, AssetCategory, AssetType, ASSET_USEFUL_LIFE, ASSET_CATEGORY_LABELS, ASSET_TYPE_LABELS } from '../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: FixedAssetFormData) => void;
  editingAsset?: FixedAsset | null;
}

const initial: FixedAssetFormData = {
  name: '', assetType: 'tetap', category: 'mesin', acquisitionDate: new Date().toISOString().slice(0, 10),
  acquisitionCost: 0, usefulLifeMonths: 48, residualValue: 0, depreciationMethod: 'straight_line',
};

export function AddAssetModal({ isOpen, onClose, onSubmit, editingAsset }: Props) {
  const [form, setForm] = useState<FixedAssetFormData>(initial);
  const [acquisitionCostInput, setAcquisitionCostInput] = useState(String(initial.acquisitionCost));
  const [residualValueInput, setResidualValueInput] = useState(String(initial.residualValue));

  useEffect(() => {
    if (editingAsset) {
      setForm({
        name: editingAsset.name, assetType: editingAsset.assetType ?? 'tetap', category: editingAsset.category,
        acquisitionDate: editingAsset.acquisitionDate.slice(0, 10),
        acquisitionCost: editingAsset.acquisitionCost, usefulLifeMonths: editingAsset.usefulLifeMonths,
        residualValue: editingAsset.residualValue, depreciationMethod: editingAsset.depreciationMethod,
      });
      setAcquisitionCostInput(String(editingAsset.acquisitionCost));
      setResidualValueInput(String(editingAsset.residualValue));
    } else { setForm(initial); }
  }, [editingAsset, isOpen]);

  const parseSignedNumber = (value: string) => {
    if (value === '' || value === '-') return 0;
    return parseInt(value, 10) || 0;
  };

  const normalizeSignedInput = (value: string) => {
    const cleaned = value.replace(/[^\d-]/g, '');
    const isNegative = cleaned.startsWith('-');
    const digits = cleaned.replace(/-/g, '');
    return `${isNegative ? '-' : ''}${digits}`;
  };

  const handleCategoryChange = (cat: AssetCategory) => {
    setForm({ ...form, category: cat, usefulLifeMonths: ASSET_USEFUL_LIFE[cat] });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...form,
      acquisitionCost: parseSignedNumber(acquisitionCostInput),
      residualValue: parseSignedNumber(residualValueInput),
    });
    onClose();
    setForm(initial);
    setAcquisitionCostInput(String(initial.acquisitionCost));
    setResidualValueInput(String(initial.residualValue));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-foreground">{editingAsset ? 'Edit Aset' : 'Tambah Aset'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Nama Aset</Label>
            <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="cth. Kendaraan Operasional" className="bg-background border-border" required />
          </div>
          <div className="space-y-2">
            <Label>Jenis Aset</Label>
            <Select value={form.assetType} onValueChange={(v: AssetType) => setForm({ ...form, assetType: v })}>
              <SelectTrigger className="bg-background border-border"><SelectValue /></SelectTrigger>
              <SelectContent className="bg-card border-border z-50">
                {Object.entries(ASSET_TYPE_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Kategori / Akun Aset</Label>
            <Select value={form.category} onValueChange={(v: AssetCategory) => handleCategoryChange(v)}>
              <SelectTrigger className="bg-background border-border"><SelectValue /></SelectTrigger>
              <SelectContent className="bg-card border-border z-50">
                {Object.entries(ASSET_CATEGORY_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Tanggal Perolehan</Label>
              <Input type="date" value={form.acquisitionDate} onChange={e => setForm({ ...form, acquisitionDate: e.target.value })} className="bg-background border-border" required />
            </div>
            <div className="space-y-2">
              <Label>Umur Manfaat (bulan)</Label>
              <Input type="number" min="0" value={form.usefulLifeMonths} onChange={e => setForm({ ...form, usefulLifeMonths: parseInt(e.target.value) || 0 })} className="bg-background border-border" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Nilai Perolehan (Rp)</Label>
              <Input type="text" inputMode="numeric" value={form.acquisitionCost} onChange={e => { const raw = e.target.value.replace(/[^\d-]/g, ''); const neg = raw.startsWith('-'); const digits = raw.replace(/-/g, ''); setForm({ ...form, acquisitionCost: digits ? (neg ? -parseInt(digits) : parseInt(digits)) : 0 }); }} className="bg-background border-border" required />
            </div>
            <div className="space-y-2">
              <Label>Nilai Residu (Rp)</Label>
              <Input type="text" inputMode="numeric" value={form.residualValue} onChange={e => { const raw = e.target.value.replace(/[^\d-]/g, ''); const neg = raw.startsWith('-'); const digits = raw.replace(/-/g, ''); setForm({ ...form, residualValue: digits ? (neg ? -parseInt(digits) : parseInt(digits)) : 0 }); }} className="bg-background border-border" />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Metode Penyusutan</Label>
            <Input value="Garis Lurus (Straight Line)" disabled className="bg-muted border-border" />
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>Batal</Button>
            <Button type="submit" disabled={!form.name}>{editingAsset ? 'Simpan' : 'Tambah'}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
