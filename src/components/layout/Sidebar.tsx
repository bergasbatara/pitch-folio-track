import { LayoutDashboard, TrendingUp, TrendingDown, Package, ShoppingCart, ShoppingBag, FileText, Settings, Plus, LogOut, User, Scale, ArrowRight, Calculator, CreditCard, BookOpen, Crown, Users, Truck, Building2, Receipt, ListTree, BookMarked, Lock, FileCheck, PieChart, LineChart, Sparkles, Brain, Headphones } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/features/auth';
import { usePlanAccess, PLAN_LABEL } from '@/features/subscription';

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  section?: 'business' | 'professional' | 'premium';
}

const navigation: NavItem[] = [
  { name: 'Dasbor', href: '/', icon: LayoutDashboard },
  // Business
  { name: 'Penjualan', href: '/sales', icon: ShoppingCart, section: 'business' },
  { name: 'Pembelian', href: '/purchases', icon: ShoppingBag, section: 'business' },
  { name: 'Produk', href: '/products', icon: Package, section: 'business' },
  { name: 'Pelanggan', href: '/pelanggan', icon: Users, section: 'business' },
  { name: 'Supplier', href: '/supplier', icon: Truck, section: 'business' },
  { name: 'Piutang', href: '/piutang', icon: TrendingUp, section: 'business' },
  { name: 'Hutang', href: '/hutang', icon: TrendingDown, section: 'business' },
  { name: 'Aset', href: '/aset-tetap', icon: Building2, section: 'business' },
  { name: 'Pajak', href: '/pajak', icon: Receipt, section: 'business' },
  { name: 'Daftar Akun', href: '/akun', icon: ListTree, section: 'business' },
  { name: 'Jurnal Umum', href: '/jurnal', icon: BookMarked, section: 'business' },
  { name: 'Liabilitas & Ekuitas', href: '/liabilitas-ekuitas', icon: Scale, section: 'business' },
  { name: 'Laba Rugi', href: '/laba-rugi', icon: FileText, section: 'business' },
  { name: 'Neraca', href: '/neraca', icon: Scale, section: 'business' },
  { name: 'Arus Kas', href: '/arus-kas', icon: ArrowRight, section: 'business' },
  { name: 'Ekuitas', href: '/ekuitas', icon: CreditCard, section: 'business' },
  { name: 'HPP', href: '/hpp', icon: Calculator, section: 'business' },
  { name: 'Catatan Keuangan', href: '/catatan-keuangan', icon: BookOpen, section: 'business' },
  // Professional
  { name: 'Draft Audit', href: '/audit-draft', icon: FileCheck, section: 'professional' },
  { name: 'Rasio Keuangan', href: '/rasio-keuangan', icon: PieChart, section: 'professional' },
  { name: 'Analisis Tren', href: '/analisis-tren', icon: LineChart, section: 'professional' },
  // Premium
  { name: 'Analisis Lanjutan', href: '/analisis-lanjutan', icon: Sparkles, section: 'premium' },
  { name: 'Modeling Keuangan', href: '/modeling-proyeksi', icon: Brain, section: 'premium' },
  { name: 'Konsultasi', href: '/konsultasi', icon: Headphones, section: 'premium' },
  // Always available
  { name: 'Langganan', href: '/langganan', icon: Crown },
];

interface SidebarProps {
  onAddMetric?: () => void;
}

export function Sidebar({ onAddMetric }: SidebarProps) {
  const location = useLocation();
  const { user, logout } = useAuth();
  const { hasAccess, requiredTierFor } = usePlanAccess();

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r border-sidebar-border bg-sidebar">
      <div className="flex h-full flex-col">
        <div className="flex h-20 items-center gap-3 border-b border-sidebar-border px-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
            <TrendingUp className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="text-lg font-semibold text-sidebar-foreground whitespace-nowrap">Asia Global Finansial</span>
        </div>

        <nav className="flex-1 space-y-1 px-3 py-4 overflow-y-auto">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href;
            const locked = !hasAccess(item.href);
            const tier = requiredTierFor(item.href);
            return (
              <Link
                key={item.name}
                to={item.href}
                className={`sidebar-link group ${isActive ? 'sidebar-link-active' : ''} ${locked ? 'opacity-60' : ''}`}
                title={locked && tier ? `Memerlukan paket ${PLAN_LABEL[tier]}` : undefined}
              >
                <item.icon className="h-5 w-5" />
                <span className="flex-1 truncate">{item.name}</span>
                {locked && <Lock className="h-3.5 w-3.5 text-muted-foreground" />}
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
