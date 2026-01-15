import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/components/ui/use-toast';
import { User, Mail, Save } from 'lucide-react';

export function ProfilePage() {
  const { user, updateProfile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [name, setName] = useState(user?.name || '');
  const [avatar, setAvatar] = useState(user?.avatar || '');
  const [isLoading, setIsLoading] = useState(false);

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
      const success = await updateProfile({ name, avatar });
      if (success) {
        toast({
          title: "Profil Diperbarui",
          description: "Informasi profil Anda berhasil diperbarui.",
        });
      } else {
        toast({
          title: "Gagal",
          description: "Gagal memperbarui profil.",
          variant: "destructive",
        });
      }
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
              <Avatar className="h-24 w-24 mb-4">
                <AvatarImage src={avatar} alt={name} />
                <AvatarFallback className="text-2xl bg-primary text-primary-foreground">
                  {getInitials(name)}
                </AvatarFallback>
              </Avatar>
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
                <Label htmlFor="name">Nama</Label>
                <Input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Masukkan nama Anda"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="avatar">URL Avatar (opsional)</Label>
                <Input
                  id="avatar"
                  type="url"
                  value={avatar}
                  onChange={(e) => setAvatar(e.target.value)}
                  placeholder="https://example.com/avatar.jpg"
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
