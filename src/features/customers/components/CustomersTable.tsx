import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Pencil, Trash2 } from 'lucide-react';
import { Customer } from '../types';
import { Badge } from '@/components/ui/badge';

const typeLabels: Record<string, string> = { individu: 'Individu', perusahaan: 'Perusahaan', lainnya: 'Lainnya' };

interface Props {
  customers: Customer[];
  onEdit: (c: Customer) => void;
  onDelete: (id: string) => void;
}

export function CustomersTable({ customers, onEdit, onDelete }: Props) {
  if (!customers.length) {
    return <p className="text-center text-muted-foreground py-8">Belum ada pelanggan. Tambahkan pelanggan pertama Anda.</p>;
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
          {customers.map(c => (
            <TableRow key={c.id}>
              <TableCell className="font-medium">{c.name}</TableCell>
              <TableCell><Badge variant="secondary">{typeLabels[c.type] ?? c.type}</Badge></TableCell>
              <TableCell>{c.email || '-'}</TableCell>
              <TableCell>{c.phone || '-'}</TableCell>
              <TableCell>{c.npwp || '-'}</TableCell>
              <TableCell className="text-right space-x-1">
                <Button variant="ghost" size="icon" onClick={() => onEdit(c)}><Pencil className="h-4 w-4" /></Button>
                <Button variant="ghost" size="icon" onClick={() => onDelete(c.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
