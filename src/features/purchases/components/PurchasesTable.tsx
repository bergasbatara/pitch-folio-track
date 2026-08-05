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
import { MoreHorizontal, Pencil, RotateCcw, Trash2, XCircle } from 'lucide-react';
import { Purchase } from '../types';
import { formatDateId } from '@/shared/lib/date';
import { Badge } from '@/components/ui/badge';

interface PurchasesTableProps {
  purchases: Purchase[];
  onEdit: (purchase: Purchase) => void;
  onDelete: (id: string) => void;
  onCreateReturn: (purchase: Purchase) => void;
  onCreateCancellation: (purchase: Purchase) => void;
}

const statusLabel: Record<Purchase['status'], string> = {
  draft: 'Draft',
  posted: 'Posted',
  voided: 'Void',
};

const statusVariant: Record<Purchase['status'], 'secondary' | 'default' | 'destructive'> = {
  draft: 'secondary',
  posted: 'default',
  voided: 'destructive',
};

const transactionTypeLabel: Record<Purchase['transactionType'], string> = {
  purchase: 'Pembelian',
  purchase_return: 'Retur',
  purchase_cancellation: 'Pembatalan',
};

const transactionTypeVariant: Record<Purchase['transactionType'], 'default' | 'secondary' | 'destructive'> = {
  purchase: 'default',
  purchase_return: 'secondary',
  purchase_cancellation: 'destructive',
};

const getPurchaseSign = (purchase: Purchase) => purchase.transactionType === 'purchase' ? 1 : -1;

export function PurchasesTable({ purchases, onEdit, onDelete, onCreateReturn, onCreateCancellation }: PurchasesTableProps) {
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
            <TableHead>Jenis</TableHead>
            <TableHead>Pemasok</TableHead>
            <TableHead>Pajak</TableHead>
            <TableHead>Status</TableHead>
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
              <TableCell>
                <Badge variant={transactionTypeVariant[purchase.transactionType]}>
                  {transactionTypeLabel[purchase.transactionType]}
                </Badge>
              </TableCell>
              <TableCell className="text-muted-foreground">
                {purchase.supplier || '-'}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {purchase.taxCodeName ? (
                  <div className="space-y-1">
                    <div className="font-medium text-foreground">{purchase.taxCodeName}</div>
                    <div className="text-xs">{purchase.taxRate.toLocaleString('id-ID')}%</div>
                  </div>
                ) : (
                  '-'
                )}
              </TableCell>
              <TableCell>
                <Badge variant={statusVariant[purchase.status]}>
                  {statusLabel[purchase.status]}
                </Badge>
              </TableCell>
              <TableCell className="text-right">{getPurchaseSign(purchase) * purchase.quantity}</TableCell>
              <TableCell className="text-right text-muted-foreground">
                {formatCurrency(purchase.unitCost)}
              </TableCell>
              <TableCell className="text-right">
                <div className="font-medium">
                  {getPurchaseSign(purchase) < 0 ? '-' : ''}{formatCurrency(purchase.totalCost)}
                </div>
                <div className="text-xs text-muted-foreground">
                  DPP {getPurchaseSign(purchase) < 0 ? '-' : ''}{formatCurrency(purchase.subtotalCost)}
                  {purchase.taxAmount > 0 ? ` + Pajak ${getPurchaseSign(purchase) < 0 ? '-' : ''}${formatCurrency(purchase.taxAmount)}` : ''}
                </div>
              </TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {purchase.status === 'draft' && (
                      <>
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
                      </>
                    )}
                    {purchase.status === 'posted' && purchase.transactionType === 'purchase' && (
                      <>
                        <DropdownMenuItem onClick={() => onCreateReturn(purchase)}>
                          <RotateCcw className="mr-2 h-4 w-4" />
                          Catat Retur
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onCreateCancellation(purchase)}>
                          <XCircle className="mr-2 h-4 w-4" />
                          Batalkan Pembelian
                        </DropdownMenuItem>
                      </>
                    )}
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
