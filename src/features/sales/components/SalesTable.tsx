import { Sale } from '../types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import { formatDateId } from '@/shared/lib/date';

interface SalesTableProps {
  sales: Sale[];
  onDelete: (id: string) => void;
}

export function SalesTable({ sales, onDelete }: SalesTableProps) {
  if (sales.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>Belum ada penjualan tercatat.</p>
        <p className="text-sm mt-1">Klik "Catat Penjualan" untuk menambah penjualan pertama.</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead>Tanggal</TableHead>
            <TableHead>Produk</TableHead>
            <TableHead className="text-right">Jml</TableHead>
            <TableHead className="text-right">Harga Satuan</TableHead>
            <TableHead className="text-right">Total</TableHead>
            <TableHead className="w-[50px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sales.map((sale) => (
            <TableRow key={sale.id}>
              <TableCell className="text-muted-foreground">
                {formatDateId(sale.soldAt)}
              </TableCell>
              <TableCell className="font-medium">{sale.productName}</TableCell>
              <TableCell className="text-right">{sale.quantity}</TableCell>
              <TableCell className="text-right">
                Rp{sale.pricePerUnit.toLocaleString('id-ID')}
              </TableCell>
              <TableCell className="text-right font-semibold text-primary">
                Rp{sale.totalPrice.toLocaleString('id-ID')}
              </TableCell>
              <TableCell>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onDelete(sale.id)}
                  className="h-8 w-8 text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
