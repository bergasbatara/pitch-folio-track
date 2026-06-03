import { ConflictException, NotFoundException } from "@nestjs/common";
import { TaxesService } from "./taxes.service";

describe("TaxesService", () => {
  const makeService = () => {
    const prisma = {
      companyMember: {
        findUnique: jest.fn(),
      },
      taxCode: {
        findMany: jest.fn(),
        createMany: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      $transaction: jest.fn(),
    };
    const service = new TaxesService(prisma as any);
    return { service, prisma };
  };

  it("seeds default tax codes when none exist", async () => {
    const { service, prisma } = makeService();
    prisma.companyMember.findUnique.mockResolvedValue({ role: "owner" });
    prisma.taxCode.findMany
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([{ id: "ppn", code: "PPN" }]);

    const result = await service.listTaxCodes("user-1", "company-1");

    expect(prisma.taxCode.createMany).toHaveBeenCalled();
    expect(result).toEqual([{ id: "ppn", code: "PPN" }]);
  });

  it("rejects duplicate tax code creation", async () => {
    const { service, prisma } = makeService();
    prisma.companyMember.findUnique.mockResolvedValue({ role: "owner" });
    prisma.taxCode.findFirst.mockResolvedValue({ id: "ppn", code: "PPN" });

    await expect(
      service.createTaxCode("user-1", "company-1", {
        name: "PPN",
        code: "PPN",
        rate: 11,
      } as any),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it("throws when deleting a missing tax code", async () => {
    const { service, prisma } = makeService();
    prisma.companyMember.findUnique.mockResolvedValue({ role: "owner" });
    prisma.taxCode.findFirst.mockResolvedValue(null);

    await expect(service.deleteTaxCode("user-1", "company-1", "missing")).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
