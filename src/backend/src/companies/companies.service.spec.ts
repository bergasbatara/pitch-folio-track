import { ConflictException, ForbiddenException, NotFoundException } from "@nestjs/common";
import { CompaniesService } from "./companies.service";

describe("CompaniesService", () => {
  const makeService = () => {
    const prisma = {
      $transaction: jest.fn(),
      companyMember: {
        findMany: jest.fn(),
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        delete: jest.fn(),
      },
      company: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      user: {
        findUnique: jest.fn(),
      },
    };
    const service = new CompaniesService(prisma as any);
    return { service, prisma };
  };

  it("returns the earliest membership company as current", async () => {
    const { service, prisma } = makeService();
    prisma.companyMember.findFirst.mockResolvedValue({ company: { id: "company-1", name: "Alpha" } });

    const company = await service.getCurrentCompany("user-1");
    expect(company.id).toBe("company-1");
  });

  it("rejects adding a member who is already in the company", async () => {
    const { service, prisma } = makeService();
    prisma.companyMember.findUnique
      .mockResolvedValueOnce({ role: "owner" })
      .mockResolvedValueOnce({ userId: "u2", companyId: "company-1" });
    prisma.user.findUnique.mockResolvedValue({ id: "u2", email: "member@test.com" });

    await expect(
      service.addMember("owner-1", "company-1", { email: "member@test.com", role: "member" }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it("prevents owners from removing themselves", async () => {
    const { service, prisma } = makeService();
    prisma.companyMember.findUnique.mockResolvedValue({ role: "owner" });

    await expect(service.removeMember("user-1", "company-1", "user-1")).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });
});
