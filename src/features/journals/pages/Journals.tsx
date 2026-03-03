import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search } from 'lucide-react';
import { useJournals } from '../hooks/useJournals';
import { useAccounts } from '@/features/accounts/hooks/useAccounts';
import { useCompanyProfile } from '@/features/onboarding';
import { JournalsTable } from '../components/JournalsTable';
import { JournalModal } from '../components/JournalModal';
import { JournalDetailModal } from '../components/JournalDetailModal';
import { JournalEntry, JournalFormData } from '../types';
import { useToast } from '@/components/ui/use-toast';

export default function Journals() {
  const { company } = useCompanyProfile();
  const { entries, isLoading, addEntry, updateEntry, deleteEntry } = useJournals(company?.id);
  const { accounts } = useAccounts(company?.id);
  const { toast } = useToast();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<JournalEntry | null>(null);
  const [viewingEntry, setViewingEntry] = useState<JournalEntry | null>(null);
  const [search, setSearch] = useState('');

  const filtered = entries.filter((e) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (e.memo ?? '').toLowerCase().includes(q) || (e.source ?? '').toLowerCase().includes(q);
  });

  const handleSubmit = async (data: JournalFormData) => {
    try {
      if (editingEntry) {
        await updateEntry(editingEntry.id, data);
        toast({ title: 'Jurnal Diperbarui' });
      } else {
        await addEntry(data);
        toast({ title: 'Jurnal Ditambahkan' });
      }
    } catch (err: any) {
      toast({ title: 'Gagal', description: err.message, variant: 'destructive' });
    }
    setEditingEntry(null);
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteEntry(id);
      toast({ title: 'Jurnal Dihapus' });
    } catch (err: any) {
      toast({ title: 'Gagal', description: err.message, variant: 'destructive' });
    }
  };

  const handleEdit = (entry: JournalEntry) => {
    setEditingEntry(entry);
    setIsModalOpen(true);
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Jurnal Umum</h1>
            <p className="text-muted-foreground">Catatan semua transaksi dalam format double-entry</p>
          </div>
          <Button onClick={() => { setEditingEntry(null); setIsModalOpen(true); }} className="gap-2">
            <Plus className="h-4 w-4" />
            Tambah Jurnal
          </Button>
        </div>

        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Cari memo atau sumber..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 bg-background border-border" />
        </div>

        <div className="bg-card rounded-xl border border-border p-6">
          {isLoading ? <p className="text-center text-muted-foreground py-8">Memuat...</p> : (
            <JournalsTable entries={filtered} onView={setViewingEntry} onEdit={handleEdit} onDelete={handleDelete} />
          )}
        </div>
      </div>

      <JournalModal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); setEditingEntry(null); }} onSubmit={handleSubmit} accounts={accounts} entry={editingEntry} />
      <JournalDetailModal isOpen={!!viewingEntry} onClose={() => setViewingEntry(null)} entry={viewingEntry} />
    </MainLayout>
  );
}
