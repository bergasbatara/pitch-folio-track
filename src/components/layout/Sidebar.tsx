import { LayoutDashboard, TrendingUp, TrendingDown, Package, ShoppingCart, ShoppingBag, FileText, Settings, Plus, LogOut, User, Scale, ArrowRight, Calculator, CreditCard, BookOpen, Crown, Users, Truck, Building2, Receipt, ListTree, BookMarked } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/features/auth';

const navigation = [
  { name: 'Dasbor', href: '/', icon: LayoutDashboard },
  { name: 'Penjualan', href: '/sales', icon: ShoppingCart },
  { name: 'Pembelian', href: '/purchases', icon: ShoppingBag },
  { name: 'Produk', href: '/products', icon: Package },
  { name: 'Pelanggan', href: '/pelanggan', icon: Users },
  { name: 'Supplier', href: '/supplier', icon: Truck },
  { name: 'Piutang', href: '/piutang', icon: TrendingUp },
  { name: 'Hutang', href: '/hutang', icon: TrendingDown },
  { name: 'Aset', href: '/aset-tetap', icon: Building2 },
  { name: 'Pajak', href: '/pajak', icon: Receipt },
  { name: 'Daftar Akun', href: '/akun', icon: ListTree },
  { name: 'Jurnal Umum', href: '/jurnal', icon: BookMarked },
  { name: 'Laba Rugi', href: '/laporan-keuangan', icon: FileText },
  { name: 'Neraca', href: '/neraca', icon: Scale },
  { name: 'Arus Kas', href: '/arus-kas', icon: ArrowRight },
  { name: 'Ekuitas', href: '/ekuitas', icon: CreditCard },
  { name: 'HPP', href: '/hpp', icon: Calculator },
  { name: 'Catatan Keuangan', href: '/catatan-keuangan', icon: BookOpen },
  { name: 'Langganan', href: '/langganan', icon: Crown },
];

interface SidebarProps {
  onAddMetric?: () => void;
}

export function Sidebar({ onAddMetric }: SidebarProps) {
  const location = useLocation();
  const { user, logout } = useAuth();

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r border-sidebar-border bg-sidebar">
      <div className="flex h-full flex-col">
        <div className="flex h-20 items-center gap-3 border-b border-sidebar-border px-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
            <TrendingUp className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="text-lg font-semibold text-sidebar-foreground whitespace-nowrap">Asia Global Financial</span>
        </div>

        <nav className="flex-1 space-y-1 px-3 py-4 overflow-y-auto">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link key={item.name} to={item.href} className={`sidebar-link ${isActive ? 'sidebar-link-active' : ''}`}>
                <item.icon className="h-5 w-5" />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {onAddMetric && (
          <div className="border-t border-sidebar-border p-4">
            <button onClick={onAddMetric} className="btn-primary w-full">
              <Plus className="h-4 w-4" />
              Tambah Metrik
            </button>
          </div>
        )}

        {user && (
          <div className="border-t border-sidebar-border p-3 space-y-2">
            <Link to="/profile" className="sidebar-link w-full">
              <User className="h-4 w-4" />
              <span className="truncate">{user.name}</span>
            </Link>
            <button onClick={logout} className="sidebar-link w-full text-destructive hover:text-destructive hover:bg-destructive/10">
              <LogOut className="h-5 w-5" />
              Keluar
            </button>
          </div>
        )}

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
