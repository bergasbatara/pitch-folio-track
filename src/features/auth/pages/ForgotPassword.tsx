import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CheckCircle2, Mail } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '../contexts/AuthContext';

export default function ForgotPassword() {
  const navigate = useNavigate();
  const { requestPasswordReset } = useAuth();
  const { toast } = useToast();

  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const result = await requestPasswordReset(email);
      toast({
        title: 'Permintaan reset dibuat',
        description: result.resetUrl
          ? 'Link reset tersedia untuk mode development. Anda akan diarahkan sekarang.'
          : 'Jika email terdaftar, instruksi reset password telah dikirim.',
      });
      setSubmittedEmail(email);
      if (result.resetUrl) {
        const url = new URL(result.resetUrl);
        navigate(`${url.pathname}${url.search}`);
      }
    } catch (error) {
      toast({
        title: 'Gagal memproses permintaan',
        description: error instanceof Error ? error.message : 'Terjadi kesalahan.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Lupa Password</CardTitle>
          <CardDescription>
            {submittedEmail
              ? 'Permintaan reset berhasil diproses'
              : 'Masukkan email akun Anda untuk meminta link reset password'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {submittedEmail ? (
            <div className="space-y-4 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <div className="space-y-2">
                <p className="text-sm text-foreground">
                  Jika akun <span className="font-medium">{submittedEmail}</span> terdaftar, link reset password sudah dikirim.
                </p>
                <p className="text-sm text-muted-foreground">
                  Silakan cek inbox dan spam folder Anda. Link akan kedaluwarsa dalam 30 menit.
                </p>
              </div>
              <Button type="button" variant="outline" className="w-full" onClick={() => setSubmittedEmail(null)}>
                Kirim Ulang ke Email Lain
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="forgot-email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="forgot-email"
                    type="email"
                    placeholder="email@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? 'Memproses...' : 'Kirim Link Reset'}
              </Button>
            </form>
          )}
        </CardContent>
        <CardFooter className="flex justify-center">
          <p className="text-sm text-muted-foreground">
            Kembali ke{' '}
            <Link to="/login" className="text-primary hover:underline font-medium">
              halaman login
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
