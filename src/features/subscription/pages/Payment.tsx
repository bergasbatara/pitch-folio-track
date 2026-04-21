import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, CreditCard, Lock, ShieldCheck, Loader2 } from 'lucide-react';
import { useSubscription } from '../hooks/useSubscription';
import { useCompanyProfile } from '@/features/onboarding';
import { useToast } from '@/components/ui/use-toast';
import { withCsrf } from '@/shared/lib/csrf';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';
const MIDTRANS_CLIENT_KEY = import.meta.env.VITE_MIDTRANS_CLIENT_KEY ?? '';
const MIDTRANS_ENV = import.meta.env.VITE_MIDTRANS_ENV ?? 'sandbox';

declare global {
  interface Window {
    MidtransNew3ds: {
      getCardToken: (
        cardData: {
          card_number: string;
          card_exp_month: string;
          card_exp_year: string;
          card_cvv: string;
        },
        options: {
          onSuccess: (response: { token_id: string; hash: string }) => void;
          onFailure: (response: { status_code: string; status_message: string; validation_messages?: string[] }) => void;
        }
      ) => void;
      authenticate: (
        redirectUrl: string,
        options: {
          performAuthentication: (url: string) => void;
          onSuccess: (response: { transaction_status: string }) => void;
          onFailure: (response: { transaction_status: string }) => void;
          onPending: (response: { transaction_status: string }) => void;
        }
      ) => void;
    };
  }
}

