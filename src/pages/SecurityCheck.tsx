import { useMemo, useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useCompanyProfile } from '@/features/onboarding';
import { Badge } from '@/components/ui/badge';
import { ShieldCheck, ShieldAlert, RefreshCw } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

const getCookie = (name: string): string | null => {
  if (typeof document === 'undefined') return null;
  const match = document.cookie
    .split(';')
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${name}=`));
  if (!match) return null;
  return decodeURIComponent(match.split('=').slice(1).join('='));
};

export default function SecurityCheck() {
  const { company } = useCompanyProfile();
  const [csrfToken, setCsrfToken] = useState<string | null>(() => getCookie('csrf_token'));
  const [csrfTest, setCsrfTest] = useState<string | null>(null);
  const [rateTest, setRateTest] = useState<string | null>(null);
  const [auditTest, setAuditTest] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState(false);

  const csrfStatus = useMemo(() => (csrfToken ? 'Aktif' : 'Tidak ada'), [csrfToken]);

  const refreshCsrf = async () => {
    await fetch(`${API_URL}/auth/csrf`, { credentials: 'include' });
    setCsrfToken(getCookie('csrf_token'));
  };

  const runCsrfTest = async () => {
    if (!company?.id) {
      setCsrfTest('Gagal: company belum tersedia.');
      return;
    }
    setIsRunning(true);
    try {
      const res = await fetch(`${API_URL}/companies/${company.id}/products`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': 'invalid',
        },
        credentials: 'include',
        body: JSON.stringify({}),
      });
      if (res.status === 403) {
        setCsrfTest('Lulus: CSRF ditolak (403).');
      } else {
        setCsrfTest(`Gagal: status ${res.status}. CSRF mungkin tidak aktif.`);
      }
    } catch (err: any) {
      setCsrfTest(`Gagal: ${err.message ?? 'Request error'}`);
    } finally {
      setIsRunning(false);
    }
  };

  const runRateLimitTest = async () => {
    setIsRunning(true);
    try {
      const attempts = 7;
      const results: number[] = [];
      for (let i = 0; i < attempts; i += 1) {
        const res = await fetch(`${API_URL}/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ email: `rate-limit-${Date.now()}@test.com`, password: 'wrong' }),
        });
        results.push(res.status);
      }
      const has429 = results.some((code) => code === 429);
      setRateTest(has429
        ? `Lulus: 429 muncul (${results.join(', ')})`
        : `Gagal: belum ada 429 (${results.join(', ')})`);
    } catch (err: any) {
      setRateTest(`Gagal: ${err.message ?? 'Request error'}`);
    } finally {
      setIsRunning(false);
    }
  };

  const runAuditTest = async () => {
    if (!company?.id) {
      setAuditTest('Gagal: company belum tersedia.');
      return;
    }
    setIsRunning(true);
    try {
      const res = await fetch(`${API_URL}/companies/${company.id}/audit-logs?limit=5`, {
        method: 'GET',
        credentials: 'include',
      });
      if (!res.ok) {
        setAuditTest(`Gagal: status ${res.status}`);
        return;
      }
      const data = await res.json();
      const count = Array.isArray(data) ? data.length : 0;
      setAuditTest(`Lulus: ${count} log ditemukan.`);
    } catch (err: any) {
      setAuditTest(`Gagal: ${err.message ?? 'Request error'}`);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="page-header">
          <h1 className="page-title flex items-center gap-2">
            <ShieldCheck className="h-6 w-6" />
            Security Check
          </h1>
          <p className="text-muted-foreground">Validasi keamanan dasar aplikasi</p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>CSRF Token</CardTitle>
              <Badge variant={csrfToken ? 'default' : 'destructive'}>{csrfStatus}</Badge>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Pastikan `csrf_token` tersedia di cookie.
              </p>
              <div className="flex gap-2">
                <Button variant="outline" onClick={refreshCsrf} disabled={isRunning}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh CSRF
                </Button>
                <Button onClick={runCsrfTest} disabled={isRunning}>
                  Test CSRF
                </Button>
              </div>
              {csrfTest && (
                <div className="text-sm">{csrfTest}</div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Rate Limit</CardTitle>
              <ShieldAlert className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Menjalankan 7 kali login gagal dan cek status 429.
              </p>
              <Button onClick={runRateLimitTest} disabled={isRunning}>
                Jalankan Test
              </Button>
              {rateTest && (
                <div className="text-sm">{rateTest}</div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Audit Log</CardTitle>
              <ShieldAlert className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Cek apakah audit log tersimpan di database.
              </p>
              <Button onClick={runAuditTest} disabled={isRunning}>
                Cek Audit Logs
              </Button>
              {auditTest && (
                <div className="text-sm">{auditTest}</div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}
