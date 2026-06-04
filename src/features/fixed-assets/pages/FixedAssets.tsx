import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Plus, Building2, Wallet, TrendingDown, Landmark } from 'lucide-react';
import { useFixedAssets } from '../hooks/useFixedAssets';
import { FixedAsset, FixedAssetFormData, calculateDepreciation } from '../types';
import { AddAssetModal } from '../components/AddAssetModal';
import { AssetsTable } from '../components/AssetsTable';
import { useCompanyProfile } from '@/features/onboarding';
import { useErrorToast } from '@/shared/hooks/useErrorToast';
import { PageHeader, StatCard, EmptyState } from '@/shared';

const fmt = (v: number) => {
  const abs = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(Math.abs(v));
  return v < 0 ? `(${abs})` : abs;
};

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
        <PageHeader
          icon={Building2}
          title="Aset"
          description="Kelola aset tetap, aset lancar, dan penyusutan"
          tip="Catat setiap barang berharga milik usaha Anda seperti kendaraan, peralatan, atau gedung. Sistem akan menghitung penyusutannya secara otomatis."
          action={
            <Button onClick={() => setIsModalOpen(true)} className="gap-2"><Plus className="h-4 w-4" />Tambah Aset</Button>
          }
        />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatCard icon={Wallet} tone="primary" label="Total Nilai Perolehan" value={fmt(totalCost)} hint="Harga beli semua aset" />
          <StatCard icon={TrendingDown} tone="warning" label="Total Akum. Penyusutan" value={fmt(totalDepreciation)} hint="Nilai yang sudah disusutkan" />
          <StatCard icon={Landmark} tone="success" label="Total Nilai Buku" value={fmt(totalBookValue)} hint="Nilai aset saat ini" />
        </div>
        <div className="bg-card rounded-xl border border-border p-6 shadow-[var(--shadow-card)]">
          <h2 className="text-lg font-semibold mb-4">Daftar Aset</h2>
          {assets.length === 0 ? (
            <EmptyState
              icon={Building2}
              title="Belum ada aset"
              description="Mulai dengan menambahkan aset pertama Anda agar penyusutan dan nilai buku terhitung otomatis."
              action={<Button onClick={() => setIsModalOpen(true)} className="gap-2"><Plus className="h-4 w-4" />Tambah Aset</Button>}
            />
          ) : (
            <AssetsTable assets={assets} onEdit={handleEdit} onDelete={deleteAsset} />
          )}
        </div>
      </div>
      <AddAssetModal isOpen={isModalOpen} onClose={handleClose} onSubmit={handleSubmit} editingAsset={editing} />
    </MainLayout>
  );
}
