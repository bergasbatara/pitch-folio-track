import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { JournalEntry } from '../types';

interface JournalDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  entry: JournalEntry | null;
}

export function JournalDetailModal({ isOpen, onClose, entry }: JournalDetailModalProps) {
  if (!entry) return null;

  const totalDebit = entry.lines.reduce((s, l) => s + l.debit, 0);
  const totalCredit = entry.lines.reduce((s, l) => s + l.credit, 0);
  const fmt = (v: number) => v > 0 ? `Rp${v.toLocaleString('id-ID')}` : '-';

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-foreground">Detail Jurnal</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex gap-4 text-sm">
            <div><span className="text-muted-foreground">Tanggal:</span> {new Date(entry.date).toLocaleDateString('id-ID')}</div>
            {entry.source && <Badge variant="secondary">{entry.source}</Badge>}
          </div>
          {entry.memo && <p className="text-sm text-muted-foreground">{entry.memo}</p>}

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Akun</TableHead>
                <TableHead className="text-right">Debit</TableHead>
                <TableHead className="text-right">Kredit</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {entry.lines.map((line) => (
                <TableRow key={line.id}>
                  <TableCell>{line.account.code} - {line.account.name}</TableCell>
                  <TableCell className="text-right">{fmt(line.debit)}</TableCell>
                  <TableCell className="text-right">{fmt(line.credit)}</TableCell>
                </TableRow>
              ))}
              <TableRow className="font-bold">
                <TableCell>Total</TableCell>
                <TableCell className="text-right">{fmt(totalDebit)}</TableCell>
                <TableCell className="text-right">{fmt(totalCredit)}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </DialogContent>
    </Dialog>
  );
}
