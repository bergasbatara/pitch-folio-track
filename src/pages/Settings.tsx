import { useEffect, useMemo, useRef, useState, type ChangeEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Bell,
  CheckCircle2,
  CreditCard,
  Database,
  Download,
  FileClock,
  History,
  KeyRound,
  Laptop,
  LayoutGrid,
  Palette,
  ReceiptText,
  RefreshCcw,
  Settings2,
  ShieldCheck,
  Sparkles,
  Trash2,
  Upload,
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/features/auth';
import { useCompanyProfile } from '@/features/onboarding';
import { useSubscription } from '@/features/subscription';
import { formatDateId } from '@/shared/lib/date';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';
const PREFERENCES_KEY = 'app_settings_preferences_v1';

type ThemePreference = 'system' | 'light' | 'dark';
type LanguagePreference = 'id' | 'en';
type DateFormatPreference = 'dd/mm/yyyy' | 'mm/dd/yyyy' | 'yyyy-mm-dd';
type CurrencyPreference = 'IDR' | 'USD';

interface SettingsPreferences {
  language: LanguagePreference;
  timezone: string;
  dateFormat: DateFormatPreference;
  numberCurrency: CurrencyPreference;
  theme: ThemePreference;
  notificationsEmail: boolean;
  notificationsBilling: boolean;
  notificationsSecurity: boolean;
}

interface AuditLogItem {
  id: string;
  action: string;
  entityType: string;
  createdAt: string;
}

const DEFAULT_PREFERENCES: SettingsPreferences = {
  language: 'id',
  timezone: 'Asia/Jakarta',
  dateFormat: 'dd/mm/yyyy',
  numberCurrency: 'IDR',
  theme: 'system',
  notificationsEmail: true,
  notificationsBilling: true,
  notificationsSecurity: true,
};

const TIMEZONE_OPTIONS = [
  { value: 'Asia/Jakarta', label: 'WIB (Asia/Jakarta)' },
  { value: 'Asia/Makassar', label: 'WITA (Asia/Makassar)' },
  { value: 'Asia/Jayapura', label: 'WIT (Asia/Jayapura)' },
  { value: 'UTC', label: 'UTC' },
];

const DATE_FORMAT_LABEL: Record<DateFormatPreference, string> = {
  'dd/mm/yyyy': 'DD/MM/YYYY',
  'mm/dd/yyyy': 'MM/DD/YYYY',
  'yyyy-mm-dd': 'YYYY-MM-DD',
};

const THEME_LABEL: Record<ThemePreference, string> = {
  system: 'Ikuti sistem',
  light: 'Terang',
  dark: 'Gelap',
};

function loadPreferences(): SettingsPreferences {
  if (typeof window === 'undefined') return DEFAULT_PREFERENCES;
  try {
    const raw = window.localStorage.getItem(PREFERENCES_KEY);
    if (!raw) return DEFAULT_PREFERENCES;
    return { ...DEFAULT_PREFERENCES, ...(JSON.parse(raw) as Partial<SettingsPreferences>) };
  } catch {
    return DEFAULT_PREFERENCES;
  }
}

export default function SettingsPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, requestPasswordReset, logout } = useAuth();
  const { company, saveCompanyProfile } = useCompanyProfile();
  const { plans, subscription, getCurrentPlan } = useSubscription(company?.id);
  const [preferences, setPreferences] = useState<SettingsPreferences>(DEFAULT_PREFERENCES);
  const [isSavingPreferences, setIsSavingPreferences] = useState(false);
  const [isSendingReset, setIsSendingReset] = useState(false);
  const [isLoadingAudit, setIsLoadingAudit] = useState(false);
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>([]);
  const [auditError, setAuditError] = useState<string | null>(null);
  const [closedThroughInput, setClosedThroughInput] = useState('');
  const [isSavingPeriodClose, setIsSavingPeriodClose] = useState(false);
  const importRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    setPreferences(loadPreferences());
  }, []);

  useEffect(() => {
    if (!company?.closedThrough) {
      setClosedThroughInput('');
      return;
    }
    const year = company.closedThrough.getFullYear();
    const month = `${company.closedThrough.getMonth() + 1}`.padStart(2, '0');
    const day = `${company.closedThrough.getDate()}`.padStart(2, '0');
    setClosedThroughInput(`${year}-${month}-${day}`);
  }, [company?.closedThrough]);

  const currentPlan = getCurrentPlan();
  const currentPlanPrice = currentPlan?.price
    ? new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
      }).format(currentPlan.price)
    : null;
  const canReadAuditLogs = useMemo(
    () => subscription?.status === 'active' && ['professional', 'premium'].includes(subscription.planId),
    [subscription],
  );

  const subscriptionSummary = useMemo(() => {
    if (!currentPlan || !subscription) {
      return {
        label: 'Belum berlangganan',
        status: 'inactive',
        endsAt: null as string | null,
      };
    }
    return {
      label: currentPlan.name,
      status: subscription.status,
      endsAt: subscription.endDate ? formatDateId(subscription.endDate) : null,
    };
  }, [currentPlan, subscription]);

  const recentAuditLabel = useMemo(() => {
    if (auditError) return auditError;
    if (!auditLogs.length) return 'Belum ada audit log terbaru.';
    const latest = auditLogs[0];
    return `Terakhir: ${latest.action} ${latest.entityType.toLowerCase()} pada ${formatDateId(latest.createdAt)}.`;
  }, [auditError, auditLogs]);

  const savePreferences = async () => {
    setIsSavingPreferences(true);
    try {
      window.localStorage.setItem(PREFERENCES_KEY, JSON.stringify(preferences));
      toast({
        title: 'Preferensi disimpan',
        description: 'Pengaturan tampilan dan notifikasi Anda telah diperbarui.',
      });
    } finally {
      setIsSavingPreferences(false);
    }
  };

  const fetchAuditLogs = async () => {
    if (!company?.id) {
      setAuditError('Perusahaan belum tersedia.');
      return;
    }
    if (!canReadAuditLogs) {
      setAuditError('Audit log tersedia untuk paket Professional atau Premium.');
      return;
    }

    setIsLoadingAudit(true);
    setAuditError(null);
    try {
      const response = await fetch(`${API_URL}/companies/${company.id}/audit-logs?limit=5`, {
        credentials: 'include',
      });
      if (!response.ok) {
        let message = `Gagal memuat audit log (${response.status})`;
        try {
          const body = await response.json();
          message = body.message ?? message;
        } catch {
          // ignore parsing errors
        }
        throw new Error(message);
      }
      const data = (await response.json()) as AuditLogItem[];
      setAuditLogs(Array.isArray(data) ? data : []);
    } catch (error) {
      setAuditLogs([]);
      setAuditError(error instanceof Error ? error.message : 'Terjadi kesalahan saat memuat audit log.');
    } finally {
      setIsLoadingAudit(false);
    }
  };

  const handleSendResetLink = async () => {
    if (!user?.email) return;
    setIsSendingReset(true);
    try {
      const result = await requestPasswordReset(user.email);
      toast({
        title: 'Link reset dikirim',
        description: result.resetUrl
          ? `Mode pengembangan: ${result.resetUrl}`
          : `Kami telah memproses permintaan reset password untuk ${user.email}.`,
      });
    } catch (error) {
      toast({
        title: 'Gagal mengirim link reset',
        description: error instanceof Error ? error.message : 'Silakan coba lagi.',
        variant: 'destructive',
      });
    } finally {
      setIsSendingReset(false);
    }
  };

  const handleExportPreferences = () => {
    const payload = {
      exportedAt: new Date().toISOString(),
      companyId: company?.id ?? null,
      userEmail: user?.email ?? null,
      preferences,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `settings-export-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    window.URL.revokeObjectURL(url);
  };

  const handleImportPreferences = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const parsed = JSON.parse(text) as { preferences?: Partial<SettingsPreferences> };
      const next = { ...DEFAULT_PREFERENCES, ...parsed.preferences };
      setPreferences(next);
      window.localStorage.setItem(PREFERENCES_KEY, JSON.stringify(next));
      toast({
        title: 'Preferensi diimpor',
        description: 'Pengaturan lokal berhasil dipulihkan dari file.',
      });
    } catch {
      toast({
        title: 'File tidak valid',
        description: 'Pastikan file ekspor pengaturan berformat JSON yang benar.',
        variant: 'destructive',
      });
    } finally {
      event.target.value = '';
    }
  };

  const handleSavePeriodClose = async () => {
    setIsSavingPeriodClose(true);
    try {
      const nextValue = closedThroughInput
        ? new Date(`${closedThroughInput}T23:59:59.999`)
        : null;
      await saveCompanyProfile({ closedThrough: nextValue });
      toast({
        title: 'Periode berhasil diperbarui',
        description: nextValue
          ? `Transaksi sampai ${formatDateId(nextValue)} sekarang terkunci untuk perubahan langsung.`
          : 'Periode tutup buku dibuka kembali.',
      });
    } catch (error: any) {
      toast({
        title: 'Gagal menyimpan periode',
        description: error?.message ?? 'Periksa kembali tanggal period close.',
        variant: 'destructive',
      });
    } finally {
      setIsSavingPeriodClose(false);
    }
  };

  const openImportPicker = () => {
    importRef.current?.click();
  };

  return (
    <MainLayout>
      <div className="space-y-8">
        <section className="relative overflow-hidden rounded-[28px] border border-primary/10 bg-[radial-gradient(circle_at_top_left,_rgba(37,99,235,0.16),_transparent_34%),linear-gradient(135deg,_rgba(248,250,252,1)_0%,_rgba(239,246,255,0.88)_48%,_rgba(255,255,255,1)_100%)] p-8 shadow-[0_20px_80px_-42px_rgba(15,23,42,0.35)]">
          <div className="absolute -right-16 top-0 h-48 w-48 rounded-full bg-primary/10 blur-3xl" />
          <div className="absolute bottom-0 left-1/3 h-32 w-32 rounded-full bg-sky-200/40 blur-3xl" />
          <div className="relative grid gap-8 xl:grid-cols-[1.3fr_0.7fr]">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-white/80 px-3 py-1 text-sm font-medium text-primary shadow-sm backdrop-blur">
                <Settings2 className="h-4 w-4" />
                Pengaturan Produk
              </div>
              <div className="space-y-3">
                <h1 className="text-4xl font-semibold tracking-tight text-foreground">Pengaturan</h1>
                <p className="max-w-3xl text-base leading-7 text-muted-foreground">
                  Kelola langganan, keamanan akun, preferensi penggunaan, dan pengaturan data produk
                  tanpa mencampurkan profil akun atau profil perusahaan.
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-white/70 bg-white/70 p-4 shadow-sm backdrop-blur">
                  <div className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    Paket Aktif
                  </div>
                  <div className="mt-2 text-lg font-semibold text-foreground">
                    {subscriptionSummary.label}
                  </div>
                  <div className="mt-1 text-sm text-muted-foreground">
                    {subscriptionSummary.status === 'active' ? 'Siap digunakan' : 'Belum aktif'}
                  </div>
                </div>
                <div className="rounded-2xl border border-white/70 bg-white/70 p-4 shadow-sm backdrop-blur">
                  <div className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    Zona Keamanan
                  </div>
                  <div className="mt-2 text-lg font-semibold text-foreground">
                    {canReadAuditLogs ? 'Audit siap' : 'Audit terbatas'}
                  </div>
                  <div className="mt-1 text-sm text-muted-foreground">
                    Reset password dan sesi akun
                  </div>
                </div>
                <div className="rounded-2xl border border-white/70 bg-white/70 p-4 shadow-sm backdrop-blur">
                  <div className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    Preferensi
                  </div>
                  <div className="mt-2 text-lg font-semibold text-foreground">
                    {preferences.language === 'id' ? 'Indonesia' : 'English'}
                  </div>
                  <div className="mt-1 text-sm text-muted-foreground">
                    {TIMEZONE_OPTIONS.find((option) => option.value === preferences.timezone)?.label ?? preferences.timezone}
                  </div>
                </div>
              </div>
            </div>

            <div className="grid gap-3 self-start sm:grid-cols-2 xl:grid-cols-1">
              <div className="rounded-2xl border border-primary/10 bg-white/85 p-5 shadow-sm backdrop-blur">
                <div className="flex items-start gap-3">
                  <div className="rounded-2xl bg-primary/10 p-3 text-primary">
                    <Sparkles className="h-5 w-5" />
                  </div>
                  <div className="space-y-1">
                    <div className="text-sm font-semibold text-foreground">Operasional Cepat</div>
                    <p className="text-sm leading-6 text-muted-foreground">
                      Renewal paket, audit log, dan preferensi utama ditempatkan dalam satu alur.
                    </p>
                  </div>
                </div>
              </div>
              <div className="rounded-2xl border border-primary/10 bg-white/85 p-5 shadow-sm backdrop-blur">
                <div className="flex items-start gap-3">
                  <div className="rounded-2xl bg-sky-100 p-3 text-primary">
                    <CheckCircle2 className="h-5 w-5" />
                  </div>
                  <div className="space-y-1">
                    <div className="text-sm font-semibold text-foreground">Siap Produksi</div>
                    <p className="text-sm leading-6 text-muted-foreground">
                      Pengaturan akun perusahaan tetap berada di halaman profil agar struktur lebih jelas.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <Tabs defaultValue="subscription" className="space-y-6">
          <TabsList className="grid h-auto w-full gap-2 rounded-3xl border border-border/70 bg-gradient-to-r from-slate-50 via-white to-slate-50 p-2 md:grid-cols-4">
            <TabsTrigger value="subscription" className="gap-2 rounded-2xl py-3">
              <CreditCard className="h-4 w-4" />
              Langganan & Pembayaran
            </TabsTrigger>
            <TabsTrigger value="security" className="gap-2 rounded-2xl py-3">
              <ShieldCheck className="h-4 w-4" />
              Keamanan
            </TabsTrigger>
            <TabsTrigger value="preferences" className="gap-2 rounded-2xl py-3">
              <Palette className="h-4 w-4" />
              Preferensi
            </TabsTrigger>
            <TabsTrigger value="system" className="gap-2 rounded-2xl py-3">
              <Database className="h-4 w-4" />
              Sistem & Data
            </TabsTrigger>
          </TabsList>

          <TabsContent value="subscription" className="space-y-6">
            <div className="grid gap-6 xl:grid-cols-[1.3fr_1fr]">
              <Card className="overflow-hidden border-border/70 shadow-sm">
                <CardHeader>
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <CreditCard className="h-5 w-5 text-primary" />
                        Langganan Saat Ini
                      </CardTitle>
                      <CardDescription>
                        Lihat status paket aktif, masa berlaku, dan arahkan pengguna ke alur renewal.
                      </CardDescription>
                    </div>
                    <Badge variant={subscription?.status === 'active' ? 'default' : 'secondary'}>
                      {subscriptionSummary.status === 'active' ? 'Aktif' : 'Belum aktif'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div className="grid gap-4 sm:grid-cols-3">
                    <div className="rounded-2xl border border-primary/10 bg-[linear-gradient(180deg,rgba(255,255,255,1),rgba(239,246,255,0.72))] p-4">
                      <div className="text-sm text-muted-foreground">Paket</div>
                      <div className="mt-1 text-xl font-semibold">{subscriptionSummary.label}</div>
                    </div>
                    <div className="rounded-2xl border border-primary/10 bg-[linear-gradient(180deg,rgba(255,255,255,1),rgba(239,246,255,0.72))] p-4">
                      <div className="text-sm text-muted-foreground">Harga</div>
                      <div className="mt-1 text-xl font-semibold">{currentPlanPrice ?? '-'}</div>
                    </div>
                    <div className="rounded-2xl border border-primary/10 bg-[linear-gradient(180deg,rgba(255,255,255,1),rgba(239,246,255,0.72))] p-4">
                      <div className="text-sm text-muted-foreground">Berlaku sampai</div>
                      <div className="mt-1 text-xl font-semibold">{subscriptionSummary.endsAt ?? '-'}</div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <Button onClick={() => navigate('/langganan')}>Kelola Paket</Button>
                    <Button
                      variant="outline"
                      disabled={!currentPlan}
                      onClick={() => currentPlan && navigate(`/pembayaran?plan=${currentPlan.id}`)}
                    >
                      <RefreshCcw className="mr-2 h-4 w-4" />
                      Perpanjang Paket
                    </Button>
                  </div>

                  <Separator />

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="rounded-2xl border border-border/70 p-4">
                      <div className="mb-2 flex items-center gap-2 font-medium">
                        <ReceiptText className="h-4 w-4 text-primary" />
                        Riwayat Tagihan / Invoice
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Modul invoice langganan belum dipublikasikan. Untuk sementara, histori
                        pembayaran mengikuti transaksi sukses pada alur langganan.
                      </p>
                    </div>
                    <div className="rounded-2xl border border-border/70 p-4">
                      <div className="mb-2 flex items-center gap-2 font-medium">
                        <CreditCard className="h-4 w-4 text-primary" />
                        Metode Pembayaran
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Checkout saat ini mendukung kartu, QRIS, dan GoPay pada halaman pembayaran.
                        Pengelolaan metode tersimpan dapat ditambahkan pada iterasi berikutnya.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border/70 shadow-sm">
                <CardHeader>
                  <CardTitle>Ringkasan Paket</CardTitle>
                  <CardDescription>Perbandingan cepat paket yang tersedia saat ini.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {plans.map((plan) => (
                    <div
                      key={plan.id}
                      className={`rounded-2xl border p-4 transition-colors ${currentPlan?.id === plan.id ? 'border-primary bg-primary/5 shadow-sm' : 'border-border/70 bg-white'}`}
                    >
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <div className="font-semibold">{plan.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {new Intl.NumberFormat('id-ID', {
                              style: 'currency',
                              currency: 'IDR',
                              minimumFractionDigits: 0,
                            }).format(plan.price)}
                            {' '} / bulan
                          </div>
                        </div>
                        {currentPlan?.id === plan.id && <Badge>Paket Saat Ini</Badge>}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="security" className="space-y-6">
            <div className="grid gap-6 xl:grid-cols-2">
              <Card className="border-border/70 shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <KeyRound className="h-5 w-5 text-primary" />
                    Password Reset
                  </CardTitle>
                  <CardDescription>
                    Kirim link reset password ke email login yang sedang aktif.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="rounded-2xl border border-primary/10 bg-[linear-gradient(180deg,rgba(255,255,255,1),rgba(239,246,255,0.65))] p-4">
                    <div className="text-sm text-muted-foreground">Email akun</div>
                    <div className="mt-1 font-medium">{user?.email ?? '-'}</div>
                  </div>
                  <Button onClick={handleSendResetLink} disabled={!user?.email || isSendingReset}>
                    {isSendingReset ? 'Mengirim link...' : 'Kirim Link Reset Password'}
                  </Button>
                </CardContent>
              </Card>

              <Card className="border-border/70 shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ShieldCheck className="h-5 w-5 text-primary" />
                    Audit Log
                  </CardTitle>
                  <CardDescription>
                    Tersedia untuk paket Professional atau Premium.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="rounded-2xl border border-primary/10 bg-[linear-gradient(180deg,rgba(255,255,255,1),rgba(239,246,255,0.65))] p-4 text-sm text-muted-foreground">
                    {recentAuditLabel}
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <Button
                      variant="outline"
                      disabled={!company?.id || isLoadingAudit}
                      onClick={fetchAuditLogs}
                    >
                      {isLoadingAudit ? 'Memuat...' : 'Muat Audit Log'}
                    </Button>
                    <Button
                      variant="ghost"
                      disabled={!company?.id}
                      onClick={() => navigate('/system-check')}
                    >
                      Halaman Diagnostic
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-6 xl:grid-cols-2">
              <Card className="border-border/70 shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Laptop className="h-5 w-5 text-primary" />
                    Sesi Perangkat
                  </CardTitle>
                  <CardDescription>
                    Kelola sesi aktif untuk perangkat saat ini.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="rounded-2xl border border-border/70 p-4">
                    <div className="font-medium">Perangkat saat ini</div>
                    <div className="mt-1 text-sm text-muted-foreground">
                      Browser ini sedang login sebagai {user?.email ?? 'pengguna aktif'}.
                    </div>
                  </div>
                  <Button variant="outline" onClick={logout}>
                    Logout dari perangkat ini
                  </Button>
                </CardContent>
              </Card>

              <Card className="border-border/70 shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <History className="h-5 w-5 text-primary" />
                    Riwayat Login
                  </CardTitle>
                  <CardDescription>
                    Placeholder untuk histori login dan manajemen sesi lintas perangkat.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 text-sm text-muted-foreground">
                  <p>Fitur login history dan logout semua perangkat belum tersedia di backend saat ini.</p>
                  <p>Kalau diinginkan, ini bisa jadi batch berikutnya: tabel session, last login IP, dan revoke refresh token per device.</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="preferences" className="space-y-6">
            <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
              <Card className="border-border/70 shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <LayoutGrid className="h-5 w-5 text-primary" />
                    Preferensi Penggunaan
                  </CardTitle>
                  <CardDescription>
                    Disimpan lokal di browser untuk pengalaman penggunaan yang lebih konsisten.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div className="grid gap-5 md:grid-cols-2">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Bahasa</label>
                      <Select
                        value={preferences.language}
                        onValueChange={(value) => setPreferences((prev) => ({ ...prev, language: value as LanguagePreference }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="id">Bahasa Indonesia</SelectItem>
                          <SelectItem value="en">English</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Timezone</label>
                      <Select
                        value={preferences.timezone}
                        onValueChange={(value) => setPreferences((prev) => ({ ...prev, timezone: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {TIMEZONE_OPTIONS.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Format Tanggal</label>
                      <Select
                        value={preferences.dateFormat}
                        onValueChange={(value) => setPreferences((prev) => ({ ...prev, dateFormat: value as DateFormatPreference }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="dd/mm/yyyy">DD/MM/YYYY</SelectItem>
                          <SelectItem value="mm/dd/yyyy">MM/DD/YYYY</SelectItem>
                          <SelectItem value="yyyy-mm-dd">YYYY-MM-DD</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Tampilan Angka / Mata Uang</label>
                      <Select
                        value={preferences.numberCurrency}
                        onValueChange={(value) => setPreferences((prev) => ({ ...prev, numberCurrency: value as CurrencyPreference }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="IDR">Rupiah (IDR)</SelectItem>
                          <SelectItem value="USD">US Dollar (USD)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <label className="text-sm font-medium">Tema</label>
                      <Select
                        value={preferences.theme}
                        onValueChange={(value) => setPreferences((prev) => ({ ...prev, theme: value as ThemePreference }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="system">Ikuti sistem</SelectItem>
                          <SelectItem value="light">Terang</SelectItem>
                          <SelectItem value="dark">Gelap</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground">
                        Preferensi tema sudah disimpan, tetapi penerapan tema global penuh belum diaktifkan di aplikasi.
                      </p>
                    </div>
                  </div>

                  <div className="grid gap-3 md:grid-cols-3">
                    <div className="rounded-2xl border border-primary/10 bg-[linear-gradient(180deg,rgba(255,255,255,1),rgba(239,246,255,0.65))] p-4">
                      <div className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                        Bahasa
                      </div>
                      <div className="mt-2 font-semibold text-foreground">
                        {preferences.language === 'id' ? 'Bahasa Indonesia' : 'English'}
                      </div>
                    </div>
                    <div className="rounded-2xl border border-primary/10 bg-[linear-gradient(180deg,rgba(255,255,255,1),rgba(239,246,255,0.65))] p-4">
                      <div className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                        Tanggal
                      </div>
                      <div className="mt-2 font-semibold text-foreground">
                        {DATE_FORMAT_LABEL[preferences.dateFormat]}
                      </div>
                    </div>
                    <div className="rounded-2xl border border-primary/10 bg-[linear-gradient(180deg,rgba(255,255,255,1),rgba(239,246,255,0.65))] p-4">
                      <div className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                        Tema
                      </div>
                      <div className="mt-2 font-semibold text-foreground">
                        {THEME_LABEL[preferences.theme]}
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <Button onClick={savePreferences} disabled={isSavingPreferences}>
                      {isSavingPreferences ? 'Menyimpan...' : 'Simpan Preferensi'}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border/70 shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bell className="h-5 w-5 text-primary" />
                    Notifikasi
                  </CardTitle>
                  <CardDescription>
                    Atur notifikasi penting yang paling relevan untuk operasional harian.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div className="flex items-center justify-between gap-4 rounded-2xl border border-border/70 p-4">
                    <div>
                      <div className="font-medium">Email umum produk</div>
                      <div className="text-sm text-muted-foreground">Info fitur, update, dan bantuan pengguna.</div>
                    </div>
                    <Switch
                      checked={preferences.notificationsEmail}
                      onCheckedChange={(checked) => setPreferences((prev) => ({ ...prev, notificationsEmail: checked }))}
                    />
                  </div>

                  <div className="flex items-center justify-between gap-4 rounded-2xl border border-border/70 p-4">
                    <div>
                      <div className="font-medium">Penagihan & langganan</div>
                      <div className="text-sm text-muted-foreground">Pengingat perpanjangan paket dan perubahan status pembayaran.</div>
                    </div>
                    <Switch
                      checked={preferences.notificationsBilling}
                      onCheckedChange={(checked) => setPreferences((prev) => ({ ...prev, notificationsBilling: checked }))}
                    />
                  </div>

                  <div className="flex items-center justify-between gap-4 rounded-2xl border border-border/70 p-4">
                    <div>
                      <div className="font-medium">Keamanan akun</div>
                      <div className="text-sm text-muted-foreground">Reset password, login baru, dan aktivitas sensitif.</div>
                    </div>
                    <Switch
                      checked={preferences.notificationsSecurity}
                      onCheckedChange={(checked) => setPreferences((prev) => ({ ...prev, notificationsSecurity: checked }))}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="system" className="space-y-6">
            <div className="grid gap-6 xl:grid-cols-2">
              <Card className="border-border/70 shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <History className="h-5 w-5 text-primary" />
                    Period Close
                  </CardTitle>
                  <CardDescription>
                    Tutup periode sampai tanggal tertentu agar transaksi posted tidak bisa diedit, dihapus, atau dibalikkan langsung.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="text-sm font-medium">Tutup buku sampai tanggal</div>
                    <Input
                      type="date"
                      value={closedThroughInput}
                      onChange={(event) => setClosedThroughInput(event.target.value)}
                      className="max-w-xs"
                    />
                  </div>
                  <div className="rounded-2xl border border-border/70 p-4 text-sm text-muted-foreground">
                    Setelah periode ditutup, koreksi hanya boleh dilakukan di periode terbuka melalui jurnal penyesuaian atau reversal yang sah.
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <Button onClick={handleSavePeriodClose} disabled={isSavingPeriodClose}>
                      {isSavingPeriodClose ? 'Menyimpan...' : 'Simpan Period Close'}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setClosedThroughInput('')}
                      disabled={isSavingPeriodClose}
                    >
                      Buka Kembali
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border/70 shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Download className="h-5 w-5 text-primary" />
                    Ekspor & Impor Pengaturan
                  </CardTitle>
                  <CardDescription>
                    Cadangkan dan pulihkan preferensi lokal pengguna.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-wrap gap-3">
                    <Button variant="outline" onClick={handleExportPreferences}>
                      <Download className="mr-2 h-4 w-4" />
                      Ekspor JSON
                    </Button>
                    <Button variant="outline" onClick={openImportPicker}>
                      <Upload className="mr-2 h-4 w-4" />
                      Impor JSON
                    </Button>
                    <input
                      ref={importRef}
                      type="file"
                      accept="application/json"
                      className="hidden"
                      onChange={handleImportPreferences}
                    />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Saat ini ekspor/impor fokus pada preferensi pengguna di browser. Ekspor penuh data bisnis dapat ditambahkan sebagai modul terpisah.
                  </p>
                </CardContent>
              </Card>

              <Card className="border-border/70 shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileClock className="h-5 w-5 text-primary" />
                    Status Backup
                  </CardTitle>
                  <CardDescription>
                    Ringkasan arsitektur penyimpanan dan backup saat ini.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="rounded-2xl border border-border/70 p-4">
                    <div className="font-medium">Database</div>
                    <div className="mt-1 text-sm text-muted-foreground">
                      Database aplikasi dikelola di Neon. Backup dan point-in-time recovery mengikuti pengaturan project Neon Anda.
                    </div>
                  </div>
                  <div className="rounded-2xl border border-border/70 p-4">
                    <div className="font-medium">Aplikasi</div>
                    <div className="mt-1 text-sm text-muted-foreground">
                      Frontend berjalan di Cloudflare Pages dan backend di Render. Monitoring operasional tetap dilakukan pada dashboard masing-masing platform.
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="border-destructive/30">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-destructive">
                  <Trash2 className="h-5 w-5" />
                  Zona Berisiko
                </CardTitle>
                <CardDescription>
                  Aksi permanen sebaiknya diproteksi dan hanya diaktifkan setelah backend siap.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-wrap items-center justify-between gap-4">
                <div className="max-w-2xl text-sm text-muted-foreground">
                  Fitur deaktifkan akun / hapus akun belum tersedia di backend. Tombol di bawah ini
                  sengaja belum melakukan penghapusan permanen agar tidak merusak data produksi.
                </div>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive">Deaktifkan Akun</Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Fitur belum tersedia</AlertDialogTitle>
                      <AlertDialogDescription>
                        Backend untuk deaktivasi atau penghapusan akun belum diimplementasikan.
                        Kalau Anda mau, saya bisa bantu bangun alur deactivation yang aman berikutnya.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Tutup</AlertDialogCancel>
                      <AlertDialogAction onClick={() => undefined}>Mengerti</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
