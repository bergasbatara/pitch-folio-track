import { useEffect, useRef } from 'react';
import { useToast } from '@/components/ui/use-toast';

export function useErrorToast(error: string | null, title = 'Gagal') {
  const { toast } = useToast();
  const lastErrorRef = useRef<string | null>(null);

  useEffect(() => {
    if (!error) {
      lastErrorRef.current = null;
      return;
    }
    if (lastErrorRef.current === error) return;
    lastErrorRef.current = error;
    toast({ title, description: error, variant: 'destructive' });
  }, [error, title, toast]);
}
