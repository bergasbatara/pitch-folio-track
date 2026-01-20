import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { useCompanyProfile } from '../hooks/useCompanyProfile';
import { useOnboarding } from '../hooks/useOnboarding';
import { Building2, ArrowLeft, Check } from 'lucide-react';

const currencies = [
  { value: 'IDR', label: 'Rupiah Indonesia (IDR)' },
  { value: 'USD', label: 'Dolar AS (USD)' },
  { value: 'SGD', label: 'Dolar Singapura (SGD)' },
  { value: 'MYR', label: 'Ringgit Malaysia (MYR)' },
];

export function CompanySetupPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { company, saveCompanyProfile } = useCompanyProfile();
  const { completeStep, completeOnboarding } = useOnboarding();

  const [formData, setFormData] = useState({
    name: company?.name || '',
    address: company?.address || '',
    phone: company?.phone || '',
    email: company?.email || '',
    taxId: company?.taxId || '',
    currency: company?.currency || 'IDR',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.address || !formData.phone || !formData.email) {
      toast({
        title: 'Informasi Tidak Lengkap',
        description: 'Mohon lengkapi semua kolom yang wajib diisi.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      saveCompanyProfile(formData);
      completeStep('company-setup');
      completeOnboarding();

      toast({
        title: 'Profil Perusahaan Tersimpan',
        description: 'Profil perusahaan Anda telah berhasil diatur!',
      });

      navigate('/');
    } catch (error) {
      toast({
        title: 'Kesalahan',
        description: 'Gagal menyimpan profil perusahaan. Silakan coba lagi.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <Button
          variant="ghost"
          onClick={() => navigate('/onboarding/welcome')}
          className="mb-4 gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Kembali ke Selamat Datang
        </Button>

        <Card>
          <CardHeader className="text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mx-auto mb-2">
              <Building2 className="w-6 h-6 text-primary" />
            </div>
            <CardTitle className="text-2xl">Pengaturan Profil Perusahaan</CardTitle>
            <CardDescription>
              Masukkan informasi bisnis Anda untuk memulai
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="md:col-span-2 space-y-2">
                  <Label htmlFor="name">Nama Perusahaan *</Label>
                  <Input
                    id="name"
                    placeholder="contoh, Asia Global Trading"
                    value={formData.name}
                    onChange={(e) => handleChange('name', e.target.value)}
                    required
                  />
                </div>

                <div className="md:col-span-2 space-y-2">
                  <Label htmlFor="address">Alamat Bisnis *</Label>
                  <Textarea
                    id="address"
                    placeholder="Masukkan alamat bisnis lengkap Anda"
                    value={formData.address}
                    onChange={(e) => handleChange('address', e.target.value)}
                    rows={3}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Nomor Telepon *</Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="contoh, +62 21 1234567"
                    value={formData.phone}
                    onChange={(e) => handleChange('phone', e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email Bisnis *</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="contoh, kontak@perusahaan.com"
                    value={formData.email}
                    onChange={(e) => handleChange('email', e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="taxId">NPWP (Opsional)</Label>
                  <Input
                    id="taxId"
                    placeholder="contoh, 12.345.678.9-012.345"
                    value={formData.taxId}
                    onChange={(e) => handleChange('taxId', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="currency">Mata Uang Default *</Label>
                  <Select
                    value={formData.currency}
                    onValueChange={(value) => handleChange('currency', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih mata uang" />
                    </SelectTrigger>
                    <SelectContent>
                      {currencies.map((currency) => (
                        <SelectItem key={currency.value} value={currency.value}>
                          {currency.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <Button type="submit" size="lg" disabled={isSubmitting} className="gap-2">
                  {isSubmitting ? (
                    'Menyimpan...'
                  ) : (
                    <>
                      Selesaikan Pengaturan
                      <Check className="w-4 h-4" />
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
