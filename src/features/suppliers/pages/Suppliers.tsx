import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Plus, Truck } from 'lucide-react';
import { useSuppliers } from '../hooks/useSuppliers';
import { Supplier, SupplierFormData } from '../types';
import { AddSupplierModal } from '../components/AddSupplierModal';
import { SuppliersTable } from '../components/SuppliersTable';

export default function Suppliers() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState<Supplier | null>(null);
  const { suppliers, addSupplier, updateSupplier, deleteSupplier } = useSuppliers();

  const handleSubmit = (data: SupplierFormData) => {
    if (editing) { updateSupplier(editing.id, data); } else { addSupplier(data); }
    setEditing(null);
  };

  const handleEdit = (s: Supplier) => { setEditing(s); setIsModalOpen(true); };
  const handleClose = () => { setIsModalOpen(false); setEditing(null); };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Supplier</h1>
            <p className="text-muted-foreground">Kelola data vendor dan supplier</p>
          </div>
          <Button onClick={() => setIsModalOpen(true)} className="gap-2"><Plus className="h-4 w-4" />Tambah Supplier</Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-card border border-border">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-muted text-primary"><Truck className="h-5 w-5" /></div>
              <div>
                <p className="text-sm text-muted-foreground">Total Supplier</p>
                <p className="text-xl font-bold text-foreground">{suppliers.length}</p>
              </div>
            </div>
          </div>
        </div>
        <div className="bg-card rounded-xl border border-border p-6">
          <h2 className="text-lg font-semibold mb-4">Semua Supplier</h2>
          <SuppliersTable suppliers={suppliers} onEdit={handleEdit} onDelete={deleteSupplier} />
        </div>
      </div>
      <AddSupplierModal isOpen={isModalOpen} onClose={handleClose} onSubmit={handleSubmit} editingSupplier={editing} />
    </MainLayout>
  );
}
