import { useState } from 'react';
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
import { PurchaseCategory, Purchase } from '@/data/types/purchases';
import { Plus } from 'lucide-react';

interface AddPurchaseModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categories: PurchaseCategory[];
  onAddCategory: (name: string) => PurchaseCategory;
  onAddPurchase: (purchase: Omit<Purchase, 'id' | 'createdAt' | 'totalCost'>) => void;
  editingPurchase?: Purchase | null;
  onUpdatePurchase?: (id: string, updates: Partial<Purchase>) => void;
}

export function AddPurchaseModal({
  open,
  onOpenChange,
  categories,
  onAddCategory,
  onAddPurchase,
  editingPurchase,
  onUpdatePurchase,
}: AddPurchaseModalProps) {
  const [date, setDate] = useState(editingPurchase?.date || new Date().toISOString().split('T')[0]);
  const [categoryId, setCategoryId] = useState(editingPurchase?.categoryId || '');
  const [itemName, setItemName] = useState(editingPurchase?.itemName || '');
  const [supplier, setSupplier] = useState(editingPurchase?.supplier || '');
  const [quantity, setQuantity] = useState(editingPurchase?.quantity?.toString() || '');
  const [unitCost, setUnitCost] = useState(editingPurchase?.unitCost?.toString() || '');
  const [notes, setNotes] = useState(editingPurchase?.notes || '');
  const [newCategoryName, setNewCategoryName] = useState('');
  const [showNewCategory, setShowNewCategory] = useState(false);

  const resetForm = () => {
    setDate(new Date().toISOString().split('T')[0]);
    setCategoryId('');
    setItemName('');
    setSupplier('');
    setQuantity('');
    setUnitCost('');
    setNotes('');
    setNewCategoryName('');
    setShowNewCategory(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!categoryId || !itemName || !quantity || !unitCost) return;

    const purchaseData = {
      date,
      categoryId,
      itemName: itemName.trim(),
      supplier: supplier.trim() || undefined,
      quantity: parseFloat(quantity),
      unitCost: parseFloat(unitCost),
      notes: notes.trim() || undefined,
    };

    if (editingPurchase && onUpdatePurchase) {
      onUpdatePurchase(editingPurchase.id, purchaseData);
    } else {
      onAddPurchase(purchaseData);
    }

    resetForm();
    onOpenChange(false);
  };

  const handleAddCategory = () => {
    if (!newCategoryName.trim()) return;
    const newCategory = onAddCategory(newCategoryName);
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
          <DialogTitle>{editingPurchase ? 'Edit Purchase' : 'Add Purchase'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              {showNewCategory ? (
                <div className="flex gap-2">
                  <Input
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    placeholder="Category name"
                  />
                  <Button type="button" size="sm" onClick={handleAddCategory}>
                    Add
                  </Button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <Select value={categoryId} onValueChange={setCategoryId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
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
            <Label htmlFor="itemName">Item Name</Label>
            <Input
              id="itemName"
              value={itemName}
              onChange={(e) => setItemName(e.target.value)}
              placeholder="e.g., Flour, Packaging boxes"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="supplier">Supplier (optional)</Label>
            <Input
              id="supplier"
              value={supplier}
              onChange={(e) => setSupplier(e.target.value)}
              placeholder="e.g., ABC Supplies Inc."
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="quantity">Quantity</Label>
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
              <Label htmlFor="unitCost">Unit Cost (Rp)</Label>
              <Input
                id="unitCost"
                type="number"
                min="0"
                step="0.01"
                value={unitCost}
                onChange={(e) => setUnitCost(e.target.value)}
                placeholder="0.00"
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
            <Label htmlFor="notes">Notes (optional)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any additional details..."
              rows={2}
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">
              {editingPurchase ? 'Save Changes' : 'Add Purchase'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
