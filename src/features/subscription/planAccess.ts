// Centralised plan-tier configuration.
// Tier order (low → high): business < professional < premium.
// A plan grants access to its own routes plus all lower-tier routes.

export type PlanTier = 'business' | 'professional' | 'premium';

export const PLAN_RANK: Record<PlanTier, number> = {
  business: 1,
  professional: 2,
  premium: 3,
};

// Required tier for each protected route. Routes not listed are free for any
// authenticated user (e.g. /, /profile, /langganan, /pembayaran, /settings).
export const ROUTE_REQUIRED_TIER: Record<string, PlanTier> = {
  // ── Business tier ── Pencatatan transaksi & basic reporting
  '/sales': 'business',
  '/purchases': 'business',
  '/products': 'business',
  '/pelanggan': 'business',
  '/supplier': 'business',
  '/piutang': 'business',
  '/hutang': 'business',
  '/aset-tetap': 'business',
  '/pajak': 'business',
  '/akun': 'business',
  '/jurnal': 'business',
  '/laba-rugi': 'business',
  '/neraca': 'business',
  '/arus-kas': 'business',
  '/ekuitas': 'business',
  '/hpp': 'business',
  '/catatan-keuangan': 'business',

  // ── Professional tier ──
  '/audit-draft': 'professional',
  '/rasio-keuangan': 'professional',
  '/analisis-tren': 'professional',

  // ── Premium tier ──
  '/analisis-lanjutan': 'premium',
  '/modeling-proyeksi': 'premium',
  '/konsultasi': 'premium',
};

export const PLAN_LABEL: Record<PlanTier, string> = {
  business: 'Business',
  professional: 'Professional',
  premium: 'Premium',
};

export function planSatisfies(current: PlanTier | null, required: PlanTier): boolean {
  if (!current) return false;
  return PLAN_RANK[current] >= PLAN_RANK[required];
}

export function getRequiredTier(pathname: string): PlanTier | null {
  return ROUTE_REQUIRED_TIER[pathname] ?? null;
}
