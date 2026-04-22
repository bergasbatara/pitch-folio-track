export type PlanTier = "business" | "professional" | "premium";

export const PLAN_RANK: Record<PlanTier, number> = {
  business: 1,
  professional: 2,
  premium: 3,
};

export function parsePlanTier(planId: string | null | undefined): PlanTier | null {
  const v = String(planId ?? "").trim().toLowerCase();
  if (v === "business" || v === "professional" || v === "premium") return v;
  return null;
}

export function planSatisfies(current: PlanTier | null, required: PlanTier): boolean {
  if (!current) return false;
  return PLAN_RANK[current] >= PLAN_RANK[required];
}

