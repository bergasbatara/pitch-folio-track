import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Plus, Users } from 'lucide-react';
import { useCustomers } from '../hooks/useCustomers';
import { Customer, CustomerFormData } from '../types';
import { AddCustomerModal } from '../components/AddCustomerModal';
import { CustomersTable } from '../components/CustomersTable';

export default function Customers() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState<Customer | null>(null);
  const { customers, addCustomer, updateCustomer, deleteCustomer } = useCustomers();

  const handleSubmit = (data: CustomerFormData) => {
    if (editing) {
      updateCustomer(editing.id, data);
    } else {
      addCustomer(data);
    }
    setEditing(null);
  };

  const handleEdit = (c: Customer) => { setEditing(c); setIsModalOpen(true); };
  const handleClose = () => { setIsModalOpen(false); setEditing(null); };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Pelanggan</h1>
            <p className="text-muted-foreground">Kelola data pelanggan Anda</p>
          </div>
          <Button onClick={() => setIsModalOpen(true)} className="gap-2"><Plus className="h-4 w-4" />Tambah Pelanggan</Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-card border border-border">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-muted text-primary"><Users className="h-5 w-5" /></div>
              <div>
                <p className="text-sm text-muted-foreground">Total Pelanggan</p>
                <p className="text-xl font-bold text-foreground">{customers.length}</p>
              </div>
            </div>
          </div>
        </div>
        <div className="bg-card rounded-xl border border-border p-6">
          <h2 className="text-lg font-semibold mb-4">Semua Pelanggan</h2>
          <CustomersTable customers={customers} onEdit={handleEdit} onDelete={deleteCustomer} />
        </div>
      </div>
      <AddCustomerModal isOpen={isModalOpen} onClose={handleClose} onSubmit={handleSubmit} editingCustomer={editing} />
    </MainLayout>
  );
}
