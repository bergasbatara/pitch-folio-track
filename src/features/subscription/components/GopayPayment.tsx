import { useCallback, useEffect, useRef, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Button } from '@/components/ui/button';
import { Loader2, Smartphone, ExternalLink, RefreshCw } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { withCsrf } from '@/shared/lib/csrf';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

interface Props {
  companyId: string;
  planId: string;
  planName: string;
  grossAmount: number;
  onSuccess: () => void;
}

interface GopayChargeResponse {
  statusCode: string;
  transactionStatus: string;
  orderId: string;
  deeplinkUrl?: string;
  qrUrl?: string;
  expiryTime?: string;
}

export function GopayPayment({ companyId, planId, planName, grossAmount, onSuccess }: Props) {
  const { toast } = useToast();
  const [isCharging, setIsCharging] = useState(false);
  const [data, setData] = useState<GopayChargeResponse | null>(null);
  const [polling, setPolling] = useState(false);
  const pollRef = useRef<number | null>(null);

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      window.clearInterval(pollRef.current);
      pollRef.current = null;
    }
    setPolling(false);
  }, []);

  useEffect(() => () => stopPolling(), [stopPolling]);

  const startCharge = async () => {
    setIsCharging(true);
    try {
      const orderId = `SUB-${companyId.slice(0, 8)}-${planId}-${Date.now()}`;
      const res = await fetch(`${API_URL}/companies/${companyId}/payments/charge/gopay`, {
        ...withCsrf({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            orderId,
            grossAmount,
            planId,
            callbackUrl: `${window.location.origin}/langganan`,
          }),
        }),
        credentials: 'include',
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error((body as { message?: string }).message ?? 'GoPay charge gagal');
      }
      const result = (await res.json()) as GopayChargeResponse;
      setData(result);
      startPolling(result.orderId);
    } catch (err) {
      toast({
        title: 'Gagal membuat pembayaran GoPay',
        description: err instanceof Error ? err.message : 'Terjadi kesalahan.',
        variant: 'destructive',
      });
    } finally {
      setIsCharging(false);
    }
  };

  const startPolling = (orderId: string) => {
    stopPolling();
    setPolling(true);
    const deadline = Date.now() + 10 * 60_000;
    const tick = async () => {
      try {
        const res = await fetch(`${API_URL}/companies/${companyId}/payments/status/${orderId}`, {
          credentials: 'include',
        });
        if (!res.ok) return;
        const body = (await res.json()) as { transactionStatus?: string };
        const tx = body.transactionStatus;
        if (tx === 'settlement' || tx === 'capture') {
          stopPolling();
          toast({ title: 'Pembayaran Berhasil', description: `Paket ${planName} aktif.` });
          onSuccess();
        } else if (tx === 'expire' || tx === 'cancel' || tx === 'deny') {
          stopPolling();
          toast({
            title: 'Pembayaran Gagal',
            description: `Status: ${tx}`,
            variant: 'destructive',
          });
        }
      } catch {
        // ignore
      }
      if (Date.now() > deadline) {
        stopPolling();
        toast({
          title: 'Pembayaran kedaluwarsa',
          description: 'Silakan coba lagi.',
        });
      }
    };
    pollRef.current = window.setInterval(tick, 3000);
  };

  if (!data) {
    return (
      <div className="space-y-4">
        <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
          <Smartphone className="h-5 w-5 text-primary mt-0.5 shrink-0" />
          <div className="text-sm text-muted-foreground">
            <p className="font-medium text-foreground">Bayar dengan GoPay</p>
            <p>Anda akan diarahkan ke aplikasi GoJek untuk menyelesaikan pembayaran.</p>
          </div>
        </div>
        <Button onClick={startCharge} disabled={isCharging} className="w-full" size="lg">
          {isCharging ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Memproses...
            </>
          ) : (
            <>
              <Smartphone className="h-4 w-4 mr-2" />
              Bayar dengan GoPay
            </>
          )}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col items-center gap-3 p-4 rounded-lg border bg-background">
        {data.qrUrl ? (
          <img src={data.qrUrl} alt="GoPay QR" width={240} height={240} />
        ) : data.deeplinkUrl ? (
          <QRCodeSVG value={data.deeplinkUrl} size={240} level="M" includeMargin />
        ) : null}
        <p className="text-sm text-center text-muted-foreground">
          Scan QR dari aplikasi GoJek, atau buka via tombol di bawah jika di HP.
        </p>
        {data.deeplinkUrl && (
          <Button asChild variant="default" className="w-full">
            <a href={data.deeplinkUrl} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-4 w-4 mr-2" />
              Buka aplikasi GoJek
            </a>
          </Button>
        )}
        {polling && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Menunggu pembayaran...
          </div>
        )}
      </div>
      <Button
        variant="outline"
        className="w-full"
        onClick={() => {
          stopPolling();
          setData(null);
        }}
      >
        <RefreshCw className="h-4 w-4 mr-2" />
        Coba lagi
      </Button>
    </div>
  );
}
