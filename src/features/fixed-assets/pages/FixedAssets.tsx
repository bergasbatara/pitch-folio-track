import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Plus, Building2 } from 'lucide-react';
import { useFixedAssets } from '../hooks/useFixedAssets';
import { FixedAsset, FixedAssetFormData, calculateDepreciation } from '../types';
import { AddAssetModal } from '../components/AddAssetModal';
import { AssetsTable } from '../components/AssetsTable';
import { useCompanyProfile } from '@/features/onboarding';
import { useErrorToast } from '@/shared/hooks/useErrorToast';

const fmt = (v: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(v);

export default function FixedAssets() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState<FixedAsset | null>(null);
  const { company, error: companyError } = useCompanyProfile();
  const { assets, addAsset, updateAsset, deleteAsset, error: assetsError } = useFixedAssets(company?.id);
  useErrorToast(companyError, 'Gagal memuat perusahaan');
  useErrorToast(assetsError, 'Gagal memuat aset');

  const handleSubmit = async (data: FixedAssetFormData) => {
    if (!company?.id) return;
    if (editing) { await updateAsset(editing.id, data); } else { await addAsset(data); }
    setEditing(null);
  };

  const handleEdit = (a: FixedAsset) => { setEditing(a); setIsModalOpen(true); };
  const handleClose = () => { setIsModalOpen(false); setEditing(null); };

  const totalCost = assets.reduce((s, a) => s + a.acquisitionCost, 0);
  const totalBookValue = assets.reduce((s, a) => s + calculateDepreciation(a).bookValue, 0);
  const totalDepreciation = assets.reduce((s, a) => s + calculateDepreciation(a).accumulatedDepreciation, 0);

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
          <h1 className="text-2xl font-bold text-foreground">Aset</h1>
            <p className="text-muted-foreground">Kelola aset tetap, aset lancar, dan penyusutan</p>
          </div>
          <Button onClick={() => setIsModalOpen(true)} className="gap-2"><Plus className="h-4 w-4" />Tambah Aset</Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { label: 'Total Nilai Perolehan', value: fmt(totalCost) },
            { label: 'Total Akum. Penyusutan', value: fmt(totalDepreciation) },
            { label: 'Total Nilai Buku', value: fmt(totalBookValue) },
          ].map(s => (
            <div key={s.label} className="p-4 rounded-xl bg-card border border-border">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-muted text-primary"><Building2 className="h-5 w-5" /></div>
                <div>
                  <p className="text-sm text-muted-foreground">{s.label}</p>
                  <p className="text-xl font-bold text-foreground">{s.value}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="bg-card rounded-xl border border-border p-6">
          <h2 className="text-lg font-semibold mb-4">Daftar Aset</h2>
          <AssetsTable assets={assets} onEdit={handleEdit} onDelete={deleteAsset} />
        </div>
      </div>
      <AddAssetModal isOpen={isModalOpen} onClose={handleClose} onSubmit={handleSubmit} editingAsset={editing} />
    </MainLayout>
  );
}
