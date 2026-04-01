import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, Crown, Sparkles, Building2 } from 'lucide-react';
import { useSubscription } from '../hooks/useSubscription';
import { useToast } from '@/components/ui/use-toast';
import { useCompanyProfile } from '@/features/onboarding';
import { useErrorToast } from '@/shared/hooks/useErrorToast';

export default function Subscription() {
  const { company, error: companyError } = useCompanyProfile();
  const { plans, subscription, subscribe, getCurrentPlan, isSubscribed, error: subscriptionError } = useSubscription(company?.id);
  const { toast } = useToast();
  useErrorToast(companyError, 'Gagal memuat perusahaan');
  useErrorToast(subscriptionError, 'Gagal memuat langganan');
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);

  const currentPlan = getCurrentPlan();

  const handleSubscribe = async (planId: string) => {
    if (!company?.id) {
      toast({
        title: 'Perusahaan belum ada',
        description: 'Selesaikan onboarding perusahaan terlebih dahulu.',
        variant: 'destructive',
      });
      return;
    }
    await subscribe(planId);
    toast({
      title: 'Berlangganan Berhasil',
      description: `Anda sekarang berlangganan paket ${plans.find(p => p.id === planId)?.name}`,
    });
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const getPlanIcon = (planId: string) => {
    switch (planId) {
      case 'premium':
        return Crown;
      case 'professional':
        return Sparkles;
      default:
        return Building2;
    }
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-foreground mb-2">Pilih Paket Langganan</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Pilih paket yang sesuai dengan kebutuhan bisnis Anda. Semua paket termasuk akses penuh ke fitur pencatatan transaksi.
          </p>
        </div>

        {isSubscribed() && currentPlan && (
          <Card className="border-primary/50 bg-primary/5">
            <CardContent className="py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Check className="h-5 w-5 text-primary" />
                  <span>Anda saat ini berlangganan paket <strong>{currentPlan.name}</strong></span>
                </div>
                <Badge variant="default">Aktif</Badge>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid md:grid-cols-3 gap-6">
          {plans.map((plan) => {
            const Icon = getPlanIcon(plan.id);
            const isCurrentPlan = currentPlan?.id === plan.id;
            
            return (
              <Card 
                key={plan.id} 
                className={`relative ${plan.recommended ? 'border-primary shadow-lg' : ''} ${isCurrentPlan ? 'ring-2 ring-primary' : ''}`}
              >
                {plan.recommended && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-primary text-primary-foreground">Direkomendasikan</Badge>
                  </div>
                )}
                <CardHeader className="text-center pb-2">
                  <div className="mx-auto mb-3 p-3 rounded-full bg-primary/10 w-fit">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="text-xl">{plan.name}</CardTitle>
                  <CardDescription>
                    <span className="text-3xl font-bold text-foreground">{formatPrice(plan.price)}</span>
                    <span className="text-muted-foreground"> / bulan</span>
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ul className="space-y-2">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-start gap-2 text-sm">
                        <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button 
                    className="w-full" 
                    variant={plan.recommended ? 'default' : 'outline'}
                    disabled={isCurrentPlan}
                    onClick={() => handleSubscribe(plan.id)}
                  >
                    {isCurrentPlan ? 'Paket Saat Ini' : 'Pilih Paket'}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </MainLayout>
  );
}
