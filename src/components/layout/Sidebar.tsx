import { LayoutDashboard, TrendingUp, TrendingDown, Package, ShoppingCart, ShoppingBag, FileText, Settings, Plus, LogOut, User, Scale, ArrowRight, Calculator, CreditCard, BookOpen, Crown, Users, Truck, Building2, Receipt, ListTree, BookMarked, Lock, FileCheck, PieChart, LineChart, Sparkles, Brain, Headphones } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/features/auth';
import { usePlanAccess, PLAN_LABEL } from '@/features/subscription';

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface NavSection {
  label: string;
  items: NavItem[];
}

const sections: NavSection[] = [
  {
    label: 'Utama',
    items: [{ name: 'Dasbor', href: '/', icon: LayoutDashboard }],
  },
  {
    label: 'Transaksi',
    items: [
      { name: 'Penjualan', href: '/sales', icon: ShoppingCart },
      { name: 'Pembelian', href: '/purchases', icon: ShoppingBag },
    ],
  },
  {
    label: 'Data Master',
    items: [
      { name: 'Produk', href: '/products', icon: Package },
      { name: 'Pelanggan', href: '/pelanggan', icon: Users },
      { name: 'Supplier', href: '/supplier', icon: Truck },
    ],
  },
  {
    label: 'Keuangan',
    items: [
      { name: 'Piutang', href: '/piutang', icon: TrendingUp },
      { name: 'Hutang', href: '/hutang', icon: TrendingDown },
      { name: 'Aset', href: '/aset-tetap', icon: Building2 },
      { name: 'Pajak', href: '/pajak', icon: Receipt },
      { name: 'Daftar Akun', href: '/akun', icon: ListTree },
      { name: 'Jurnal Umum', href: '/jurnal', icon: BookMarked },
      { name: 'Liabilitas & Ekuitas', href: '/liabilitas-ekuitas', icon: Scale },
    ],
  },
  {
    label: 'Laporan',
    items: [
      { name: 'Laba Rugi', href: '/laba-rugi', icon: FileText },
      { name: 'Neraca', href: '/neraca', icon: Scale },
      { name: 'Arus Kas', href: '/arus-kas', icon: ArrowRight },
      { name: 'Ekuitas', href: '/ekuitas', icon: CreditCard },
      { name: 'HPP', href: '/hpp', icon: Calculator },
      { name: 'Catatan Keuangan', href: '/catatan-keuangan', icon: BookOpen },
    ],
  },
  {
    label: 'Profesional',
    items: [
      { name: 'Draft Audit', href: '/audit-draft', icon: FileCheck },
      { name: 'Rasio Keuangan', href: '/rasio-keuangan', icon: PieChart },
      { name: 'Analisis Tren', href: '/analisis-tren', icon: LineChart },
    ],
  },
  {
    label: 'Premium',
    items: [
      { name: 'Analisis Lanjutan', href: '/analisis-lanjutan', icon: Sparkles },
      { name: 'Modeling Keuangan', href: '/modeling-proyeksi', icon: Brain },
      { name: 'Konsultasi', href: '/konsultasi', icon: Headphones },
    ],
  },
  {
    label: 'Akun',
    items: [{ name: 'Langganan', href: '/langganan', icon: Crown }],
  },
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
        <Link to="/" className="flex h-20 items-center gap-3 border-b border-sidebar-border px-6 transition-colors hover:bg-sidebar-accent/50">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
            <TrendingUp className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="text-lg font-semibold text-sidebar-foreground whitespace-nowrap">Asia Global Finansial</span>
        </Link>

        <nav className="flex-1 space-y-5 px-3 py-4 overflow-y-auto">
          {sections.map((section) => (
            <div key={section.label} className="space-y-1">
              <p className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-wider text-sidebar-foreground/40">
                {section.label}
              </p>
              {section.items.map((item) => {
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
            </div>
          ))}
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
