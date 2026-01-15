import { useState } from 'react';
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
import { Purchase, PurchaseCategory } from '@/data/types/purchases';
import { format } from 'date-fns';

interface PurchasesTableProps {
  purchases: Purchase[];
  categories: PurchaseCategory[];
  onEdit: (purchase: Purchase) => void;
  onDelete: (id: string) => void;
}

export function PurchasesTable({ purchases, categories, onEdit, onDelete }: PurchasesTableProps) {
  const getCategoryName = (categoryId: string) => {
    return categories.find(c => c.id === categoryId)?.name || 'Unknown';
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(value);
  };

  if (purchases.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-border bg-card p-12">
        <p className="text-muted-foreground">No purchases recorded yet</p>
        <p className="text-sm text-muted-foreground/70">Add your first purchase to start tracking expenses</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Item</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Supplier</TableHead>
            <TableHead className="text-right">Qty</TableHead>
            <TableHead className="text-right">Unit Cost</TableHead>
            <TableHead className="text-right">Total</TableHead>
            <TableHead className="w-12"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {purchases.map((purchase) => (
            <TableRow key={purchase.id}>
              <TableCell className="text-muted-foreground">
                {format(new Date(purchase.date), 'MMM d, yyyy')}
              </TableCell>
              <TableCell className="font-medium">{purchase.itemName}</TableCell>
              <TableCell>
                <span className="inline-flex items-center rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium text-secondary-foreground">
                  {getCategoryName(purchase.categoryId)}
                </span>
              </TableCell>
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
                      Delete
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
