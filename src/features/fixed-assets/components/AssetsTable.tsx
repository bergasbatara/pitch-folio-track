import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Pencil, Trash2 } from 'lucide-react';
import { FixedAsset, ASSET_CATEGORY_LABELS, ASSET_TYPE_LABELS, calculateDepreciation } from '../types';
import { Badge } from '@/components/ui/badge';

const fmt = (v: number) => {
  const abs = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(Math.abs(v));
  return v < 0 ? `(${abs})` : abs;
};

interface Props {
  assets: FixedAsset[];
  onEdit: (a: FixedAsset) => void;
  onDelete: (id: string) => void;
}

export function AssetsTable({ assets, onEdit, onDelete }: Props) {
  if (!assets.length) {
    return <p className="text-center text-muted-foreground py-8">Belum ada aset.</p>;
  }
  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nama Aset</TableHead>
            <TableHead>Jenis</TableHead>
            <TableHead>Kategori</TableHead>
            <TableHead className="text-right">Nilai Perolehan</TableHead>
            <TableHead className="text-right">Akum. Penyusutan</TableHead>
            <TableHead className="text-right">Nilai Buku</TableHead>
            <TableHead className="text-right">Aksi</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {assets.map(a => {
            const dep = calculateDepreciation(a);
            return (
              <TableRow key={a.id}>
                <TableCell className="font-medium">{a.name}</TableCell>
                <TableCell><Badge variant={a.assetType === 'tetap' ? 'default' : 'outline'}>{ASSET_TYPE_LABELS[a.assetType] ?? 'Aset Tetap'}</Badge></TableCell>
                <TableCell><Badge variant="secondary">{ASSET_CATEGORY_LABELS[a.category]}</Badge></TableCell>
                <TableCell className="text-right">{fmt(a.acquisitionCost)}</TableCell>
                <TableCell className="text-right">{fmt(dep.accumulatedDepreciation)}</TableCell>
                <TableCell className="text-right font-semibold">{fmt(dep.bookValue)}</TableCell>
                <TableCell className="text-right space-x-1">
                  <Button variant="ghost" size="icon" onClick={() => onEdit(a)}><Pencil className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon" onClick={() => onDelete(a.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
