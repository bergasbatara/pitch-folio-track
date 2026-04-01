import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Search } from 'lucide-react';
import { useAccounts } from '../hooks/useAccounts';
import { useCompanyProfile } from '@/features/onboarding';
import { AccountsTable } from '../components/AccountsTable';
import { AccountModal } from '../components/AccountModal';
import { Account, AccountFormData } from '../types';
import { useToast } from '@/components/ui/use-toast';
import { useErrorToast } from '@/shared/hooks/useErrorToast';

export default function Accounts() {
  const { company, error: companyError } = useCompanyProfile();
  const { accounts, isLoading, addAccount, updateAccount, deleteAccount, error: accountsError } = useAccounts(company?.id);
  const { toast } = useToast();
  useErrorToast(companyError, 'Gagal memuat perusahaan');
  useErrorToast(accountsError, 'Gagal memuat akun');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');

  const filtered = accounts.filter((a) => {
    const matchesSearch = !search || a.code.toLowerCase().includes(search.toLowerCase()) || a.name.toLowerCase().includes(search.toLowerCase());
    const matchesType = typeFilter === 'all' || a.type === typeFilter;
    return matchesSearch && matchesType;
  });

  const handleSubmit = async (data: AccountFormData) => {
    try {
      if (editingAccount) {
        await updateAccount(editingAccount.id, data);
        toast({ title: 'Akun Diperbarui' });
      } else {
        await addAccount(data);
        toast({ title: 'Akun Ditambahkan' });
      }
    } catch (err: any) {
      toast({ title: 'Gagal', description: err.message, variant: 'destructive' });
    }
    setEditingAccount(null);
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteAccount(id);
      toast({ title: 'Akun Dihapus' });
    } catch (err: any) {
      toast({ title: 'Gagal', description: err.message, variant: 'destructive' });
    }
  };

  const handleEdit = (account: Account) => {
    setEditingAccount(account);
    setIsModalOpen(true);
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Daftar Akun (COA)</h1>
            <p className="text-muted-foreground">Kelola akun-akun yang digunakan dalam pembukuan</p>
          </div>
          <Button onClick={() => { setEditingAccount(null); setIsModalOpen(true); }} className="gap-2">
            <Plus className="h-4 w-4" />
            Tambah Akun
          </Button>
        </div>

        <div className="flex gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Cari kode atau nama..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 bg-background border-border" />
          </div>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[160px] bg-background border-border"><SelectValue placeholder="Semua Tipe" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Tipe</SelectItem>
              <SelectItem value="asset">Aset</SelectItem>
              <SelectItem value="liability">Kewajiban</SelectItem>
              <SelectItem value="equity">Ekuitas</SelectItem>
              <SelectItem value="revenue">Pendapatan</SelectItem>
              <SelectItem value="expense">Beban</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="bg-card rounded-xl border border-border p-6">
          {isLoading ? <p className="text-center text-muted-foreground py-8">Memuat...</p> : (
            <AccountsTable accounts={filtered} onEdit={handleEdit} onDelete={handleDelete} />
          )}
        </div>
      </div>

      <AccountModal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); setEditingAccount(null); }} onSubmit={handleSubmit} account={editingAccount} />
    </MainLayout>
  );
}
