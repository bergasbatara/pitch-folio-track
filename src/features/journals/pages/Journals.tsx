import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Search, ArrowDownCircle, ArrowUpCircle } from 'lucide-react';
import { useJournals } from '../hooks/useJournals';
import { useAccounts } from '@/features/accounts/hooks/useAccounts';
import { useCompanyProfile } from '@/features/onboarding';
import { JournalsTable } from '../components/JournalsTable';
import { JournalModal } from '../components/JournalModal';
import { JournalDetailModal } from '../components/JournalDetailModal';
import { JournalEntry, JournalFormData } from '../types';
import { useToast } from '@/components/ui/use-toast';
import { useErrorToast } from '@/shared/hooks/useErrorToast';
import { getDisplayTotalsForEntries } from '../lib/journalDisplayTotals';
import { TransactionReversalDialog } from '@/shared';
import { formatDateId } from '@/shared/lib/date';

type JournalView = 'all' | 'operational' | 'adjustment' | 'reversal';

export default function Journals() {
  const { company, error: companyError } = useCompanyProfile();
  const { entries, isLoading, isMutating, addEntry, updateEntry, deleteEntry, reverseEntry, error: journalsError } = useJournals(company?.id);
  const { accounts, error: accountsError } = useAccounts(company?.id);
  const { toast } = useToast();
  useErrorToast(companyError, 'Gagal memuat perusahaan');
  useErrorToast(journalsError, 'Gagal memuat jurnal');
  useErrorToast(accountsError, 'Gagal memuat akun');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<JournalEntry | null>(null);
  const [viewingEntry, setViewingEntry] = useState<JournalEntry | null>(null);
  const [reversingEntry, setReversingEntry] = useState<JournalEntry | null>(null);
  const [search, setSearch] = useState('');
  const [view, setView] = useState<JournalView>('all');

  const filtered = entries.filter((e) => {
    const matchesView =
      view === 'all'
        ? true
        : view === 'operational'
          ? !!e.source && e.source !== 'journal_reversal'
          : view === 'reversal'
            ? e.source === 'journal_reversal'
            : !e.source;
    if (!matchesView) return false;
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      (e.memo ?? '').toLowerCase().includes(q) ||
      (e.source ?? '').toLowerCase().includes(q) ||
      e.lines.some((line) => `${line.account.code} ${line.account.name}`.toLowerCase().includes(q))
    );
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

  const handleReverse = async () => {
    if (!reversingEntry) return;
    try {
      await reverseEntry(reversingEntry.id);
      toast({ title: 'Jurnal Dibalik', description: 'Entry reversal berhasil dibuat dan diposting.' });
      setReversingEntry(null);
    } catch (err: any) {
      toast({ title: 'Gagal', description: err.message, variant: 'destructive' });
    }
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Jurnal Umum</h1>
            <p className="text-muted-foreground">Jurnal operasional dibuat otomatis. Koreksi manual dicatat sebagai jurnal penyesuaian.</p>
          </div>
          <Button onClick={() => { setEditingEntry(null); setIsModalOpen(true); }} className="gap-2">
            <Plus className="h-4 w-4" />
            Tambah Jurnal Penyesuaian
          </Button>
        </div>

        <Tabs value={view} onValueChange={(value) => setView(value as JournalView)}>
          <TabsList className="grid w-full max-w-2xl grid-cols-4">
            <TabsTrigger value="all">Semua</TabsTrigger>
            <TabsTrigger value="operational">Operasional</TabsTrigger>
            <TabsTrigger value="adjustment">Penyesuaian</TabsTrigger>
            <TabsTrigger value="reversal">Reversal</TabsTrigger>
          </TabsList>
        </Tabs>

        {(() => {
          // Keep summary in sync with what the table is currently showing (search-filtered).
          const { totalDebit, totalCredit: totalKredit } = getDisplayTotalsForEntries(filtered);
          const fmt = (v: number) => `Rp${v.toLocaleString('id-ID')}`;
          return (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-card rounded-xl border border-border p-5 flex items-center gap-4">
                <div className="h-12 w-12 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                  <ArrowDownCircle className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Debit</p>
                  <p className="text-2xl font-bold text-foreground">{fmt(totalDebit)}</p>
                </div>
              </div>
              <div className="bg-card rounded-xl border border-border p-5 flex items-center gap-4">
                <div className="h-12 w-12 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                  <ArrowUpCircle className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Kredit</p>
                  <p className="text-2xl font-bold text-foreground">{fmt(totalKredit)}</p>
                </div>
              </div>
            </div>
          );
        })()}

        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Cari memo atau sumber..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 bg-background border-border" />
        </div>

        <div className="bg-card rounded-xl border border-border p-6">
          {isLoading ? <p className="text-center text-muted-foreground py-8">Memuat...</p> : (
            <JournalsTable
              entries={filtered}
              onView={setViewingEntry}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onReverse={setReversingEntry}
            />
          )}
        </div>
      </div>

      <JournalModal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); setEditingEntry(null); }} onSubmit={handleSubmit} accounts={accounts} entry={editingEntry} />
      <JournalDetailModal isOpen={!!viewingEntry} onClose={() => setViewingEntry(null)} entry={viewingEntry} />
      <TransactionReversalDialog
        open={!!reversingEntry}
        onOpenChange={(open) => { if (!open) setReversingEntry(null); }}
        title="Reverse Jurnal Penyesuaian"
        description="Jurnal penyesuaian yang sudah diposting tidak diedit atau dihapus langsung. Sistem akan membuat entry reversal agar audit trail tetap lengkap."
        transactionLabel={reversingEntry?.memo ?? reversingEntry?.id ?? '-'}
        transactionDate={reversingEntry ? formatDateId(reversingEntry.date) : undefined}
        impactLines={[
          'Entry asli tetap tersimpan sebagai posted untuk kebutuhan audit.',
          'Sistem membuat jurnal reversal baru dengan debit dan kredit dibalik per baris.',
          'Koreksi lanjutan dicatat sebagai jurnal penyesuaian baru di periode yang masih terbuka.',
        ]}
        onConfirm={handleReverse}
        isSubmitting={isMutating}
      />
    </MainLayout>
  );
}
