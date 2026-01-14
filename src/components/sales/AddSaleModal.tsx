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
import { Product, SaleFormData } from '@/types/sales';

interface AddSaleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: SaleFormData, productName: string) => void;
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
      alert(`Not enough stock! Only ${selectedProduct.stock} units available.`);
      return;
    }
    
    onSubmit(formData, selectedProduct.name);
    onClose();
    setFormData({ productId: '', quantity: 1, pricePerUnit: 0 });
  };

  const totalPrice = formData.quantity * formData.pricePerUnit;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-foreground">Record New Sale</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="product">Product</Label>
            <Select
              value={formData.productId}
              onValueChange={(value) => setFormData({ ...formData, productId: value })}
            >
              <SelectTrigger className="bg-background border-border">
                <SelectValue placeholder="Select a product" />
              </SelectTrigger>
              <SelectContent>
                {products.map((product) => (
                  <SelectItem key={product.id} value={product.id}>
                    {product.name} (Stock: {product.stock})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="quantity">Quantity Sold</Label>
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
                Available stock: {selectedProduct.stock} units
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="price">Price Per Unit</Label>
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
              <span className="text-sm text-muted-foreground">Total Sale</span>
              <span className="text-lg font-bold text-primary">
                ${totalPrice.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={!formData.productId || formData.quantity < 1}>
              Record Sale
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
