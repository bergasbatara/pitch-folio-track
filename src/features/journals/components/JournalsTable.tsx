import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Eye, Pencil, Trash2 } from 'lucide-react';
import { JournalEntry } from '../types';

interface JournalsTableProps {
  entries: JournalEntry[];
  onView: (entry: JournalEntry) => void;
  onEdit: (entry: JournalEntry) => void;
  onDelete: (id: string) => void;
}

const SOURCE_LABELS: Record<string, string> = {
  sale: 'Penjualan',
  purchase: 'Pembelian',
  fixed_asset: 'Aset Tetap',
  receivable: 'Piutang',
  receivable_payment: 'Pembayaran Piutang',
  payable: 'Hutang',
  payable_payment: 'Pembayaran Hutang',
  depreciation: 'Penyusutan',
  tax: 'Pajak',
};

export function JournalsTable({ entries, onView, onEdit, onDelete }: JournalsTableProps) {
  if (!entries.length) {
    return <p className="text-center text-muted-foreground py-8">Belum ada jurnal.</p>;
  }

  const fmt = (v: number) => `Rp${v.toLocaleString('id-ID')}`;

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Tanggal</TableHead>
          <TableHead>Memo</TableHead>
          <TableHead>Sumber</TableHead>
          <TableHead className="text-right">Total Debit</TableHead>
          <TableHead className="text-right">Total Kredit</TableHead>
          <TableHead className="text-right">Aksi</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {entries.map((e) => {
          const totalDebit = e.lines.reduce((s, l) => s + l.debit, 0);
          const totalCredit = e.lines.reduce((s, l) => s + l.credit, 0);
          const isSystem = !!e.source;
          return (
            <TableRow key={e.id}>
              <TableCell>{new Date(e.date).toLocaleDateString('id-ID')}</TableCell>
              <TableCell className="max-w-[200px] truncate">{e.memo ?? '-'}</TableCell>
              <TableCell>
                {isSystem ? (
                  <Badge variant="secondary">{SOURCE_LABELS[e.source!] ?? e.source}</Badge>
                ) : (
                  <Badge variant="outline">Manual</Badge>
                )}
              </TableCell>
              <TableCell className="text-right">{fmt(totalDebit)}</TableCell>
              <TableCell className="text-right">{fmt(totalCredit)}</TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-1">
                  <Button size="icon" variant="ghost" onClick={() => onView(e)} title="Lihat"><Eye className="h-4 w-4" /></Button>
                  <Button size="icon" variant="ghost" onClick={() => onEdit(e)} title="Edit"><Pencil className="h-4 w-4" /></Button>
                  <Button size="icon" variant="ghost" onClick={() => onDelete(e.id)} className="text-destructive hover:text-destructive" title="Hapus"><Trash2 className="h-4 w-4" /></Button>
                </div>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
