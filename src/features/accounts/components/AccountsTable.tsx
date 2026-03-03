import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Pencil, Trash2 } from 'lucide-react';
import { Account } from '../types';

interface AccountsTableProps {
  accounts: Account[];
  onEdit: (account: Account) => void;
  onDelete: (id: string) => void;
}

const TYPE_LABELS: Record<string, string> = {
  asset: 'Aset',
  liability: 'Kewajiban',
  equity: 'Ekuitas',
  revenue: 'Pendapatan',
  expense: 'Beban',
};

const TYPE_COLORS: Record<string, string> = {
  asset: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  liability: 'bg-red-500/10 text-red-500 border-red-500/20',
  equity: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
  revenue: 'bg-green-500/10 text-green-500 border-green-500/20',
  expense: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
};

export function AccountsTable({ accounts, onEdit, onDelete }: AccountsTableProps) {
  if (!accounts.length) {
    return <p className="text-center text-muted-foreground py-8">Belum ada akun.</p>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Kode</TableHead>
          <TableHead>Nama</TableHead>
          <TableHead>Tipe</TableHead>
          <TableHead>Saldo Normal</TableHead>
          <TableHead>Sistem</TableHead>
          <TableHead className="text-right">Aksi</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {accounts.map((a) => (
          <TableRow key={a.id}>
            <TableCell className="font-mono">{a.code}</TableCell>
            <TableCell>{a.name}</TableCell>
            <TableCell>
              <Badge variant="outline" className={TYPE_COLORS[a.type]}>{TYPE_LABELS[a.type] ?? a.type}</Badge>
            </TableCell>
            <TableCell>{a.normalBalance === 'debit' ? 'Debit' : 'Kredit'}</TableCell>
            <TableCell>
              {a.isSystem ? <Badge variant="secondary">Sistem</Badge> : <Badge variant="outline">Kustom</Badge>}
            </TableCell>
            <TableCell className="text-right">
              <div className="flex justify-end gap-1">
                <Button size="icon" variant="ghost" onClick={() => onEdit(a)} disabled={a.isSystem} title="Edit">
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button size="icon" variant="ghost" onClick={() => onDelete(a.id)} disabled={a.isSystem} className="text-destructive hover:text-destructive" title="Hapus">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
