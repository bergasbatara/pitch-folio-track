import { ForbiddenException } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { PlanGuard } from "./plan.guard";

describe("PlanGuard", () => {
  const makeContext = (companyId?: string) =>
    ({
      getHandler: jest.fn(),
      getClass: jest.fn(),
      switchToHttp: () => ({
        getRequest: () => ({
          params: companyId ? { companyId } : {},
        }),
      }),
    }) as any;

  const makeGuard = (required: "business" | "professional" | "premium" | undefined) => {
    const reflector = {
      getAllAndOverride: jest.fn().mockReturnValue(required),
    };
    const prisma = {
      subscription: {
        findUnique: jest.fn(),
      },
    };
    const guard = new PlanGuard(reflector as unknown as Reflector, prisma as any);
    return { guard, reflector, prisma };
  };

  it("allows access when the active plan satisfies the requirement", async () => {
    const { guard, prisma } = makeGuard("business");
    prisma.subscription.findUnique.mockResolvedValue({
      status: "active",
      planId: "professional",
      endsAt: new Date(Date.now() + 60_000),
    });

    await expect(guard.canActivate(makeContext("company-1"))).resolves.toBe(true);
  });

  it("rejects access when the subscription is expired", async () => {
    const { guard, prisma } = makeGuard("professional");
    prisma.subscription.findUnique.mockResolvedValue({
      status: "active",
      planId: "professional",
      endsAt: new Date(Date.now() - 60_000),
    });

    await expect(guard.canActivate(makeContext("company-1"))).rejects.toThrow(
      new ForbiddenException("Plan required: professional"),
    );
  });

  it("ignores routes without a companyId param", async () => {
    const { guard, prisma } = makeGuard("professional");

    await expect(guard.canActivate(makeContext())).resolves.toBe(true);
    expect(prisma.subscription.findUnique).not.toHaveBeenCalled();
  });
});
