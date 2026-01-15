import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Metric, MetricFormData, MetricCategory, categoryLabels } from '@/data';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface AddMetricModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: MetricFormData) => void;
  editingMetric?: Metric | null;
}

const initialFormData: MetricFormData = {
  name: '',
  value: 0,
  previousValue: undefined,
  unit: 'currency',
  category: 'revenue',
  description: '',
};

export function AddMetricModal({ isOpen, onClose, onSubmit, editingMetric }: AddMetricModalProps) {
  const [formData, setFormData] = useState<MetricFormData>(initialFormData);

  useEffect(() => {
    if (editingMetric) {
      setFormData({
        name: editingMetric.name,
        value: editingMetric.value,
        previousValue: editingMetric.previousValue,
        unit: editingMetric.unit,
        category: editingMetric.category,
        description: editingMetric.description || '',
      });
    } else {
      setFormData(initialFormData);
    }
  }, [editingMetric, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
    onClose();
    setFormData(initialFormData);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="border-border bg-card sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-foreground">
            {editingMetric ? 'Edit Metrik' : 'Tambah Metrik Baru'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">
              Nama Metrik
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="cth., Pendapatan Bulanan"
              className="input-field"
              required
            />
          </div>

          {/* Category & Unit */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">
                Kategori
              </label>
              <Select
                value={formData.category}
                onValueChange={(value: MetricCategory) =>
                  setFormData({ ...formData, category: value })
                }
              >
                <SelectTrigger className="border-border bg-input text-foreground">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="border-border bg-card">
                  {Object.entries(categoryLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">
                Satuan
              </label>
              <Select
                value={formData.unit}
                onValueChange={(value: Metric['unit']) =>
                  setFormData({ ...formData, unit: value })
                }
              >
                <SelectTrigger className="border-border bg-input text-foreground">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="border-border bg-card">
                  <SelectItem value="currency">Mata Uang (Rp)</SelectItem>
                  <SelectItem value="percentage">Persentase (%)</SelectItem>
                  <SelectItem value="number">Angka</SelectItem>
                  <SelectItem value="months">Bulan</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Values */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">
                Nilai Saat Ini
              </label>
              <input
                type="number"
                value={formData.value}
                onChange={(e) =>
                  setFormData({ ...formData, value: parseFloat(e.target.value) || 0 })
                }
                className="input-field"
                required
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">
                Nilai Sebelumnya
              </label>
              <input
                type="number"
                value={formData.previousValue || ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    previousValue: e.target.value ? parseFloat(e.target.value) : undefined,
                  })
                }
                placeholder="Opsional"
                className="input-field"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">
              Deskripsi
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Catatan opsional tentang metrik ini"
              className="input-field min-h-[80px] resize-none"
              rows={3}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">
              Batal
            </button>
            <button type="submit" className="btn-primary flex-1">
              {editingMetric ? 'Simpan Perubahan' : 'Tambah Metrik'}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
