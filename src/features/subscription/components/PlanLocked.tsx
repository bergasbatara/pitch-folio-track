import { useNavigate } from 'react-router-dom';
import { Lock, Crown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PLAN_LABEL, PlanTier } from '../planAccess';

interface PlanLockedProps {
  requiredTier: PlanTier;
  featureName?: string;
}

export function PlanLocked({ requiredTier, featureName }: PlanLockedProps) {
  const navigate = useNavigate();

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-6">
      <Card className="max-w-lg w-full border-primary/30">
        <CardContent className="py-10 px-6 text-center space-y-5">
          <div className="mx-auto h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
            <Lock className="h-8 w-8 text-primary" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-foreground">Halaman Terkunci</h2>
            <p className="text-muted-foreground">
              {featureName ? <>Fitur <strong>{featureName}</strong> hanya tersedia</> : 'Halaman ini hanya tersedia'}
              {' '}untuk pelanggan paket berikut atau lebih tinggi:
            </p>
          </div>
          <div className="flex justify-center">
            <Badge className="bg-primary text-primary-foreground gap-1.5 px-3 py-1.5 text-sm">
              <Crown className="h-3.5 w-3.5" />
              {PLAN_LABEL[requiredTier]}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Tingkatkan langganan Anda untuk membuka akses ke fitur ini dan fitur premium lainnya.
          </p>
          <div className="flex flex-col sm:flex-row gap-2 justify-center pt-2">
            <Button onClick={() => navigate('/langganan')} className="gap-2">
              <Crown className="h-4 w-4" />
              Lihat Paket Langganan
            </Button>
            <Button variant="outline" onClick={() => navigate(-1)}>
              Kembali
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
