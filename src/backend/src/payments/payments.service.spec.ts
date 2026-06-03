import { BadGatewayException, BadRequestException } from "@nestjs/common";
import { PaymentsService } from "./payments.service";

describe("PaymentsService", () => {
  const makeService = () => {
    const prisma = {
      companyMember: {
        findUnique: jest.fn(),
      },
      plan: {
        findUnique: jest.fn(),
      },
      user: {
        findUnique: jest.fn(),
      },
      subscription: {
        upsert: jest.fn(),
      },
    };
    const midtrans = {
      chargeCard: jest.fn(),
      chargeQris: jest.fn(),
      chargeGopay: jest.fn(),
      getStatus: jest.fn(),
    };
    const config = {
      get: jest.fn((key: string) => {
        if (key === "FRONTEND_URL") return "http://localhost:8080";
        return undefined;
      }),
    };
    const service = new PaymentsService(prisma as any, midtrans as any, config as any);
    return { service, prisma, midtrans, config };
  };

  it("rejects card charges when amount does not match the plan price", async () => {
    const { service, prisma } = makeService();
    prisma.companyMember.findUnique.mockResolvedValue({ role: "owner" });
    prisma.plan.findUnique.mockResolvedValue({ id: "professional", price: 499000 });

    await expect(
      service.chargeCard("user-1", "company-1", {
        tokenId: "token",
        orderId: "SUB-company-professional-1",
        grossAmount: 1,
        planId: "professional",
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it("activates a subscription when a card charge is captured", async () => {
    const { service, prisma, midtrans } = makeService();
    prisma.companyMember.findUnique.mockResolvedValue({ role: "owner" });
    prisma.plan.findUnique.mockResolvedValue({ id: "professional", price: 499000, period: "monthly" });
    prisma.user.findUnique.mockResolvedValue({ id: "user-1", name: "Test", email: "test@example.com" });
    midtrans.chargeCard.mockResolvedValue({
      status_code: "200",
      status_message: "Success, Credit Card transaction is successful",
      transaction_status: "capture",
      order_id: "SUB-company-1",
      fraud_status: "accept",
    });

    const result = await service.chargeCard("user-1", "company-1", {
      tokenId: "token",
      orderId: "SUB-company-1",
      grossAmount: 499000,
      planId: "professional",
    });

    expect(result.statusMessage).toContain("successful");
    expect(prisma.subscription.upsert).toHaveBeenCalled();
  });

  it("wraps Midtrans failures as bad gateway errors", async () => {
    const { service, prisma, midtrans } = makeService();
    prisma.companyMember.findUnique.mockResolvedValue({ role: "owner" });
    prisma.plan.findUnique.mockResolvedValue({ id: "professional", price: 499000, period: "monthly" });
    prisma.user.findUnique.mockResolvedValue({ id: "user-1" });
    midtrans.chargeQris.mockRejectedValue(new Error("Midtrans QRIS down"));

    await expect(
      service.chargeQris("user-1", "company-1", {
        orderId: "SUB-company-professional-123",
        grossAmount: 499000,
        planId: "professional",
      }),
    ).rejects.toBeInstanceOf(BadGatewayException);
  });
});
