import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Product, ProductFormData, ProductType, ProductUnit, PRODUCT_TYPE_LABELS, PRODUCT_UNIT_LABELS } from '../types';

interface AddProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ProductFormData) => void;
  editingProduct?: Product | null;
}

const initialFormData: ProductFormData = {
  code: '',
  name: '',
  type: 'barang',
  unit: 'pcs',
  price: 0,
  buyPrice: 0,
  stock: 0,
};

export function AddProductModal({ isOpen, onClose, onSubmit, editingProduct }: AddProductModalProps) {
  const [formData, setFormData] = useState<ProductFormData>(initialFormData);

  useEffect(() => {
    if (editingProduct) {
      setFormData({
        code: editingProduct.code ?? '',
        name: editingProduct.name,
        type: editingProduct.type ?? 'barang',
        unit: editingProduct.unit ?? 'pcs',
        price: editingProduct.price,
        buyPrice: editingProduct.buyPrice ?? 0,
        stock: editingProduct.stock,
      });
    } else {
      setFormData(initialFormData);
    }
  }, [editingProduct, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
    onClose();
    setFormData(initialFormData);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-foreground">
            {editingProduct ? 'Edit Produk' : 'Tambah Produk Baru'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="code">Kode Produk</Label>
              <Input
                id="code"
                value={formData.code ?? ''}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                placeholder="cth., PRD-AB12"
                className="bg-background border-border"
              />
            </div>
            <div className="space-y-2">
              <Label>Tipe Produk</Label>
              <Select value={formData.type ?? 'barang'} onValueChange={(v: ProductType) => setFormData({ ...formData, type: v })}>
                <SelectTrigger className="bg-background border-border"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(PRODUCT_TYPE_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Nama Produk</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Masukkan nama produk"
              className="bg-background border-border"
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Satuan</Label>
            <Select value={formData.unit ?? 'pcs'} onValueChange={(v: ProductUnit) => setFormData({ ...formData, unit: v })}>
              <SelectTrigger className="bg-background border-border"><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(PRODUCT_UNIT_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="buyPrice">Harga Beli (Rp)</Label>
              <Input
                id="buyPrice"
                type="text"
                inputMode="numeric"
                value={formData.buyPrice ?? 0}
                onChange={(e) => {
                  const numeric = e.target.value.replace(/[^\d]/g, '');
                  setFormData({ ...formData, buyPrice: numeric ? parseInt(numeric, 10) : 0 });
                }}
                className="bg-background border-border"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="price">Harga Jual (Rp)</Label>
              <Input
                id="price"
                type="text"
                inputMode="numeric"
                min="0"
                value={formData.price}
                onChange={(e) => {
                  const numeric = e.target.value.replace(/[^\d]/g, '');
                  setFormData({ ...formData, price: numeric ? parseInt(numeric, 10) : 0 });
                }}
                className="bg-background border-border"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="stock">Stok Awal</Label>
            <Input
              id="stock"
              type="number"
              min="0"
              value={formData.stock}
              onChange={(e) => setFormData({ ...formData, stock: parseInt(e.target.value) || 0 })}
              className="bg-background border-border"
              required
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Batal
            </Button>
            <Button type="submit" disabled={!formData.name}>
              {editingProduct ? 'Simpan Perubahan' : 'Tambah Produk'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
