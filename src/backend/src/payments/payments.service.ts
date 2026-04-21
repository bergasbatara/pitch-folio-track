import {
  BadGatewayException,
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { MidtransService } from "./midtrans.service";
import { ChargeCardDto } from "./dto/charge-card.dto";

@Injectable()
export class PaymentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly midtrans: MidtransService,
  ) {}

  async chargeCard(userId: string, companyId: string, dto: ChargeCardDto) {
    const membership = await this.assertOwner(userId, companyId);

    // Verify plan exists
    const plan = await this.prisma.plan.findUnique({ where: { id: dto.planId } });
    if (!plan) throw new NotFoundException("Plan not found");

    // Verify amount matches plan price
    if (dto.grossAmount !== plan.price) {
      throw new BadRequestException("Amount does not match plan price");
    }

    // Get user info for customer_details
    const user = await this.prisma.user.findUnique({ where: { id: userId } });

    // Call Midtrans Charge API
    let chargeResult: Awaited<ReturnType<MidtransService["chargeCard"]>>;
    try {
      chargeResult = await this.midtrans.chargeCard({
        tokenId: dto.tokenId,
        orderId: dto.orderId,
        grossAmount: dto.grossAmount,
        customerName: user?.name ?? undefined,
        customerEmail: user?.email ?? undefined,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Midtrans charge failed";
      // Midtrans failures are external dependency failures from our point of view.
      throw new BadGatewayException(msg);
    }

    const statusCode = chargeResult.status_code;

    // 200 = captured (non-3DS success), 201 = pending/needs 3DS
    if (statusCode === "200" && chargeResult.transaction_status === "capture") {
      // Payment success — activate subscription
      await this.activateSubscription(companyId, plan.id, plan.period);
    }

    return {
      statusCode,
      transactionStatus: chargeResult.transaction_status,
      redirectUrl: chargeResult.redirect_url,
      orderId: chargeResult.order_id,
      fraudStatus: chargeResult.fraud_status,
    };
  }

  async getPaymentStatus(userId: string, companyId: string, orderId: string) {
    await this.assertMember(userId, companyId);
    let result: Awaited<ReturnType<MidtransService["getStatus"]>>;
    try {
      result = await this.midtrans.getStatus(orderId);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Midtrans status failed";
      throw new BadGatewayException(msg);
    }

    // If capture + accept, activate subscription
    if (
      result.transaction_status === "capture" &&
      result.fraud_status === "accept"
    ) {
      // Find what plan this order was for — extract from existing subscription or rely on the caller
      const sub = await this.prisma.subscription.findUnique({
        where: { companyId },
        include: { plan: true },
      });
      if (sub) {
        await this.activateSubscription(companyId, sub.planId, sub.plan.period);
      }
    }

    return {
      statusCode: result.status_code,
      transactionStatus: result.transaction_status,
      orderId: result.order_id,
      fraudStatus: result.fraud_status,
    };
  }

  private async activateSubscription(companyId: string, planId: string, period: string) {
    const startsAt = new Date();
    const endsAt = new Date(startsAt);
    if (period === "yearly") {
      endsAt.setFullYear(endsAt.getFullYear() + 1);
    } else {
      endsAt.setMonth(endsAt.getMonth() + 1);
    }

    await this.prisma.subscription.upsert({
      where: { companyId },
      create: { companyId, planId, status: "active", startsAt, endsAt },
      update: { planId, status: "active", startsAt, endsAt },
    });
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

  private async assertMember(userId: string, companyId: string) {
    const membership = await this.prisma.companyMember.findUnique({
      where: { userId_companyId: { userId, companyId } },
    });
    if (!membership) {
      throw new ForbiddenException("Not a member of this company");
    }
    return membership;
  }
}
