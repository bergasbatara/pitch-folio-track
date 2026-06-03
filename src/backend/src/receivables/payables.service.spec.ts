import { BadRequestException, NotFoundException } from "@nestjs/common";
import { PayablesService } from "./payables.service";

describe("PayablesService", () => {
  const makeService = () => {
    const prisma = {
      companyMember: {
        findUnique: jest.fn(),
      },
      payable: {
        findFirst: jest.fn(),
      },
      $transaction: jest.fn(),
    };
    const service = new PayablesService(prisma as any);
    return { service, prisma };
  };

  it("creates a payable with partial status and journals", async () => {
    const { service, prisma } = makeService();
    prisma.companyMember.findUnique.mockResolvedValue({ role: "owner" });
    prisma.$transaction.mockImplementation(async (callback: any) =>
      callback({
        payable: {
          create: jest.fn().mockResolvedValue({
            id: "pay-1",
            amount: 64935000,
            paidAmount: 1000000,
            dueDate: new Date("2026-02-01T00:00:00.000Z"),
            status: "partial",
          }),
        },
        account: {
          findMany: jest.fn().mockResolvedValue([]),
          createMany: jest.fn().mockResolvedValue({ count: 4 }),
          findFirst: jest
            .fn()
            .mockResolvedValueOnce({ id: "purchases", code: "5001" })
            .mockResolvedValueOnce({ id: "ap", code: "2001" })
            .mockResolvedValueOnce({ id: "cash", code: "1001" })
            .mockResolvedValueOnce({ id: "ap", code: "2001" }),
        },
        journalEntry: {
          findFirst: jest.fn().mockResolvedValue(null),
          create: jest
            .fn()
            .mockResolvedValueOnce({ id: "entry-1" })
            .mockResolvedValueOnce({ id: "entry-2" }),
          delete: jest.fn(),
        },
        journalLine: {
          createMany: jest.fn().mockResolvedValue({ count: 2 }),
        },
      }),
    );

    const result = await service.createPayable("user-1", "company-1", {
      supplierName: "PT Farma Nusantara",
      description: "Pembelian kredit",
      amount: 64935000,
      paidAmount: 1000000,
      dueDate: new Date("2026-02-01T00:00:00.000Z"),
    } as any);

    expect(result.status).toBe("partial");
  });

  it("rejects paid amount larger than payable amount", async () => {
    const { service, prisma } = makeService();
    prisma.companyMember.findUnique.mockResolvedValue({ role: "owner" });

    await expect(
      service.createPayable("user-1", "company-1", {
        supplierName: "PT Farma Nusantara",
        description: "Invalid payable",
        amount: 1000,
        paidAmount: 2000,
        dueDate: new Date("2026-02-01T00:00:00.000Z"),
      } as any),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it("throws when deleting a missing payable", async () => {
    const { service, prisma } = makeService();
    prisma.companyMember.findUnique.mockResolvedValue({ role: "owner" });
    prisma.payable.findFirst.mockResolvedValue(null);

    await expect(service.deletePayable("user-1", "company-1", "missing")).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
