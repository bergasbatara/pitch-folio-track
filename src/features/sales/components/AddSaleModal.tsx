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
import { TaxCode } from '@/features/taxes';
import { todayInputValue } from '@/shared/lib/date';

const NO_TAX = '__none__';

interface AddSaleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: SaleFormData) => Promise<void> | void;
  products: Product[];
  taxCodes: TaxCode[];
}

export function AddSaleModal({
  isOpen,
  onClose,
  onSubmit,
  products,
  taxCodes,
}: AddSaleModalProps) {
  const today = todayInputValue();
  const [formData, setFormData] = useState<SaleFormData>({
    productId: '',
    taxCodeId: null,
    settlementType: 'receivable',
    quantity: 1,
    pricePerUnit: 0,
    soldAt: today,
  });
  const [productCode, setProductCode] = useState('');

  const selectedProduct = products.find((p) => p.id === formData.productId);
  const selectedTaxCode = taxCodes.find((taxCode) => taxCode.id === formData.taxCodeId);
  const subtotalAmount = formData.quantity * formData.pricePerUnit;
  const taxRate = selectedTaxCode?.rate ?? 0;
  const taxAmount = Math.round(subtotalAmount * (taxRate / 100));
  const totalPrice = subtotalAmount + taxAmount;

  useEffect(() => {
    if (selectedProduct) {
      setFormData((prev) => ({ ...prev, pricePerUnit: selectedProduct.price }));
      setProductCode(selectedProduct.code ?? '');
    }
  }, [selectedProduct]);

  useEffect(() => {
    const normalized = productCode.trim().toUpperCase();
    if (!normalized) return;
    const matched = products.find((product) => (product.code ?? '').toUpperCase() === normalized);
    if (matched) {
      setFormData((prev) => ({ ...prev, productId: matched.id }));
    } else {
      setFormData((prev) => ({ ...prev, productId: '' }));
    }
  }, [productCode, products]);

  const resetForm = () => {
    setProductCode('');
    setFormData({
      productId: '',
      taxCodeId: null,
      settlementType: 'receivable',
      quantity: 1,
      pricePerUnit: 0,
      soldAt: today,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;

    if (formData.quantity > selectedProduct.stock) {
      alert(`Stok tidak cukup! Hanya tersedia ${selectedProduct.stock} unit.`);
      return;
    }

    await onSubmit({
      ...formData,
      productCode: productCode.trim() || undefined,
      taxCodeId: formData.taxCodeId ?? null,
    });
    onClose();
    resetForm();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[480px] bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-foreground">Catat Penjualan Baru</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="soldAt">Tanggal</Label>
            <Input
              id="soldAt"
              type="date"
              value={formData.soldAt ?? today}
              onChange={(e) => setFormData({ ...formData, soldAt: e.target.value })}
              className="bg-background border-border"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="productCode">Kode Produk (opsional)</Label>
            <Input
              id="productCode"
              value={productCode}
              onChange={(e) => setProductCode(e.target.value)}
              placeholder="cth., PRD-AB12"
              className="bg-background border-border"
            />
          </div>

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
                    {product.name} {product.code ? `(${product.code})` : ''} (Stok: {product.stock})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="settlementType">Metode Pencatatan</Label>
            <Select
              value={formData.settlementType ?? 'receivable'}
              onValueChange={(value: 'cash' | 'receivable') => setFormData({ ...formData, settlementType: value })}
            >
              <SelectTrigger className="bg-background border-border">
                <SelectValue placeholder="Pilih metode" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="receivable">Piutang Usaha (default)</SelectItem>
                <SelectItem value="cash">Tunai / langsung masuk Kas</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Penjualan kredit akan otomatis masuk ke Piutang Usaha. Gunakan opsi tunai hanya jika pelanggan langsung membayar.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="taxCode">Pajak</Label>
            <Select
              value={formData.taxCodeId ?? NO_TAX}
              onValueChange={(value) => setFormData({ ...formData, taxCodeId: value === NO_TAX ? null : value })}
            >
              <SelectTrigger className="bg-background border-border">
                <SelectValue placeholder="Pilih kode pajak" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NO_TAX}>Tanpa pajak</SelectItem>
                {taxCodes.map((taxCode) => (
                  <SelectItem key={taxCode.id} value={taxCode.id}>
                    {taxCode.name} ({taxCode.rate.toLocaleString('id-ID')}%)
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
              onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value, 10) || 1 })}
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

          <div className="rounded-lg border border-primary/20 bg-primary/10 p-3">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">DPP</span>
                <span className="font-medium text-foreground">Rp{subtotalAmount.toLocaleString('id-ID')}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Pajak {taxRate > 0 ? `(${taxRate.toLocaleString('id-ID')}%)` : ''}
                </span>
                <span className="font-medium text-foreground">Rp{taxAmount.toLocaleString('id-ID')}</span>
              </div>
              <div className="flex items-center justify-between border-t border-primary/20 pt-2">
                <span className="text-sm text-muted-foreground">Grand Total</span>
                <span className="text-lg font-bold text-primary">
                  Rp{totalPrice.toLocaleString('id-ID')}
                </span>
              </div>
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
