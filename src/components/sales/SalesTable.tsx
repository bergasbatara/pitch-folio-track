import { Sale } from '@/types/sales';
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
import { format } from 'date-fns';

interface SalesTableProps {
  sales: Sale[];
  onDelete: (id: string) => void;
}

export function SalesTable({ sales, onDelete }: SalesTableProps) {
  if (sales.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>No sales recorded yet.</p>
        <p className="text-sm mt-1">Click "Record Sale" to add your first sale.</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead>Date & Time</TableHead>
            <TableHead>Product</TableHead>
            <TableHead className="text-right">Qty</TableHead>
            <TableHead className="text-right">Unit Price</TableHead>
            <TableHead className="text-right">Total</TableHead>
            <TableHead className="w-[50px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sales.map((sale) => (
            <TableRow key={sale.id}>
              <TableCell className="text-muted-foreground">
                {format(new Date(sale.soldAt), 'MMM d, yyyy h:mm a')}
              </TableCell>
              <TableCell className="font-medium">{sale.productName}</TableCell>
              <TableCell className="text-right">{sale.quantity}</TableCell>
              <TableCell className="text-right">
                ${sale.pricePerUnit.toFixed(2)}
              </TableCell>
              <TableCell className="text-right font-semibold text-primary">
                ${sale.totalPrice.toFixed(2)}
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
