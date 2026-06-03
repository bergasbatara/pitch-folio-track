import { BadRequestException, NotFoundException } from "@nestjs/common";
import { OpeningBalanceItemsService } from "./opening-balance-items.service";

describe("OpeningBalanceItemsService", () => {
  const makeService = () => {
    const prisma = {
      companyMember: {
        findUnique: jest.fn(),
      },
      openingBalanceItem: {
        findFirst: jest.fn(),
      },
      $transaction: jest.fn(),
    };
    const service = new OpeningBalanceItemsService(prisma as any);
    return { service, prisma };
  };

  it("creates an opening balance item and linked journal entry", async () => {
    const { service, prisma } = makeService();
    prisma.companyMember.findUnique.mockResolvedValue({ role: "owner" });
    prisma.$transaction.mockImplementation(async (callback: any) =>
      callback({
        openingBalanceItem: {
          create: jest.fn().mockResolvedValue({ id: "item-1" }),
          update: jest.fn().mockResolvedValue({ id: "item-1", journalEntryId: "entry-1" }),
        },
        account: {
          findFirst: jest
            .fn()
            .mockResolvedValueOnce({ id: "acc-liability", code: "2001", type: "liability" })
            .mockResolvedValueOnce({ id: "perantara", code: "3999", type: "equity" }),
          create: jest.fn(),
        },
        journalEntry: {
          create: jest.fn().mockResolvedValue({ id: "entry-1" }),
        },
        journalLine: {
          createMany: jest.fn().mockResolvedValue({ count: 2 }),
        },
      }),
    );

    const result = await service.create("user-1", "company-1", {
      kind: "liability",
      accountId: "acc-liability",
      amount: 90000000,
      asOfDate: new Date("2026-04-28T00:00:00.000Z"),
      memo: "Utang Usaha",
    } as any);

    expect(result).toEqual({ id: "item-1", journalEntryId: "entry-1" });
  });

  it("rejects mismatched account type for opening balance kind", async () => {
    const { service, prisma } = makeService();
    prisma.companyMember.findUnique.mockResolvedValue({ role: "owner" });
    prisma.$transaction.mockImplementation(async (callback: any) =>
      callback({
        account: {
          findFirst: jest.fn().mockResolvedValueOnce({ id: "acc-equity", code: "3001", type: "equity" }),
        },
      }),
    );

    await expect(
      service.create("user-1", "company-1", {
        kind: "liability",
        accountId: "acc-equity",
        amount: 1000,
      } as any),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it("throws when removing a missing item", async () => {
    const { service, prisma } = makeService();
    prisma.companyMember.findUnique.mockResolvedValue({ role: "owner" });
    prisma.openingBalanceItem.findFirst.mockResolvedValue(null);

    await expect(service.remove("user-1", "company-1", "missing")).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
