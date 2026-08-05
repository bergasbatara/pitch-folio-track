import { AlertTriangle, ArrowRightLeft, BookOpenCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface TransactionReversalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  transactionLabel: string;
  transactionDate?: string;
  impactLines: string[];
  onConfirm: () => Promise<void> | void;
  isSubmitting?: boolean;
}

export function TransactionReversalDialog({
  open,
  onOpenChange,
  title,
  description,
  transactionLabel,
  transactionDate,
  impactLines,
  onConfirm,
  isSubmitting = false,
}: TransactionReversalDialogProps) {
  const handleConfirm = async () => {
    await onConfirm();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ArrowRightLeft className="h-5 w-5 text-primary" />
            {title}
          </DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="rounded-lg border border-border bg-muted/30 p-4">
            <div className="text-sm font-medium text-foreground">{transactionLabel}</div>
            {transactionDate ? (
              <div className="mt-1 text-xs text-muted-foreground">
                Tanggal transaksi: {transactionDate}
              </div>
            ) : null}
          </div>

          <div className="rounded-lg border border-amber-200 bg-amber-50/80 p-4 text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-100">
            <div className="flex items-start gap-2">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <div className="text-sm">
                Transaksi posted tidak dihapus langsung. Sistem akan membuat pembalikannya agar jejak audit tetap utuh.
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-border p-4">
            <div className="mb-3 flex items-center gap-2 text-sm font-medium text-foreground">
              <BookOpenCheck className="h-4 w-4 text-primary" />
              Dampak reversal
            </div>
            <ul className="space-y-2 text-sm text-muted-foreground">
              {impactLines.map((line) => (
                <li key={line}>• {line}</li>
              ))}
            </ul>
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Batal
          </Button>
          <Button type="button" onClick={handleConfirm} disabled={isSubmitting}>
            {isSubmitting ? 'Memproses...' : 'Buat Reversal'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
