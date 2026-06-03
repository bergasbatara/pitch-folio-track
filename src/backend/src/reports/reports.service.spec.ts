import { BadRequestException } from "@nestjs/common";
import { ReportsService } from "./reports.service";

describe("ReportsService", () => {
  const makeService = () => {
    const prisma = {
      companyMember: { findUnique: jest.fn() },
      journalLine: { findMany: jest.fn() },
      product: { findMany: jest.fn() },
    };
    const service = new ReportsService(prisma as any);
    return { service, prisma };
  };

  it("builds a daily statement summary from posted journal lines", async () => {
    const { service, prisma } = makeService();
    prisma.companyMember.findUnique.mockResolvedValue({ role: "owner" });
    prisma.journalLine.findMany.mockResolvedValue([
      { debit: 1000, credit: 0, account: { id: "cash", code: "1001", name: "Kas", type: "asset", normalBalance: "debit" } },
      { debit: 0, credit: 1000, account: { id: "rev", code: "4001", name: "Penjualan", type: "revenue", normalBalance: "credit" } },
    ]);

    const report = await service.getDailyStatement("user-1", "company-1", "2026-01-12");

    expect(report.totals.revenue).toBe(1000);
    expect(report.totals.cashIn).toBe(1000);
    expect(report.accounts).toHaveLength(2);
  });

  it("rejects invalid report dates", async () => {
    const { service, prisma } = makeService();
    prisma.companyMember.findUnique.mockResolvedValue({ role: "owner" });

    await expect(service.getRangeStatement("user-1", "company-1", "nope", "2026-01-12")).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });
});
