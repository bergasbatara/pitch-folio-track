import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, CreditCard, Lock, ShieldCheck } from 'lucide-react';
import { useSubscription } from '../hooks/useSubscription';
import { useCompanyProfile } from '@/features/onboarding';
import { useToast } from '@/components/ui/use-toast';

export default function Payment() {
  const [searchParams] = useSearchParams();
  const planId = searchParams.get('plan');
  const navigate = useNavigate();
  const { toast } = useToast();
  const { company } = useCompanyProfile();
  const { plans, subscribe, isMutating } = useSubscription(company?.id);

  const selectedPlan = plans.find((p) => p.id === planId);

  const [cardNumber, setCardNumber] = useState('');
  const [cardName, setCardName] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

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
      cvv.length >= 3
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlan || !isFormValid()) return;

    setIsProcessing(true);
    try {
      await subscribe(selectedPlan.id);
      toast({
        title: 'Pembayaran Berhasil',
        description: `Anda sekarang berlangganan paket ${selectedPlan.name}.`,
      });
      navigate('/langganan');
    } catch {
      toast({
        title: 'Pembayaran Gagal',
        description: 'Terjadi kesalahan saat memproses pembayaran. Silakan coba lagi.',
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
                      />
                    </div>
                  </div>

                  <Separator />

                  {/* Security Notice */}
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                    <ShieldCheck className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                    <div className="text-sm text-muted-foreground">
                      <p className="font-medium text-foreground">Pembayaran Aman</p>
                      <p>Data kartu Anda dienkripsi dan diproses secara aman. Kami tidak menyimpan informasi kartu Anda.</p>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className="w-full"
                    size="lg"
                    disabled={!isFormValid() || isProcessing || isMutating}
                  >
                    <Lock className="h-4 w-4 mr-2" />
                    {isProcessing ? 'Memproses...' : `Bayar ${selectedPlan ? formatPrice(selectedPlan.price) : ''}`}
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
