import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Pencil, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { LEItem } from './AddLEModal';

const fmt = (v: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(v);

interface Props {
  items: LEItem[];
  onEdit: (item: LEItem) => void;
  onDelete: (id: string) => void;
}

export function LETable({ items, onEdit, onDelete }: Props) {
  if (!items.length) {
    return <p className="text-center text-muted-foreground py-8">Belum ada data liabilitas atau ekuitas.</p>;
  }
  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Akun</TableHead>
            <TableHead>Jenis</TableHead>
            <TableHead>Tanggal</TableHead>
            <TableHead>Keterangan</TableHead>
            <TableHead className="text-right">Nominal</TableHead>
            <TableHead className="text-right">Aksi</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((it) => (
            <TableRow key={it.id}>
              <TableCell className="font-medium">{it.accountCode} - {it.accountName}</TableCell>
              <TableCell>
                <Badge variant={it.type === 'liability' ? 'default' : 'outline'}>
                  {it.type === 'liability' ? 'Liabilitas' : 'Ekuitas'}
                </Badge>
              </TableCell>
              <TableCell>{new Date(it.date).toLocaleDateString('id-ID')}</TableCell>
              <TableCell className="text-muted-foreground">{it.memo || '-'}</TableCell>
              <TableCell className="text-right font-semibold">{fmt(it.amount)}</TableCell>
              <TableCell className="text-right space-x-1">
                <Button variant="ghost" size="icon" onClick={() => onEdit(it)}><Pencil className="h-4 w-4" /></Button>
                <Button variant="ghost" size="icon" onClick={() => onDelete(it.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
