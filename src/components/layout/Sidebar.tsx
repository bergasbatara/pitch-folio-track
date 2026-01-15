import { LayoutDashboard, TrendingUp, Package, ShoppingCart, ShoppingBag, FileText, Settings, Plus } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

const navigation = [
  { name: 'Dasbor', href: '/', icon: LayoutDashboard },
  { name: 'Penjualan', href: '/sales', icon: ShoppingCart },
  { name: 'Pembelian', href: '/purchases', icon: ShoppingBag },
  { name: 'Produk', href: '/products', icon: Package },
  { name: 'Laporan Keuangan', href: '/laporan-keuangan', icon: FileText },
];

interface SidebarProps {
  onAddMetric?: () => void;
}

export function Sidebar({ onAddMetric }: SidebarProps) {
  const location = useLocation();

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r border-sidebar-border bg-sidebar">
      <div className="flex h-full flex-col">
        {/* Logo */}
        <div className="flex h-16 items-center gap-3 border-b border-sidebar-border px-6">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <TrendingUp className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="text-base font-semibold text-sidebar-foreground whitespace-nowrap">Asia Global Financial</span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 px-3 py-4">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.name}
                to={item.href}
                className={`sidebar-link ${isActive ? 'sidebar-link-active' : ''}`}
              >
                <item.icon className="h-5 w-5" />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* Add Metric Button - only show if handler provided */}
        {onAddMetric && (
          <div className="border-t border-sidebar-border p-4">
            <button onClick={onAddMetric} className="btn-primary w-full">
              <Plus className="h-4 w-4" />
              Tambah Metrik
            </button>
          </div>
        )}

        {/* Settings */}
        <div className="border-t border-sidebar-border p-3">
          <Link to="/settings" className="sidebar-link">
            <Settings className="h-5 w-5" />
            Pengaturan
          </Link>
        </div>
      </div>
    </aside>
  );
}
