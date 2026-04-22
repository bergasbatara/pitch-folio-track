import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Sparkles } from 'lucide-react';

interface FeaturePlaceholderProps {
  title: string;
  description: string;
}

export function FeaturePlaceholder({ title, description }: FeaturePlaceholderProps) {
  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">{title}</h1>
          <p className="text-muted-foreground mt-1">{description}</p>
        </div>
        <Card>
          <CardContent className="py-16 text-center space-y-3">
            <div className="mx-auto h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center">
              <Sparkles className="h-7 w-7 text-primary" />
            </div>
            <h2 className="text-xl font-semibold">Segera Hadir</h2>
            <p className="text-muted-foreground max-w-md mx-auto">
              Fitur ini sedang dalam pengembangan dan akan tersedia untuk paket langganan Anda.
            </p>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
