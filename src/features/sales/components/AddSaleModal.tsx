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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { SaleFormData } from '../types';
import { Product } from '@/features/products/types';

interface AddSaleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: SaleFormData) => void;
  products: Product[];
}

export function AddSaleModal({ isOpen, onClose, onSubmit, products }: AddSaleModalProps) {
  const [formData, setFormData] = useState<SaleFormData>({
    productId: '',
    quantity: 1,
    pricePerUnit: 0,
  });

  const selectedProduct = products.find(p => p.id === formData.productId);

  useEffect(() => {
    if (selectedProduct) {
      setFormData(prev => ({ ...prev, pricePerUnit: selectedProduct.price }));
    }
  }, [selectedProduct]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;
    
    if (formData.quantity > selectedProduct.stock) {
      alert(`Stok tidak cukup! Hanya tersedia ${selectedProduct.stock} unit.`);
      return;
    }
    
    onSubmit(formData);
    onClose();
    setFormData({ productId: '', quantity: 1, pricePerUnit: 0 });
  };

  const totalPrice = formData.quantity * formData.pricePerUnit;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-foreground">Catat Penjualan Baru</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="product">Produk</Label>
            <Select
              value={formData.productId}
              onValueChange={(value) => setFormData({ ...formData, productId: value })}
            >
              <SelectTrigger className="bg-background border-border">
                <SelectValue placeholder="Pilih produk" />
              </SelectTrigger>
              <SelectContent>
                {products.map((product) => (
                  <SelectItem key={product.id} value={product.id}>
                    {product.name} (Stok: {product.stock})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="quantity">Jumlah Terjual</Label>
            <Input
              id="quantity"
              type="number"
              min="1"
              max={selectedProduct?.stock || 999}
              value={formData.quantity}
              onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 1 })}
              className="bg-background border-border"
            />
            {selectedProduct && (
              <p className="text-xs text-muted-foreground">
                Stok tersedia: {selectedProduct.stock} unit
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="price">Harga Satuan</Label>
            <Input
              id="price"
              type="number"
              step="0.01"
              min="0"
              value={formData.pricePerUnit}
              onChange={(e) => setFormData({ ...formData, pricePerUnit: parseFloat(e.target.value) || 0 })}
              className="bg-background border-border"
            />
          </div>

          <div className="p-3 bg-primary/10 rounded-lg border border-primary/20">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Total Penjualan</span>
              <span className="text-lg font-bold text-primary">
                Rp{totalPrice.toLocaleString('id-ID')}
              </span>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Batal
            </Button>
            <Button type="submit" disabled={!formData.productId || formData.quantity < 1}>
              Catat Penjualan
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
