import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/components/ui/use-toast';
import { User, Mail, Save, Camera, MapPin, Phone, Building2 } from 'lucide-react';
import { useCompanyProfile } from '@/features/onboarding';
import { useErrorToast } from '@/shared/hooks/useErrorToast';
import { useSubscription } from '@/features/subscription';

export function ProfilePage() {
  const { user, updateProfile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { company, saveCompanyProfile, error: companyError } = useCompanyProfile();
  const { subscription, getCurrentPlan, isLoading: isLoadingSubscription } = useSubscription(company?.id);
  useErrorToast(companyError, 'Gagal memuat perusahaan');
  
  const [name, setName] = useState(user?.name || '');
  const [avatar, setAvatar] = useState(user?.avatar || '');
  const [address, setAddress] = useState(company?.address || user?.address || '');
  const [phone, setPhone] = useState(company?.phone || user?.phone || '');
  const [companyName, setCompanyName] = useState(company?.name || user?.companyName || '');
  const [taxId, setTaxId] = useState(company?.taxId || '');
  const [isLoading, setIsLoading] = useState(false);
  const [showAvatarInput, setShowAvatarInput] = useState(false);

  const currentPlan = getCurrentPlan();
  const planLabel = isLoadingSubscription
    ? 'Memuat...'
    : currentPlan?.name ?? 'Free';

  useEffect(() => {
    if (!user) return;
    setName(user.name || '');
    setAvatar(user.avatar || '');
    setAddress(company?.address || user.address || '');
    setPhone(company?.phone || user.phone || '');
    setCompanyName(company?.name || user.companyName || '');
    setTaxId(company?.taxId || '');
  }, [user, company]);

  if (!user) {
    navigate('/login');
    return null;
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const trimmedName = name.trim();
      const trimmedCompanyName = companyName.trim();
      const trimmedAddress = address.trim();
      const trimmedPhone = phone.trim();
      const trimmedTaxId = taxId.trim();

      await updateProfile({
        name: trimmedName || undefined,
        avatar: avatar.trim() || undefined,
        address: trimmedAddress || undefined,
        phone: trimmedPhone || undefined,
        companyName: trimmedCompanyName || undefined,
      });

      if (company?.id) {
        await saveCompanyProfile({
          name: trimmedCompanyName || company.name,
          address: trimmedAddress || company.address,
          phone: trimmedPhone || company.phone,
          taxId: trimmedTaxId || undefined,
        });
      }

      toast({
        title: "Profil Diperbarui",
        description: "Informasi profil Anda berhasil diperbarui.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Terjadi kesalahan saat memperbarui profil.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <MainLayout>
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Profil Pengguna
            </CardTitle>
            <CardDescription>
              Lihat dan perbarui informasi akun Anda
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center mb-6">
              <div className="relative group cursor-pointer mb-4" onClick={() => setShowAvatarInput(!showAvatarInput)}>
                <Avatar className="h-24 w-24">
                  <AvatarImage src={avatar} alt={name} />
                  <AvatarFallback className="text-2xl bg-primary text-primary-foreground">
                    {getInitials(name)}
                  </AvatarFallback>
                </Avatar>
                <div className="absolute inset-0 flex items-end justify-center rounded-full overflow-hidden">
                  <div className="w-full bg-black/50 text-white text-xs text-center py-1">
                    <Camera className="h-3 w-3 mx-auto" />
                  </div>
                </div>
              </div>
              {showAvatarInput && (
                <div className="w-full max-w-xs mb-2">
                  <Input
                    type="url"
                    value={avatar}
                    onChange={(e) => setAvatar(e.target.value)}
                    placeholder="https://example.com/avatar.jpg"
                    className="text-sm"
                  />
                </div>
              )}
              <h2 className="text-xl font-semibold">{user.name}</h2>
              <p className="text-muted-foreground flex items-center gap-1">
                <Mail className="h-4 w-4" />
                {user.email}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={user.email}
                  disabled
                  className="bg-muted"
                />
                <p className="text-xs text-muted-foreground">
                  Email tidak dapat diubah
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="name" className="flex items-center gap-1">
                  <User className="h-3.5 w-3.5" /> Nama
                </Label>
                <Input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Masukkan nama Anda"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="companyName" className="flex items-center gap-1">
                  <Building2 className="h-3.5 w-3.5" /> Nama Perusahaan
                </Label>
                <Input
                  id="companyName"
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="Masukkan nama perusahaan"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="plan" className="flex items-center gap-1">
                  <Building2 className="h-3.5 w-3.5" /> Paket Langganan
                </Label>
                <Input
                  id="plan"
                  type="text"
                  value={
                    subscription?.status
                      ? `${planLabel} (${subscription.status})`
                      : planLabel
                  }
                  disabled
                  className="bg-muted"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone" className="flex items-center gap-1">
                  <Phone className="h-3.5 w-3.5" /> Nomor Telepon
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Masukkan nomor telepon"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="address" className="flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" /> Alamat
                </Label>
                <Input
                  id="address"
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Masukkan alamat Anda"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="taxId" className="flex items-center gap-1">
                  <Building2 className="h-3.5 w-3.5" /> NPWP
                </Label>
                <Input
                  id="taxId"
                  type="text"
                  value={taxId}
                  onChange={(e) => setTaxId(e.target.value)}
                  placeholder="Nomor NPWP perusahaan"
                />
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                <Save className="h-4 w-4 mr-2" />
                {isLoading ? 'Menyimpan...' : 'Simpan Perubahan'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
