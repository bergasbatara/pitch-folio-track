import { BadRequestException, NotFoundException } from "@nestjs/common";
import { SalesService } from "./sales.service";

describe("SalesService", () => {
  const makeService = () => {
    const prisma = {
      companyMember: {
        findUnique: jest.fn(),
      },
      $transaction: jest.fn(),
    };
    const service = new SalesService(prisma as any);
    return { service, prisma };
  };

  it("creates a sale, reduces stock, and posts a journal", async () => {
    const { service, prisma } = makeService();
    prisma.companyMember.findUnique.mockResolvedValue({ role: "owner" });
    prisma.$transaction.mockImplementation(async (callback: any) =>
      callback({
        product: {
          findFirst: jest.fn().mockResolvedValue({ id: "product-1", name: "Vitamin C", stock: 100 }),
          update: jest.fn().mockResolvedValue({}),
        },
        sale: {
          create: jest.fn().mockResolvedValue({
            id: "sale-1",
            quantity: 5,
            pricePerUnit: 75000,
            totalPrice: 375000,
            soldAt: new Date("2026-01-12T00:00:00.000Z"),
          }),
        },
        account: {
          findMany: jest.fn().mockResolvedValue([]),
          createMany: jest.fn().mockResolvedValue({ count: 2 }),
          findFirst: jest
            .fn()
            .mockResolvedValueOnce({ id: "cash", code: "1001" })
            .mockResolvedValueOnce({ id: "revenue", code: "4001" }),
        },
        journalEntry: {
          findFirst: jest.fn().mockResolvedValue(null),
          create: jest.fn().mockResolvedValue({ id: "entry-1" }),
        },
        journalLine: {
          createMany: jest.fn().mockResolvedValue({ count: 2 }),
        },
      }),
    );

    const result = await service.createSale("user-1", "company-1", {
      productId: "product-1",
      quantity: 5,
      pricePerUnit: 75000,
      soldAt: new Date("2026-01-12T00:00:00.000Z"),
    } as any);

    expect(result.productName).toBe("Vitamin C");
  });

  it("rejects a sale when stock is insufficient", async () => {
    const { service, prisma } = makeService();
    prisma.companyMember.findUnique.mockResolvedValue({ role: "owner" });
    prisma.$transaction.mockImplementation(async (callback: any) =>
      callback({
        product: {
          findFirst: jest.fn().mockResolvedValue({ id: "product-1", stock: 1 }),
        },
      }),
    );

    await expect(
      service.createSale("user-1", "company-1", {
        productId: "product-1",
        quantity: 5,
        pricePerUnit: 75000,
      } as any),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it("throws when a requested product does not exist", async () => {
    const { service, prisma } = makeService();
    prisma.companyMember.findUnique.mockResolvedValue({ role: "owner" });
    prisma.$transaction.mockImplementation(async (callback: any) =>
      callback({
        product: {
          findFirst: jest.fn().mockResolvedValue(null),
        },
      }),
    );

    await expect(
      service.createSale("user-1", "company-1", {
        productId: "missing",
        quantity: 1,
        pricePerUnit: 75000,
      } as any),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
