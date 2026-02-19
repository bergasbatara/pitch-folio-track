import { Product, PRODUCT_TYPE_LABELS, PRODUCT_UNIT_LABELS } from '../types';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Pencil, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface ProductsTableProps {
  products: Product[];
  onEdit: (product: Product) => void;
  onDelete: (id: string) => void;
}

export function ProductsTable({ products, onEdit, onDelete }: ProductsTableProps) {
  if (products.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>Belum ada produk ditambahkan.</p>
        <p className="text-sm mt-1">Klik "Tambah Produk" untuk menambah produk pertama.</p>
      </div>
    );
  }

  const getStockStatus = (stock: number) => {
    if (stock === 0) return { label: 'Stok Habis', variant: 'destructive' as const };
    if (stock < 10) return { label: 'Stok Rendah', variant: 'secondary' as const };
    return { label: 'Tersedia', variant: 'default' as const };
  };

  return (
    <div className="rounded-lg border border-border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead>Nama Produk</TableHead>
            <TableHead>Kode</TableHead>
            <TableHead>Tipe</TableHead>
            <TableHead>Satuan</TableHead>
            <TableHead className="text-right">Harga Beli</TableHead>
            <TableHead className="text-right">Harga Jual</TableHead>
            <TableHead className="text-right">Stok</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-[100px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {products.map((product) => {
            const status = getStockStatus(product.stock);
            return (
              <TableRow key={product.id}>
                <TableCell className="font-medium">{product.name}</TableCell>
                <TableCell className="text-muted-foreground">{product.code || '-'}</TableCell>
                <TableCell>
                  <Badge variant="outline">{PRODUCT_TYPE_LABELS[product.type ?? 'barang']}</Badge>
                </TableCell>
                <TableCell>{PRODUCT_UNIT_LABELS[product.unit ?? 'pcs']}</TableCell>
                <TableCell className="text-right">
                  {product.buyPrice ? `Rp${product.buyPrice.toLocaleString('id-ID')}` : '-'}
                </TableCell>
                <TableCell className="text-right">
                  Rp{product.price.toLocaleString('id-ID')}
                </TableCell>
                <TableCell className="text-right">{product.stock}</TableCell>
                <TableCell>
                  <Badge variant={status.variant}>{status.label}</Badge>
                </TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => onEdit(product)} className="h-8 w-8 text-muted-foreground hover:text-foreground">
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => onDelete(product.id)} className="h-8 w-8 text-muted-foreground hover:text-destructive">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
