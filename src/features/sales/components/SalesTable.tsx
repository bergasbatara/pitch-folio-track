import { Sale } from '../types';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { RotateCcw, Trash2 } from 'lucide-react';
import { formatDateId } from '@/shared/lib/date';

interface SalesTableProps {
  sales: Sale[];
  onDelete: (id: string) => void;
  onReverse: (sale: Sale) => void;
}

const statusLabel: Record<Sale['status'], string> = {
  draft: 'Draft',
  posted: 'Posted',
  voided: 'Void',
};

const statusVariant: Record<Sale['status'], 'secondary' | 'default' | 'destructive'> = {
  draft: 'secondary',
  posted: 'default',
  voided: 'destructive',
};

export function SalesTable({ sales, onDelete, onReverse }: SalesTableProps) {
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
            <TableHead>Pajak</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Jml</TableHead>
            <TableHead className="text-right">Harga Satuan</TableHead>
            <TableHead className="text-right">Total</TableHead>
            <TableHead className="w-[110px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sales.map((sale) => (
            <TableRow key={sale.id}>
              <TableCell className="text-muted-foreground">
                {formatDateId(sale.soldAt)}
              </TableCell>
              <TableCell className="font-medium">{sale.productName}</TableCell>
              <TableCell className="text-muted-foreground">
                {sale.taxCodeName ? (
                  <div className="space-y-1">
                    <div className="font-medium text-foreground">{sale.taxCodeName}</div>
                    <div className="text-xs">{sale.taxRate.toLocaleString('id-ID')}%</div>
                  </div>
                ) : (
                  '-'
                )}
              </TableCell>
              <TableCell>
                <Badge variant={statusVariant[sale.status]}>
                  {statusLabel[sale.status]}
                </Badge>
              </TableCell>
              <TableCell className="text-right">{sale.quantity}</TableCell>
              <TableCell className="text-right">
                Rp{sale.pricePerUnit.toLocaleString('id-ID')}
              </TableCell>
              <TableCell className="text-right">
                <div className="font-semibold text-primary">
                  Rp{sale.totalPrice.toLocaleString('id-ID')}
                </div>
                <div className="text-xs text-muted-foreground">
                  DPP Rp{sale.subtotalAmount.toLocaleString('id-ID')}
                  {sale.taxAmount > 0 ? ` + Pajak Rp${sale.taxAmount.toLocaleString('id-ID')}` : ''}
                </div>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex items-center justify-end gap-1">
                  {sale.status === 'draft' && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onDelete(sale.id)}
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                  {sale.status === 'posted' && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onReverse(sale)}
                      className="h-8 w-8 text-muted-foreground"
                      title="Reverse penjualan"
                    >
                      <RotateCcw className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
