import { BadRequestException } from "@nestjs/common";
import { JournalsService } from "./journals.service";

describe("JournalsService", () => {
  const makeService = () => {
    const prisma = {
      companyMember: {
        findUnique: jest.fn(),
      },
      account: {
        count: jest.fn(),
      },
      journalEntry: {
        create: jest.fn(),
        findFirst: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      journalLine: {
        createMany: jest.fn(),
        deleteMany: jest.fn(),
        findMany: jest.fn(),
      },
      $transaction: jest.fn(),
    };
    const service = new JournalsService(prisma as any);
    return { service, prisma };
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("creates a single-line draft entry", async () => {
    const { service, prisma } = makeService();
    prisma.companyMember.findUnique.mockResolvedValue({ role: "owner" });
    prisma.account.count.mockResolvedValue(1);
    prisma.$transaction.mockImplementation(async (callback: any) =>
      callback({
        journalEntry: {
          create: jest.fn().mockResolvedValue({ id: "entry-1" }),
          findFirst: jest.fn().mockResolvedValue({ id: "entry-1", status: "draft" }),
        },
        journalLine: {
          createMany: jest.fn().mockResolvedValue({ count: 1 }),
        },
      }),
    );

    const result = await service.createEntry("user-1", "company-1", {
      memo: "Draft journal",
      lines: [{ accountId: "account-1", debit: 1000, credit: 0 }],
    } as any);

    expect(result).toEqual({ id: "entry-1", status: "draft" });
  });

  it("rejects unbalanced posted entries", async () => {
    const { service, prisma } = makeService();
    prisma.companyMember.findUnique.mockResolvedValue({ role: "owner" });

    await expect(
      service.createEntry("user-1", "company-1", {
        status: "posted",
        lines: [
          { accountId: "a1", debit: 1000, credit: 0 },
          { accountId: "a2", debit: 0, credit: 500 },
        ],
      } as any),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it("rejects entries when one or more accounts are invalid", async () => {
    const { service, prisma } = makeService();
    prisma.companyMember.findUnique.mockResolvedValue({ role: "owner" });
    prisma.account.count.mockResolvedValue(1);

    await expect(
      service.createEntry("user-1", "company-1", {
        lines: [
          { accountId: "a1", debit: 1000, credit: 0 },
          { accountId: "a2", debit: 0, credit: 1000 },
        ],
      } as any),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
