import { BadRequestException, NotFoundException } from "@nestjs/common";
import { FixedAssetsService } from "./fixed-assets.service";

describe("FixedAssetsService", () => {
  const makeService = () => {
    const prisma = {
      companyMember: {
        findUnique: jest.fn(),
      },
      fixedAsset: {
        findFirst: jest.fn(),
      },
      $transaction: jest.fn(),
    };
    const service = new FixedAssetsService(prisma as any);
    return { service, prisma };
  };

  it("creates a fixed asset and acquisition journal", async () => {
    const { service, prisma } = makeService();
    prisma.companyMember.findUnique.mockResolvedValue({ role: "owner" });
    prisma.$transaction.mockImplementation(async (callback: any) =>
      callback({
        fixedAsset: {
          create: jest.fn().mockResolvedValue({
            id: "asset-1",
            acquisitionCost: 50000000,
            acquisitionDate: new Date("2026-01-11T00:00:00.000Z"),
          }),
        },
        account: {
          findMany: jest.fn().mockResolvedValue([]),
          createMany: jest.fn().mockResolvedValue({ count: 4 }),
          findFirst: jest
            .fn()
            .mockResolvedValueOnce({ id: "fixed", code: "1301" })
            .mockResolvedValueOnce({ id: "cash", code: "1001" }),
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

    const result = await service.createAsset("user-1", "company-1", {
      name: "Peralatan Kantor",
      assetType: "tetap",
      category: "Peralatan",
      acquisitionDate: new Date("2026-01-11T00:00:00.000Z"),
      acquisitionCost: 50000000,
      residualValue: 5000000,
      usefulLifeMonths: 60,
      depreciationMethod: "straight_line",
    } as any);

    expect(result.id).toBe("asset-1");
  });

  it("rejects depreciation posting when useful life is zero", async () => {
    const { service, prisma } = makeService();
    prisma.companyMember.findUnique.mockResolvedValue({ role: "owner" });
    prisma.fixedAsset.findFirst.mockResolvedValue({
      id: "asset-1",
      usefulLifeMonths: 0,
    });

    await expect(service.postDepreciation("user-1", "company-1", "asset-1")).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it("throws when asset is missing on get", async () => {
    const { service, prisma } = makeService();
    prisma.companyMember.findUnique.mockResolvedValue({ role: "owner" });
    prisma.fixedAsset.findFirst.mockResolvedValue(null);

    await expect(service.getAsset("user-1", "company-1", "missing")).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
