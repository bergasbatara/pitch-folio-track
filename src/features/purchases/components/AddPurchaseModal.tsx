import { useEffect, useState } from 'react';
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
import { Textarea } from '@/components/ui/textarea';
import { Purchase, PurchaseFormData } from '../types';
import { todayInputValue } from '@/shared/lib/date';

interface AddPurchaseModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddPurchase: (purchase: PurchaseFormData) => Promise<void> | void;
  editingPurchase?: Purchase | null;
  onUpdatePurchase?: (id: string, updates: Partial<PurchaseFormData>) => Promise<void> | void;
}

const defaultDate = () => todayInputValue();

export function AddPurchaseModal({
  open,
  onOpenChange,
  onAddPurchase,
  editingPurchase,
  onUpdatePurchase,
}: AddPurchaseModalProps) {
  const [date, setDate] = useState(defaultDate());
  const [itemName, setItemName] = useState('');
  const [productCode, setProductCode] = useState('');
  const [supplier, setSupplier] = useState('');
  const [quantity, setQuantity] = useState('');
  const [unitCost, setUnitCost] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (editingPurchase && open) {
      setDate(toInputDate(editingPurchase.date));
      setItemName(editingPurchase.itemName ?? '');
      setProductCode(editingPurchase.productCode ?? '');
      setSupplier(editingPurchase.supplier ?? '');
      setQuantity(editingPurchase.quantity?.toString() ?? '');
      setUnitCost(editingPurchase.unitCost?.toString() ?? '');
      setNotes(editingPurchase.notes ?? '');
      return;
    }
    if (open) {
      resetForm();
    }
  }, [editingPurchase, open]);

  const resetForm = () => {
    setDate(defaultDate());
    setItemName('');
    setProductCode('');
    setSupplier('');
    setQuantity('');
    setUnitCost('');
    setNotes('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!itemName || !quantity || !unitCost) return;

    const purchaseData: PurchaseFormData = {
      date,
      productCode: productCode.trim() || undefined,
      itemName: itemName.trim(),
      supplier: supplier.trim() || undefined,
      quantity: parseFloat(quantity),
      unitCost: parseFloat(unitCost),
      notes: notes.trim() || undefined,
    };

    if (editingPurchase && onUpdatePurchase) {
      await onUpdatePurchase(editingPurchase.id, purchaseData);
    } else {
      await onAddPurchase(purchaseData);
    }

    resetForm();
    onOpenChange(false);
  };

  const totalCost = quantity && unitCost
    ? (parseFloat(quantity) * parseFloat(unitCost)).toFixed(2)
    : '0.00';

  const canSubmit = !!itemName.trim() && Number(quantity) > 0 && Number(unitCost) > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{editingPurchase ? 'Edit Pembelian' : 'Tambah Pembelian'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date">Tanggal</Label>
              <Input
                id="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="itemName">Nama Barang</Label>
            <Input
              id="itemName"
              value={itemName}
              onChange={(e) => setItemName(e.target.value)}
              placeholder="cth., Tepung, Kardus kemasan"
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
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="supplier">Pemasok (opsional)</Label>
            <Input
              id="supplier"
              value={supplier}
              onChange={(e) => setSupplier(e.target.value)}
              placeholder="cth., PT Supplier ABC"
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="quantity">Jumlah</Label>
              <Input
                id="quantity"
                type="number"
                min="0"
                step="0.01"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="0"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="unitCost">Harga Satuan (Rp)</Label>
              <Input
                id="unitCost"
                type="number"
                min="0"
                step="0.01"
                value={unitCost}
                onChange={(e) => setUnitCost(e.target.value)}
                placeholder="0"
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Total</Label>
              <div className="flex h-10 items-center rounded-lg border border-border bg-muted px-3 text-sm font-medium">
                Rp{parseInt(totalCost).toLocaleString('id-ID')}
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Catatan (opsional)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Detail tambahan..."
              rows={2}
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Batal
            </Button>
            <Button type="submit" disabled={!canSubmit}>
              {editingPurchase ? 'Simpan Perubahan' : 'Tambah Pembelian'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

const toInputDate = (value?: string) => {
  if (!value) return defaultDate();
  return value.split('T')[0];
};
