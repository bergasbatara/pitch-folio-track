import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Pencil, Trash2 } from 'lucide-react';
import { Supplier } from '../types';
import { Badge } from '@/components/ui/badge';

const typeLabels: Record<string, string> = { individu: 'Individu', perusahaan: 'Perusahaan', lainnya: 'Lainnya' };

interface Props {
  suppliers: Supplier[];
  onEdit: (s: Supplier) => void;
  onDelete: (id: string) => void;
}

export function SuppliersTable({ suppliers, onEdit, onDelete }: Props) {
  if (!suppliers.length) {
    return <p className="text-center text-muted-foreground py-8">Belum ada supplier. Tambahkan supplier pertama Anda.</p>;
  }
  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nama</TableHead>
            <TableHead>Jenis</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Telepon</TableHead>
            <TableHead>NPWP</TableHead>
            <TableHead className="text-right">Aksi</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {suppliers.map(s => (
            <TableRow key={s.id}>
              <TableCell className="font-medium">{s.name}</TableCell>
              <TableCell><Badge variant="secondary">{typeLabels[s.type] ?? s.type}</Badge></TableCell>
              <TableCell>{s.email || '-'}</TableCell>
              <TableCell>{s.phone || '-'}</TableCell>
              <TableCell>{s.npwp || '-'}</TableCell>
              <TableCell className="text-right space-x-1">
                <Button variant="ghost" size="icon" onClick={() => onEdit(s)}><Pencil className="h-4 w-4" /></Button>
                <Button variant="ghost" size="icon" onClick={() => onDelete(s.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
