import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Plus, Truck } from 'lucide-react';
import { useSuppliers } from '../hooks/useSuppliers';
import { Supplier, SupplierFormData } from '../types';
import { AddSupplierModal } from '../components/AddSupplierModal';
import { SuppliersTable } from '../components/SuppliersTable';
import { useCompanyProfile } from '@/features/onboarding';
import { useErrorToast } from '@/shared/hooks/useErrorToast';
import { PageHeader, StatCard, EmptyState } from '@/shared';

export default function Suppliers() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState<Supplier | null>(null);
  const { company, error: companyError } = useCompanyProfile();
  const { suppliers, addSupplier, updateSupplier, deleteSupplier, error: suppliersError } = useSuppliers(company?.id);
  useErrorToast(companyError, 'Gagal memuat perusahaan');
  useErrorToast(suppliersError, 'Gagal memuat supplier');

  const handleSubmit = async (data: SupplierFormData) => {
    if (!company?.id) return;
    if (editing) { await updateSupplier(editing.id, data); } else { await addSupplier(data); }
    setEditing(null);
  };

  const handleEdit = (s: Supplier) => { setEditing(s); setIsModalOpen(true); };
  const handleClose = () => { setIsModalOpen(false); setEditing(null); };

  return (
    <MainLayout>
      <div className="space-y-6">
        <PageHeader
          icon={Truck}
          title="Supplier"
          description="Kelola data vendor dan supplier"
          tip="Daftarkan supplier Anda agar bisa langsung dipilih saat mencatat pembelian dan hutang usaha."
          action={<Button onClick={() => setIsModalOpen(true)} className="gap-2"><Plus className="h-4 w-4" />Tambah Supplier</Button>}
        />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatCard icon={Truck} label="Total Supplier" value={suppliers.length} hint="Jumlah supplier terdaftar" />
        </div>
        <div className="bg-card rounded-xl border border-border p-6 shadow-[var(--shadow-card)]">
          <h2 className="text-lg font-semibold mb-4">Semua Supplier</h2>
          {suppliers.length === 0 ? (
            <EmptyState
              icon={Truck}
              title="Belum ada supplier"
              description="Tambahkan supplier pertama Anda untuk mempermudah pencatatan pembelian."
              action={<Button onClick={() => setIsModalOpen(true)} className="gap-2"><Plus className="h-4 w-4" />Tambah Supplier</Button>}
            />
          ) : (
            <SuppliersTable suppliers={suppliers} onEdit={handleEdit} onDelete={deleteSupplier} />
          )}
        </div>
      </div>
      <AddSupplierModal isOpen={isModalOpen} onClose={handleClose} onSubmit={handleSubmit} editingSupplier={editing} />
    </MainLayout>
  );
}
