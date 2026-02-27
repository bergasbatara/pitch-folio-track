import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CreateSubscriptionDto } from "./dto/create-subscription.dto";
import { UpdateSubscriptionDto } from "./dto/update-subscription.dto";

@Injectable()
export class SubscriptionsService {
  constructor(private readonly prisma: PrismaService) {}

  async getCurrent(userId: string, companyId: string) {
    await this.assertMember(userId, companyId);
    return this.prisma.subscription.findUnique({
      where: { companyId },
      include: { plan: true },
    });
  }

  async subscribe(userId: string, companyId: string, dto: CreateSubscriptionDto) {
    await this.assertOwner(userId, companyId);
    const plan = await this.prisma.plan.findUnique({ where: { id: dto.planId } });
    if (!plan) {
      throw new NotFoundException("Plan not found");
    }
    const { startsAt, endsAt } = this.computePeriod(plan.period);
    return this.prisma.subscription.upsert({
      where: { companyId },
      create: {
        companyId,
        planId: plan.id,
        status: "active",
        startsAt,
        endsAt,
      },
      update: {
        planId: plan.id,
        status: "active",
        startsAt,
        endsAt,
      },
      include: { plan: true },
    });
  }

  async update(userId: string, companyId: string, dto: UpdateSubscriptionDto) {
    await this.assertOwner(userId, companyId);
    const existing = await this.prisma.subscription.findUnique({ where: { companyId } });
    if (!existing) {
      throw new NotFoundException("Subscription not found");
    }

    let nextPlanId = existing.planId;
    let startsAt = existing.startsAt;
    let endsAt = existing.endsAt;

    if (dto.planId && dto.planId !== existing.planId) {
      const plan = await this.prisma.plan.findUnique({ where: { id: dto.planId } });
      if (!plan) {
        throw new NotFoundException("Plan not found");
      }
      nextPlanId = plan.id;
      const period = this.computePeriod(plan.period);
      startsAt = period.startsAt;
      endsAt = period.endsAt;
    }

    if (dto.status === "cancelled") {
      endsAt = new Date();
    }

    return this.prisma.subscription.update({
      where: { companyId },
      data: {
        planId: nextPlanId,
        status: dto.status ?? existing.status,
        startsAt,
        endsAt,
      },
      include: { plan: true },
    });
  }

  private computePeriod(period: string) {
    const startsAt = new Date();
    const endsAt = new Date(startsAt);
    if (period === "yearly") {
      endsAt.setFullYear(endsAt.getFullYear() + 1);
    } else {
      endsAt.setMonth(endsAt.getMonth() + 1);
    }
    return { startsAt, endsAt };
  }

  private async assertMember(userId: string, companyId: string) {
    const membership = await this.prisma.companyMember.findUnique({
      where: { userId_companyId: { userId, companyId } },
    });
    if (!membership) {
      throw new ForbiddenException("Not a member of this company");
    }
    return membership;
  }

  private async assertOwner(userId: string, companyId: string) {
    const membership = await this.prisma.companyMember.findUnique({
      where: { userId_companyId: { userId, companyId } },
    });
    if (!membership || membership.role !== "owner") {
      throw new ForbiddenException("Owner role required");
    }
    return membership;
  }
}
