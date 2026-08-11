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
import { TaxCode } from '@/features/taxes';
import { Purchase, PurchaseFormData } from '../types';
import { todayInputValue } from '@/shared/lib/date';

const NO_TAX = '__none__';

interface AddPurchaseModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddPurchase: (purchase: PurchaseFormData) => Promise<void> | void;
  editingPurchase?: Purchase | null;
  onUpdatePurchase?: (id: string, updates: Partial<PurchaseFormData>) => Promise<void> | void;
  taxCodes: TaxCode[];
}

const defaultDate = () => todayInputValue();

export function AddPurchaseModal({
  open,
  onOpenChange,
  onAddPurchase,
  editingPurchase,
  onUpdatePurchase,
  taxCodes,
}: AddPurchaseModalProps) {
  const [date, setDate] = useState(defaultDate());
  const [itemName, setItemName] = useState('');
  const [productCode, setProductCode] = useState('');
  const [taxCodeId, setTaxCodeId] = useState<string | null>(null);
  const [settlementType, setSettlementType] = useState<'cash' | 'payable'>('payable');
  const [supplier, setSupplier] = useState('');
  const [quantity, setQuantity] = useState('');
  const [unitCost, setUnitCost] = useState('');
  const [notes, setNotes] = useState('');

  const selectedTaxCode = taxCodes.find((taxCode) => taxCode.id === taxCodeId);
  const subtotalCost = quantity && unitCost ? parseFloat(quantity) * parseFloat(unitCost) : 0;
  const taxRate = selectedTaxCode?.rate ?? 0;
  const taxAmount = Math.round(subtotalCost * (taxRate / 100));
  const totalCost = subtotalCost + taxAmount;

  useEffect(() => {
    if (editingPurchase && open) {
      setDate(toInputDate(editingPurchase.date));
      setItemName(editingPurchase.itemName ?? '');
      setProductCode(editingPurchase.productCode ?? '');
      setTaxCodeId(editingPurchase.taxCodeId ?? null);
      setSettlementType(editingPurchase.settlementType ?? 'payable');
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
    setTaxCodeId(null);
    setSettlementType('payable');
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
      taxCodeId,
      settlementType,
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
            <Label htmlFor="settlementType">Metode Pencatatan</Label>
            <Select value={settlementType} onValueChange={(value: 'cash' | 'payable') => setSettlementType(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Pilih metode" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="payable">Hutang Usaha (default)</SelectItem>
                <SelectItem value="cash">Tunai / langsung keluar Kas</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Pembelian kredit akan otomatis masuk ke Hutang Usaha. Pilih tunai hanya jika transaksi langsung dibayar.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="taxCode">Pajak</Label>
            <Select value={taxCodeId ?? NO_TAX} onValueChange={(value) => setTaxCodeId(value === NO_TAX ? null : value)}>
              <SelectTrigger>
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
                Rp{Math.round(totalCost).toLocaleString('id-ID')}
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-border bg-muted/40 p-3 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">DPP</span>
              <span className="font-medium">Rp{subtotalCost.toLocaleString('id-ID')}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                Pajak {taxRate > 0 ? `(${taxRate.toLocaleString('id-ID')}%)` : ''}
              </span>
              <span className="font-medium">Rp{taxAmount.toLocaleString('id-ID')}</span>
            </div>
            <div className="flex items-center justify-between border-t border-border pt-2">
              <span className="text-sm text-muted-foreground">Grand Total</span>
              <span className="text-base font-semibold">Rp{Math.round(totalCost).toLocaleString('id-ID')}</span>
            </div>
          </div>

          <div className="rounded-lg border border-dashed border-border bg-muted/20 p-3">
            <div className="mb-2 text-sm font-medium text-foreground">Rincian Perhitungan</div>
            <div className="space-y-1 text-xs text-muted-foreground">
              <p>
                DPP = {Number(quantity || 0).toLocaleString('id-ID')} x Rp
                {Number(unitCost || 0).toLocaleString('id-ID')}
              </p>
              <p>
                Pajak = Rp{subtotalCost.toLocaleString('id-ID')} x {taxRate.toLocaleString('id-ID')}%
              </p>
              <p>
                Grand Total = DPP + Pajak = Rp{Math.round(totalCost).toLocaleString('id-ID')}
              </p>
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
