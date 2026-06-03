import { BadRequestException, NotFoundException } from "@nestjs/common";
import { PurchasesService } from "./purchases.service";

describe("PurchasesService", () => {
  const makeService = () => {
    const prisma = {
      companyMember: {
        findUnique: jest.fn(),
      },
      $transaction: jest.fn(),
    };
    const service = new PurchasesService(prisma as any);
    return { service, prisma };
  };

  it("creates a purchase, increases stock, and posts a journal", async () => {
    const { service, prisma } = makeService();
    prisma.companyMember.findUnique.mockResolvedValue({ role: "owner" });
    prisma.$transaction.mockImplementation(async (callback: any) =>
      callback({
        purchaseCategory: {
          findFirst: jest.fn(),
          upsert: jest.fn().mockResolvedValue({ id: "cat-1", name: "Umum" }),
        },
        product: {
          findFirst: jest.fn().mockResolvedValue({ id: "product-1", name: "Paracetamol", code: "OB001", stock: 10 }),
          update: jest.fn().mockResolvedValue({}),
        },
        purchase: {
          create: jest.fn().mockResolvedValue({
            id: "purchase-1",
            totalCost: 36000000,
            date: new Date("2026-01-03T00:00:00.000Z"),
            category: { name: "Umum" },
            product: { name: "Paracetamol", code: "OB001" },
          }),
        },
        account: {
          findMany: jest.fn().mockResolvedValue([]),
          createMany: jest.fn().mockResolvedValue({ count: 2 }),
          findFirst: jest
            .fn()
            .mockResolvedValueOnce({ id: "cash", code: "1001" })
            .mockResolvedValueOnce({ id: "purchases", code: "5001" }),
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

    const result = await service.createPurchase("user-1", "company-1", {
      productId: "product-1",
      quantity: 2000,
      unitCost: 18000,
      itemName: "Paracetamol 500mg",
      date: new Date("2026-01-03T00:00:00.000Z"),
    } as any);

    expect(result.productName).toBe("Paracetamol");
    expect(result.categoryName).toBe("Umum");
  });

  it("throws when a referenced product code is missing", async () => {
    const { service, prisma } = makeService();
    prisma.companyMember.findUnique.mockResolvedValue({ role: "owner" });
    prisma.$transaction.mockImplementation(async (callback: any) =>
      callback({
        purchaseCategory: {
          findFirst: jest.fn(),
          upsert: jest.fn().mockResolvedValue({ id: "cat-1", name: "Umum" }),
        },
        product: {
          findFirst: jest.fn().mockResolvedValue(null),
        },
      }),
    );

    await expect(
      service.createPurchase("user-1", "company-1", {
        productCode: "MISSING",
        quantity: 1,
        unitCost: 1000,
        itemName: "Item",
      } as any),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it("rejects deleting a purchase when reversing stock would go negative", async () => {
    const { service, prisma } = makeService();
    prisma.companyMember.findUnique.mockResolvedValue({ role: "owner" });
    prisma.$transaction.mockImplementation(async (callback: any) =>
      callback({
        purchase: {
          findFirst: jest.fn().mockResolvedValue({
            id: "purchase-1",
            productId: "product-1",
            quantity: 10,
          }),
        },
        product: {
          findFirst: jest.fn().mockResolvedValue({ id: "product-1", stock: 5 }),
        },
      }),
    );

    await expect(service.deletePurchase("user-1", "company-1", "purchase-1")).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });
});
