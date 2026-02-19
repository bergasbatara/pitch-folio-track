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
import { PurchaseCategory, Purchase, PurchaseFormData } from '../types';
import { Plus } from 'lucide-react';

interface AddPurchaseModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categories: PurchaseCategory[];
  onAddCategory: (name: string) => Promise<PurchaseCategory>;
  onAddPurchase: (purchase: PurchaseFormData) => Promise<void> | void;
  editingPurchase?: Purchase | null;
  onUpdatePurchase?: (id: string, updates: Partial<PurchaseFormData>) => Promise<void> | void;
}

const defaultDate = () => new Date().toISOString().split('T')[0];

export function AddPurchaseModal({
  open,
  onOpenChange,
  categories,
  onAddCategory,
  onAddPurchase,
  editingPurchase,
  onUpdatePurchase,
}: AddPurchaseModalProps) {
  const [date, setDate] = useState(defaultDate());
  const [categoryId, setCategoryId] = useState('');
  const [itemName, setItemName] = useState('');
  const [productCode, setProductCode] = useState('');
  const [supplier, setSupplier] = useState('');
  const [quantity, setQuantity] = useState('');
  const [unitCost, setUnitCost] = useState('');
  const [notes, setNotes] = useState('');
  const [newCategoryName, setNewCategoryName] = useState('');
  const [showNewCategory, setShowNewCategory] = useState(false);

  useEffect(() => {
    if (editingPurchase && open) {
      setDate(toInputDate(editingPurchase.date));
      setCategoryId(editingPurchase.categoryId);
      setItemName(editingPurchase.itemName ?? '');
      setProductCode(editingPurchase.productCode ?? '');
      setSupplier(editingPurchase.supplier ?? '');
      setQuantity(editingPurchase.quantity?.toString() ?? '');
      setUnitCost(editingPurchase.unitCost?.toString() ?? '');
      setNotes(editingPurchase.notes ?? '');
      setNewCategoryName('');
      setShowNewCategory(false);
      return;
    }
    if (open) {
      resetForm();
    }
  }, [editingPurchase, open]);

  const resetForm = () => {
    setDate(defaultDate());
    setCategoryId('');
    setItemName('');
    setProductCode('');
    setSupplier('');
    setQuantity('');
    setUnitCost('');
    setNotes('');
    setNewCategoryName('');
    setShowNewCategory(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!categoryId || !itemName || !quantity || !unitCost) return;

    const purchaseData: PurchaseFormData = {
      date,
      categoryId,
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

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) return;
    const newCategory = await onAddCategory(newCategoryName);
    setCategoryId(newCategory.id);
    setNewCategoryName('');
    setShowNewCategory(false);
  };

  const totalCost = quantity && unitCost
    ? (parseFloat(quantity) * parseFloat(unitCost)).toFixed(2)
    : '0.00';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{editingPurchase ? 'Edit Pembelian' : 'Tambah Pembelian'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
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
            <div className="space-y-2">
              <Label htmlFor="category">Kategori</Label>
              {showNewCategory ? (
                <div className="flex gap-2">
                  <Input
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    placeholder="Nama kategori"
                  />
                  <Button type="button" size="sm" onClick={handleAddCategory}>
                    Tambah
                  </Button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <Select value={categoryId} onValueChange={setCategoryId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih kategori" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => setShowNewCategory(true)}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              )}
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
            <Button type="submit">
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
