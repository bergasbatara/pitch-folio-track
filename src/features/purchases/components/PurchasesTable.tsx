import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import { Purchase } from '../types';
import { formatDateId } from '@/shared/lib/date';

interface PurchasesTableProps {
  purchases: Purchase[];
  onEdit: (purchase: Purchase) => void;
  onDelete: (id: string) => void;
}

export function PurchasesTable({ purchases, onEdit, onDelete }: PurchasesTableProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(value);
  };

  if (purchases.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-border bg-card p-12">
        <p className="text-muted-foreground">Belum ada pembelian tercatat</p>
        <p className="text-sm text-muted-foreground/70">Tambahkan pembelian pertama untuk mulai melacak pengeluaran</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Tanggal</TableHead>
            <TableHead>Barang</TableHead>
            <TableHead>Pemasok</TableHead>
            <TableHead className="text-right">Jml</TableHead>
            <TableHead className="text-right">Harga Satuan</TableHead>
            <TableHead className="text-right">Total</TableHead>
            <TableHead className="w-12"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {purchases.map((purchase) => (
            <TableRow key={purchase.id}>
              <TableCell className="text-muted-foreground">
                {formatDateId(purchase.date)}
              </TableCell>
              <TableCell className="font-medium">{purchase.itemName}</TableCell>
              <TableCell className="text-muted-foreground">
                {purchase.supplier || '-'}
              </TableCell>
              <TableCell className="text-right">{purchase.quantity}</TableCell>
              <TableCell className="text-right text-muted-foreground">
                {formatCurrency(purchase.unitCost)}
              </TableCell>
              <TableCell className="text-right font-medium">
                {formatCurrency(purchase.totalCost)}
              </TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onEdit(purchase)}>
                      <Pencil className="mr-2 h-4 w-4" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => onDelete(purchase.id)}
                      className="text-destructive focus:text-destructive"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Hapus
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
