import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, Package, ShoppingCart, TrendingUp, ArrowRight } from 'lucide-react';

const features = [
  {
    icon: Building2,
    title: 'Profil Perusahaan',
    description: 'Atur detail dan preferensi bisnis Anda',
  },
  {
    icon: Package,
    title: 'Manajemen Produk',
    description: 'Tambah dan kelola inventaris serta produk Anda',
  },
  {
    icon: ShoppingCart,
    title: 'Penjualan & Pembelian',
    description: 'Lacak semua transaksi Anda di satu tempat',
  },
  {
    icon: TrendingUp,
    title: 'Laporan Keuangan',
    description: 'Buat laporan bisnis yang komprehensif',
  },
];

export function WelcomePage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
            <Building2 className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-4xl font-bold text-foreground mb-2">
            Selamat Datang di Asia Global Financial
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Solusi lengkap Anda untuk mengelola operasi bisnis ritel, inventaris, dan pelaporan keuangan.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-4 mb-8">
          {features.map((feature) => (
            <Card key={feature.title} className="border-border/50 bg-card/50 backdrop-blur">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <feature.icon className="w-5 h-5 text-primary" />
                  </div>
                  <CardTitle className="text-lg">{feature.title}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription>{feature.description}</CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="border-primary/20 bg-card">
          <CardHeader className="text-center">
            <CardTitle>Mari Mulai</CardTitle>
            <CardDescription>
              Atur profil perusahaan Anda untuk mulai menggunakan Asia Global Financial
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Button 
              size="lg" 
              onClick={() => navigate('/onboarding/company-setup')}
              className="gap-2"
            >
              Atur Profil Perusahaan
              <ArrowRight className="w-4 h-4" />
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