export default function Payment() {
  const [searchParams] = useSearchParams();
  const planId = searchParams.get('plan');
  const navigate = useNavigate();
  const { toast } = useToast();
  const { company } = useCompanyProfile();
  const { plans } = useSubscription(company?.id);
  const iframeModalRef = useRef<HTMLDivElement>(null);

  const selectedPlan = plans.find((p) => p.id === planId);

  const [cardNumber, setCardNumber] = useState('');
  const [cardName, setCardName] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [midtransReady, setMidtransReady] = useState(false);
  const [show3DS, setShow3DS] = useState(false);

  // Load Midtrans JS
  useEffect(() => {
    const existing = document.getElementById('midtrans-script');
    if (existing) {
      // Only mark ready if the global is actually available. Script tags can exist even if load failed.
      setMidtransReady(typeof window.MidtransNew3ds?.getCardToken === 'function');
      return;
    }
    const script = document.createElement('script');
    script.id = 'midtrans-script';
    // Sandbox uses a different host. The data-environment attribute alone isn't always enough.
    script.src =
      MIDTRANS_ENV === 'production'
        ? 'https://api.midtrans.com/v2/assets/js/midtrans-new-3ds.min.js'
        : 'https://api.sandbox.midtrans.com/v2/assets/js/midtrans-new-3ds.min.js';
    script.setAttribute('data-environment', MIDTRANS_ENV);
    script.setAttribute('data-client-key', MIDTRANS_CLIENT_KEY);
    script.onload = () => setMidtransReady(typeof window.MidtransNew3ds?.getCardToken === 'function');
    script.onerror = () => setMidtransReady(false);
    document.head.appendChild(script);
  }, []);

  const formatCardNumber = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 16);
    return digits.replace(/(\d{4})(?=\d)/g, '$1 ');
  };

  const formatExpiry = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 4);
    if (digits.length > 2) {
      return `${digits.slice(0, 2)}/${digits.slice(2)}`;
    }
    return digits;
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const isFormValid = () => {
    return (
      cardNumber.replace(/\s/g, '').length === 16 &&
      cardName.trim().length > 0 &&
      expiry.length === 5 &&
      cvv.length >= 3 &&
      midtransReady
    );
  };

  const chargeOnBackend = useCallback(async (tokenId: string) => {
    if (!company?.id || !selectedPlan) return;

    const orderId = `SUB-${company.id.slice(0, 8)}-${Date.now()}`;

    const response = await fetch(`${API_URL}/companies/${company.id}/payments/charge`, {
      ...withCsrf({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tokenId,
          orderId,
          grossAmount: selectedPlan.price,
          planId: selectedPlan.id,
        }),
      }),
      credentials: 'include',
    });

    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      throw new Error((body as { message?: string }).message ?? 'Charge failed');
    }

    return response.json() as Promise<{
      statusCode: string;
      transactionStatus: string;
      redirectUrl?: string;
      orderId: string;
      fraudStatus?: string;
    }>;
  }, [company?.id, selectedPlan]);

  const handle3DS = useCallback((redirectUrl: string) => {
    setShow3DS(true);

    window.MidtransNew3ds.authenticate(redirectUrl, {
      performAuthentication: (url: string) => {
        // Open 3DS page in iframe
        if (iframeModalRef.current) {
          iframeModalRef.current.innerHTML = `<iframe frameborder="0" style="height:90vh; width:100%;" src="${url}"></iframe>`;
        }
      },
      onSuccess: () => {
        setShow3DS(false);
        toast({
          title: 'Pembayaran Berhasil',
          description: `Anda sekarang berlangganan paket ${selectedPlan?.name}.`,
        });
        navigate('/langganan');
      },
      onFailure: () => {
        setShow3DS(false);
        toast({
          title: 'Pembayaran Gagal',
          description: 'Autentikasi 3D Secure gagal. Silakan coba lagi.',
          variant: 'destructive',
        });
      },
      onPending: () => {
        setShow3DS(false);
        toast({
          title: 'Pembayaran Pending',
          description: 'Pembayaran Anda sedang diproses. Kami akan mengonfirmasi segera.',
        });
        navigate('/langganan');
      },
    });
  }, [navigate, toast, selectedPlan]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlan || !isFormValid() || !midtransReady) return;
    if (!MIDTRANS_CLIENT_KEY) {
      toast({
        title: 'Konfigurasi Midtrans belum lengkap',
        description: 'VITE_MIDTRANS_CLIENT_KEY belum di-set.',
        variant: 'destructive',
      });
      return;
    }
    if (typeof window.MidtransNew3ds?.getCardToken !== 'function') {
      toast({
        title: 'Midtrans belum siap',
        description: 'Midtrans JS belum ter-load dengan benar. Coba refresh halaman.',
        variant: 'destructive',
      });
      return;
    }

    setIsProcessing(true);

    const [expMonth, expYear] = expiry.split('/');

    try {
      // Step 1: Get card token from Midtrans JS
      const tokenId = await new Promise<string>((resolve, reject) => {
        window.MidtransNew3ds.getCardToken(
          {
            card_number: cardNumber.replace(/\s/g, ''),
            card_exp_month: expMonth,
            card_exp_year: `20${expYear}`,
            card_cvv: cvv,
          },
          {
            onSuccess: (response) => resolve(response.token_id),
            onFailure: (response) => reject(new Error(response.status_message || 'Gagal mendapatkan token kartu')),
          }
        );
      });

      // Step 2: Send token to backend for charge
      const result = await chargeOnBackend(tokenId);

      if (!result) throw new Error('No response from server');

      if (result.statusCode === '200' && result.transactionStatus === 'capture') {
        // Direct success (non-3DS)
        toast({
          title: 'Pembayaran Berhasil',
          description: `Anda sekarang berlangganan paket ${selectedPlan.name}.`,
        });
        navigate('/langganan');
      } else if (result.redirectUrl) {
        // Needs 3DS authentication
        handle3DS(result.redirectUrl);
      } else {
        throw new Error(`Payment failed: ${result.transactionStatus}`);
      }
    } catch (err) {
      toast({
        title: 'Pembayaran Gagal',
        description: err instanceof Error ? err.message : 'Terjadi kesalahan. Silakan coba lagi.',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  if (!planId || (!selectedPlan && plans.length > 0)) {
    return (
      <MainLayout>
        <div className="flex flex-col items-center justify-center py-20">
          <p className="text-muted-foreground mb-4">Paket tidak ditemukan.</p>
          <Button variant="outline" onClick={() => navigate('/langganan')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Kembali ke Langganan
          </Button>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* 3DS Modal */}
        {show3DS && (
          <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
            <div className="bg-background rounded-lg w-full max-w-lg overflow-hidden shadow-xl">
              <div className="p-4 border-b flex items-center justify-between">
                <h3 className="font-semibold">Verifikasi Keamanan</h3>
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              </div>
              <div ref={iframeModalRef} className="min-h-[400px]" />
            </div>
          </div>
        )}

        {/* Header */}
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/langganan')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Pembayaran</h1>
            <p className="text-sm text-muted-foreground">Selesaikan pembayaran untuk mengaktifkan paket Anda</p>
          </div>
        </div>

        <div className="grid md:grid-cols-5 gap-6">
          {/* Payment Form */}
          <div className="md:col-span-3">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <CreditCard className="h-5 w-5" />
                  Informasi Kartu
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Card Number */}
                  <div className="space-y-2">
                    <Label htmlFor="cardNumber">Nomor Kartu</Label>
                    <div className="relative">
                      <Input
                        id="cardNumber"
                        placeholder="1234 5678 9012 3456"
                        value={cardNumber}
                        onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                        maxLength={19}
                        className="pl-10"
                        disabled={isProcessing}
                      />
                      <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>

                  {/* Card Name */}
                  <div className="space-y-2">
                    <Label htmlFor="cardName">Nama Pemegang Kartu</Label>
                    <Input
                      id="cardName"
                      placeholder="Nama sesuai kartu"
                      value={cardName}
                      onChange={(e) => setCardName(e.target.value)}
                      disabled={isProcessing}
                    />
                  </div>

                  {/* Expiry & CVV */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="expiry">Masa Berlaku</Label>
                      <Input
                        id="expiry"
                        placeholder="MM/YY"
                        value={expiry}
                        onChange={(e) => setExpiry(formatExpiry(e.target.value))}
                        maxLength={5}
                        disabled={isProcessing}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="cvv">CVV</Label>
                      <Input
                        id="cvv"
                        placeholder="123"
                        type="password"
                        value={cvv}
                        onChange={(e) => setCvv(e.target.value.replace(/\D/g, '').slice(0, 4))}
                        maxLength={4}
                        disabled={isProcessing}
                      />
                    </div>
                  </div>

                  <Separator />

                  {/* Security Notice */}
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                    <ShieldCheck className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                    <div className="text-sm text-muted-foreground">
                      <p className="font-medium text-foreground">Pembayaran Aman</p>
                      <p>Data kartu Anda dienkripsi oleh Midtrans dan tidak pernah menyentuh server kami.</p>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className="w-full"
                    size="lg"
                    disabled={!isFormValid() || isProcessing}
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Memproses...
                      </>
                    ) : (
                      <>
                        <Lock className="h-4 w-4 mr-2" />
                        Bayar {selectedPlan ? formatPrice(selectedPlan.price) : ''}
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Order Summary */}
          <div className="md:col-span-2">
            <Card className="sticky top-6">
              <CardHeader>
                <CardTitle className="text-lg">Ringkasan Pesanan</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {selectedPlan && (
                  <>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold">{selectedPlan.name}</p>
                        <Badge variant="secondary" className="mt-1">Bulanan</Badge>
                      </div>
                      <p className="font-semibold">{formatPrice(selectedPlan.price)}</p>
                    </div>

                    <Separator />

                    <ul className="space-y-2">
                      {selectedPlan.features.map((feature, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                          <span className="text-primary mt-0.5">✓</span>
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>

                    <Separator />

                    <div className="flex items-center justify-between font-bold text-lg">
                      <span>Total</span>
                      <span>{formatPrice(selectedPlan.price)}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Ditagih setiap bulan. Anda dapat membatalkan kapan saja.
                    </p>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
