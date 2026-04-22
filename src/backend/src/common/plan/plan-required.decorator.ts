import { SetMetadata } from "@nestjs/common";
import type { PlanTier } from "./plan-access";

export const PLAN_REQUIRED_KEY = "plan_required_tier";

export const PlanRequired = (tier: PlanTier) => SetMetadata(PLAN_REQUIRED_KEY, tier);

