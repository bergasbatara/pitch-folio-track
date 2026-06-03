import { NotFoundException } from "@nestjs/common";
import { SubscriptionsService } from "./subscriptions.service";

describe("SubscriptionsService", () => {
  const fixedNow = new Date("2026-06-02T12:00:00.000Z");

  const makeService = () => {
    const prisma = {
      companyMember: {
        findUnique: jest.fn(),
      },
      plan: {
        findUnique: jest.fn(),
      },
      subscription: {
        findUnique: jest.fn(),
        upsert: jest.fn(),
        update: jest.fn(),
      },
    };
    const service = new SubscriptionsService(prisma as any);
    return { service, prisma };
  };

  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(fixedNow);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("creates an active monthly subscription", async () => {
    const { service, prisma } = makeService();
    prisma.companyMember.findUnique.mockResolvedValue({ role: "owner" });
    prisma.plan.findUnique.mockResolvedValue({ id: "professional", period: "monthly" });
    prisma.subscription.upsert.mockResolvedValue({ id: "sub-1" });

    await service.subscribe("user-1", "company-1", { planId: "professional" });

    expect(prisma.subscription.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({
          companyId: "company-1",
          planId: "professional",
          status: "active",
          startsAt: fixedNow,
          endsAt: new Date("2026-07-02T12:00:00.000Z"),
        }),
      }),
    );
  });

  it("throws when subscribing to a missing plan", async () => {
    const { service, prisma } = makeService();
    prisma.companyMember.findUnique.mockResolvedValue({ role: "owner" });
    prisma.plan.findUnique.mockResolvedValue(null);

    await expect(service.subscribe("user-1", "company-1", { planId: "missing" })).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it("marks a subscription as cancelled and ends it immediately", async () => {
    const { service, prisma } = makeService();
    prisma.companyMember.findUnique.mockResolvedValue({ role: "owner" });
    prisma.subscription.findUnique.mockResolvedValue({
      companyId: "company-1",
      planId: "business",
      status: "active",
      startsAt: new Date("2026-05-01T00:00:00.000Z"),
      endsAt: new Date("2026-06-30T00:00:00.000Z"),
    });
    prisma.subscription.update.mockResolvedValue({ id: "sub-1" });

    await service.update("user-1", "company-1", { status: "cancelled" });

    expect(prisma.subscription.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: "cancelled",
          endsAt: fixedNow,
        }),
      }),
    );
  });
});
