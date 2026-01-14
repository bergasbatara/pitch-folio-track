import { useState } from 'react';
import { TrendingUp, DollarSign, Users, Clock, Target } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { MetricCard } from '@/components/metrics/MetricCard';
import { AddMetricModal } from '@/components/metrics/AddMetricModal';
import { useMetrics } from '@/hooks/useMetrics';
import { Metric, MetricFormData, categoryColors } from '@/types/metrics';

function QuickStat({ icon: Icon, label, value, color }: { icon: any; label: string; value: string; color: string }) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-border bg-card/50 px-4 py-3">
      <div
        className="flex h-10 w-10 items-center justify-center rounded-lg"
        style={{ backgroundColor: `${color}20` }}
      >
        <Icon className="h-5 w-5" style={{ color }} />
      </div>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-lg font-semibold text-foreground">{value}</p>
      </div>
    </div>
  );
}

export default function Index() {
  const { metrics, addMetric, updateMetric, deleteMetric } = useMetrics();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMetric, setEditingMetric] = useState<Metric | null>(null);

  const handleAddMetric = () => {
    setEditingMetric(null);
    setIsModalOpen(true);
  };

  const handleEdit = (metric: Metric) => {
    setEditingMetric(metric);
    setIsModalOpen(true);
  };

  const handleSubmit = (data: MetricFormData) => {
    if (editingMetric) {
      updateMetric(editingMetric.id, data);
    } else {
      addMetric(data);
    }
  };

  // Calculate summary stats
  const totalRevenue = metrics
    .filter((m) => m.category === 'revenue')
    .reduce((sum, m) => sum + m.value, 0);

  const totalCustomers = metrics.find((m) => m.name.toLowerCase().includes('total customers'))?.value || 0;
  const runway = metrics.find((m) => m.category === 'runway')?.value || 0;
  const growthRate = metrics.find((m) => m.name.toLowerCase().includes('growth rate'))?.value || 0;

  return (
    <MainLayout onAddMetric={handleAddMetric}>
      {/* Header */}
      <div className="page-header">
        <h1 className="page-title">Dashboard</h1>
        <p className="page-description">Track your pitch deck metrics at a glance</p>
      </div>

      {/* Quick Stats */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <QuickStat
          icon={DollarSign}
          label="Total Revenue"
          value={`$${(totalRevenue / 1000000).toFixed(1)}M`}
          color={categoryColors.revenue}
        />
        <QuickStat
          icon={Users}
          label="Total Customers"
          value={totalCustomers.toLocaleString()}
          color={categoryColors.customers}
        />
        <QuickStat
          icon={Clock}
          label="Runway"
          value={`${runway} months`}
          color={categoryColors.runway}
        />
        <QuickStat
          icon={Target}
          label="Growth Rate"
          value={`${growthRate}%`}
          color={categoryColors.growth}
        />
      </div>

      {/* Metrics Grid */}
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-lg font-medium text-foreground">All Metrics</h2>
        <span className="text-sm text-muted-foreground">{metrics.length} metrics</span>
      </div>

      <div className="grid-metrics">
        {metrics.map((metric, index) => (
          <MetricCard
            key={metric.id}
            metric={metric}
            onEdit={handleEdit}
            onDelete={deleteMetric}
            index={index}
          />
        ))}
      </div>

      {/* Empty State */}
      {metrics.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card/30 py-16">
          <TrendingUp className="mb-4 h-12 w-12 text-muted-foreground" />
          <h3 className="mb-2 text-lg font-medium text-foreground">No metrics yet</h3>
          <p className="mb-4 text-sm text-muted-foreground">
            Start tracking your pitch deck numbers
          </p>
          <button onClick={handleAddMetric} className="btn-primary">
            Add Your First Metric
          </button>
        </div>
      )}

      {/* Modal */}
      <AddMetricModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSubmit}
        editingMetric={editingMetric}
      />
    </MainLayout>
  );
}
