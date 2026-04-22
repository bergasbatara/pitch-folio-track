import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { PrismaService } from "../../prisma/prisma.service";
import { PLAN_REQUIRED_KEY } from "./plan-required.decorator";
import { parsePlanTier, planSatisfies, type PlanTier } from "./plan-access";

@Injectable()
export class PlanGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const required = this.reflector.getAllAndOverride<PlanTier | undefined>(PLAN_REQUIRED_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!required) return true;

    const req = context.switchToHttp().getRequest<{ params?: Record<string, string> }>();
    const companyId = req.params?.companyId;
    if (!companyId) {
      // Misconfigured guard usage (should only be used on routes with :companyId).
      return true;
    }

    const subscription = await this.prisma.subscription.findUnique({
      where: { companyId },
      select: { status: true, endsAt: true, planId: true },
    });

    const now = new Date();
    const active =
      subscription?.status === "active" && (!subscription.endsAt || subscription.endsAt > now);
    const currentTier = active ? parsePlanTier(subscription?.planId) : null;

    if (!planSatisfies(currentTier, required)) {
      throw new ForbiddenException(`Plan required: ${required}`);
    }

    return true;
  }
}

