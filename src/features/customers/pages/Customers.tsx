import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Plus, Users } from 'lucide-react';
import { useCustomers } from '../hooks/useCustomers';
import { Customer, CustomerFormData } from '../types';
import { AddCustomerModal } from '../components/AddCustomerModal';
import { CustomersTable } from '../components/CustomersTable';
import { useCompanyProfile } from '@/features/onboarding';
import { useErrorToast } from '@/shared/hooks/useErrorToast';
import { PageHeader, StatCard, EmptyState } from '@/shared';

export default function Customers() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState<Customer | null>(null);
  const { company, error: companyError } = useCompanyProfile();
  const { customers, addCustomer, updateCustomer, deleteCustomer, error: customersError } = useCustomers(company?.id);
  useErrorToast(companyError, 'Gagal memuat perusahaan');
  useErrorToast(customersError, 'Gagal memuat pelanggan');

  const handleSubmit = async (data: CustomerFormData) => {
    if (!company?.id) return;
    if (editing) {
      await updateCustomer(editing.id, data);
    } else {
      await addCustomer(data);
    }
    setEditing(null);
  };

  const handleEdit = (c: Customer) => { setEditing(c); setIsModalOpen(true); };
  const handleClose = () => { setIsModalOpen(false); setEditing(null); };

  return (
    <MainLayout>
      <div className="space-y-6">
        <PageHeader
          icon={Users}
          title="Pelanggan"
          description="Kelola data pelanggan Anda"
          tip="Simpan data pelanggan beserta NPWP-nya agar mudah dipilih saat mencatat penjualan dan piutang."
          action={<Button onClick={() => setIsModalOpen(true)} className="gap-2"><Plus className="h-4 w-4" />Tambah Pelanggan</Button>}
        />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatCard icon={Users} label="Total Pelanggan" value={customers.length} hint="Jumlah pelanggan terdaftar" />
        </div>
        <div className="bg-card rounded-xl border border-border p-6 shadow-[var(--shadow-card)]">
          <h2 className="text-lg font-semibold mb-4">Semua Pelanggan</h2>
          {customers.length === 0 ? (
            <EmptyState
              icon={Users}
              title="Belum ada pelanggan"
              description="Tambahkan pelanggan pertama Anda untuk mempercepat pencatatan transaksi penjualan."
              action={<Button onClick={() => setIsModalOpen(true)} className="gap-2"><Plus className="h-4 w-4" />Tambah Pelanggan</Button>}
            />
          ) : (
            <CustomersTable customers={customers} onEdit={handleEdit} onDelete={deleteCustomer} />
          )}
        </div>
      </div>
      <AddCustomerModal isOpen={isModalOpen} onClose={handleClose} onSubmit={handleSubmit} editingCustomer={editing} />
    </MainLayout>
  );
}
