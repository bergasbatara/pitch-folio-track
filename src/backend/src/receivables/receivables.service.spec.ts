import { BadRequestException, NotFoundException } from "@nestjs/common";
import { ReceivablesService } from "./receivables.service";

describe("ReceivablesService", () => {
  const makeService = () => {
    const prisma = {
      companyMember: {
        findUnique: jest.fn(),
      },
      receivable: {
        findFirst: jest.fn(),
      },
      $transaction: jest.fn(),
    };
    const service = new ReceivablesService(prisma as any);
    return { service, prisma };
  };

  it("creates a receivable with pending status and journals", async () => {
    const { service, prisma } = makeService();
    prisma.companyMember.findUnique.mockResolvedValue({ role: "owner" });
    prisma.$transaction.mockImplementation(async (callback: any) =>
      callback({
        receivable: {
          create: jest.fn().mockResolvedValue({
            id: "rec-1",
            amount: 30000000,
            paidAmount: 0,
            dueDate: new Date("2026-07-01T00:00:00.000Z"),
            status: "pending",
          }),
        },
        account: {
          findMany: jest.fn().mockResolvedValue([]),
          createMany: jest.fn().mockResolvedValue({ count: 4 }),
          findFirst: jest
            .fn()
            .mockResolvedValueOnce({ id: "ar", code: "1101" })
            .mockResolvedValueOnce({ id: "rev", code: "4001" })
            .mockResolvedValueOnce({ id: "cash", code: "1001" })
            .mockResolvedValueOnce({ id: "ar", code: "1101" }),
        },
        journalEntry: {
          findFirst: jest.fn().mockResolvedValue(null),
          create: jest
            .fn()
            .mockResolvedValueOnce({ id: "entry-1" }),
          delete: jest.fn(),
        },
        journalLine: {
          createMany: jest.fn().mockResolvedValue({ count: 2 }),
        },
      }),
    );

    const result = await service.createReceivable("user-1", "company-1", {
      customerName: "PT Sehat Makmur",
      description: "Piutang Januari",
      amount: 30000000,
      dueDate: new Date("2026-07-01T00:00:00.000Z"),
    } as any);

    expect(result.status).toBe("pending");
  });

  it("rejects paid amount larger than receivable amount", async () => {
    const { service, prisma } = makeService();
    prisma.companyMember.findUnique.mockResolvedValue({ role: "owner" });

    await expect(
      service.createReceivable("user-1", "company-1", {
        customerName: "PT Sehat Makmur",
        description: "Invalid receivable",
        amount: 1000,
        paidAmount: 1500,
        dueDate: new Date("2026-07-01T00:00:00.000Z"),
      } as any),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it("throws when updating a missing receivable", async () => {
    const { service, prisma } = makeService();
    prisma.companyMember.findUnique.mockResolvedValue({ role: "owner" });
    prisma.receivable.findFirst.mockResolvedValue(null);

    await expect(
      service.updateReceivable("user-1", "company-1", "missing", {
        amount: 1000,
      } as any),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
