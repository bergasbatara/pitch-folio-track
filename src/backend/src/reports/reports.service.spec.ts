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
      { debit: 500, credit: 0, account: { id: "inventory", code: "1201", name: "Persediaan", type: "asset", normalBalance: "debit" } },
      { debit: 0, credit: 1000, account: { id: "rev", code: "4001", name: "Penjualan", type: "revenue", normalBalance: "credit" } },
      { debit: 0, credit: 500, account: { id: "ap", code: "2001", name: "Hutang Usaha", type: "liability", normalBalance: "credit" } },
    ]);

    const report = await service.getDailyStatement("user-1", "company-1", "2026-01-12");

    expect(report.totals.revenue).toBe(1000);
    expect(report.totals.cashIn).toBe(1000);
    expect(report.totals.inventoryValue).toBe(500);
    expect(report.accounts).toHaveLength(4);
  });

  it("builds a balance snapshot from posted journal truth and excludes opening balance suspense from retained earnings", async () => {
    const { service, prisma } = makeService();
    prisma.companyMember.findUnique.mockResolvedValue({ role: "owner" });
    prisma.journalLine.findMany.mockResolvedValue([
      { debit: 3000, credit: 0, account: { id: "cash", code: "1001", name: "Kas", type: "asset", normalBalance: "debit" } },
      { debit: 2000, credit: 0, account: { id: "inventory", code: "1201", name: "Persediaan", type: "asset", normalBalance: "debit" } },
      { debit: 1500, credit: 0, account: { id: "cash", code: "1001", name: "Kas", type: "asset", normalBalance: "debit" } },
      { debit: 0, credit: 500, account: { id: "cash", code: "1001", name: "Kas", type: "asset", normalBalance: "debit" } },
      { debit: 0, credit: 3000, account: { id: "capital", code: "3001", name: "Modal", type: "equity", normalBalance: "credit" } },
      { debit: 400, credit: 0, account: { id: "suspense", code: "3999", name: "Saldo Awal Sementara", type: "equity", normalBalance: "debit" } },
      { debit: 0, credit: 400, account: { id: "suspense", code: "3999", name: "Saldo Awal Sementara", type: "equity", normalBalance: "credit" } },
      { debit: 0, credit: 1500, account: { id: "revenue", code: "4001", name: "Penjualan", type: "revenue", normalBalance: "credit" } },
      { debit: 500, credit: 0, account: { id: "expense", code: "5001", name: "Pembelian", type: "expense", normalBalance: "debit" } },
      { debit: 0, credit: 2000, account: { id: "payable", code: "2001", name: "Hutang Usaha", type: "liability", normalBalance: "credit" } },
    ]);

    const snapshot = await service.getBalanceSnapshot("user-1", "company-1", "2026-01-12");

    expect(snapshot.categories.inventory).toBe(2000);
    expect(snapshot.categories.equityCapital).toBe(3000);
    expect(snapshot.categories.retainedEarnings).toBe(1000);
    expect(snapshot.categories.totalAssets).toBe(6000);
    expect(snapshot.categories.totalLiabilities + snapshot.categories.totalEquity).toBe(6000);
  });

  it("counts bank settlements and tax-bearing journals correctly in the range statement", async () => {
    const { service, prisma } = makeService();
    prisma.companyMember.findUnique.mockResolvedValue({ role: "owner" });
    prisma.journalLine.findMany.mockResolvedValue([
      { debit: 1110, credit: 0, account: { id: "recv", code: "1101", name: "Piutang Usaha", type: "asset", normalBalance: "debit" } },
      { debit: 0, credit: 1000, account: { id: "revenue", code: "4001", name: "Penjualan", type: "revenue", normalBalance: "credit" } },
      { debit: 0, credit: 110, account: { id: "taxPayable", code: "2101", name: "PPN Keluaran", type: "liability", normalBalance: "credit" } },
      { debit: 1110, credit: 0, account: { id: "bank", code: "1002", name: "Bank BCA", type: "asset", normalBalance: "debit" } },
      { debit: 0, credit: 1110, account: { id: "recv", code: "1101", name: "Piutang Usaha", type: "asset", normalBalance: "debit" } },
      { debit: 400, credit: 0, account: { id: "purchase", code: "5001", name: "Pembelian", type: "expense", normalBalance: "debit" } },
      { debit: 44, credit: 0, account: { id: "taxInput", code: "1102", name: "PPN Masukan", type: "asset", normalBalance: "debit" } },
      { debit: 0, credit: 444, account: { id: "payable", code: "2001", name: "Hutang Usaha", type: "liability", normalBalance: "credit" } },
      { debit: 444, credit: 0, account: { id: "payable", code: "2001", name: "Hutang Usaha", type: "liability", normalBalance: "credit" } },
      { debit: 0, credit: 444, account: { id: "bank", code: "1002", name: "Bank BCA", type: "asset", normalBalance: "debit" } },
    ]);

    const report = await service.getRangeStatement("user-1", "company-1", "2026-02-01", "2026-02-28");

    expect(report.totals.revenue).toBe(1000);
    expect(report.totals.expense).toBe(400);
    expect(report.totals.cashIn).toBe(1110);
    expect(report.totals.cashOut).toBe(444);
    expect(report.totals.receivableChange).toBe(0);
    expect(report.totals.payableChange).toBe(0);
  });

  it("counts bank balances, capital, retained earnings, and current earnings in the balance snapshot", async () => {
    const { service, prisma } = makeService();
    prisma.companyMember.findUnique.mockResolvedValue({ role: "owner" });
    prisma.journalLine.findMany.mockResolvedValue([
      { debit: 5000, credit: 0, account: { id: "bank", code: "1002", name: "Bank Operasional", type: "asset", normalBalance: "debit" } },
      { debit: 0, credit: 5000, account: { id: "capital", code: "3001", name: "Modal Disetor", type: "equity", normalBalance: "credit" } },
      { debit: 2000, credit: 0, account: { id: "inventory", code: "1201", name: "Persediaan", type: "asset", normalBalance: "debit" } },
      { debit: 0, credit: 2000, account: { id: "retained", code: "3101", name: "Saldo Laba", type: "equity", normalBalance: "credit" } },
      { debit: 1500, credit: 0, account: { id: "bank", code: "1002", name: "Bank Operasional", type: "asset", normalBalance: "debit" } },
      { debit: 0, credit: 1500, account: { id: "revenue", code: "4001", name: "Penjualan", type: "revenue", normalBalance: "credit" } },
      { debit: 500, credit: 0, account: { id: "expense", code: "5001", name: "Pembelian", type: "expense", normalBalance: "debit" } },
      { debit: 0, credit: 500, account: { id: "bank", code: "1002", name: "Bank Operasional", type: "asset", normalBalance: "debit" } },
      { debit: 1000, credit: 0, account: { id: "bank", code: "1002", name: "Bank Operasional", type: "asset", normalBalance: "debit" } },
      { debit: 0, credit: 1000, account: { id: "payable", code: "2001", name: "Hutang Usaha", type: "liability", normalBalance: "credit" } },
      { debit: 400, credit: 0, account: { id: "suspense", code: "3999", name: "Saldo Awal Sementara", type: "equity", normalBalance: "debit" } },
      { debit: 0, credit: 400, account: { id: "suspense", code: "3999", name: "Saldo Awal Sementara", type: "equity", normalBalance: "credit" } },
    ]);

    const snapshot = await service.getBalanceSnapshot("user-1", "company-1", "2026-02-28");

    expect(snapshot.categories.cash).toBe(7000);
    expect(snapshot.categories.inventory).toBe(2000);
    expect(snapshot.categories.equityCapital).toBe(5000);
    expect(snapshot.categories.retainedEarnings).toBe(3000);
    expect(snapshot.categories.totalAssets).toBe(9000);
    expect(snapshot.categories.totalLiabilities + snapshot.categories.totalEquity).toBe(9000);
  });

  it("rejects invalid report dates", async () => {
    const { service, prisma } = makeService();
    prisma.companyMember.findUnique.mockResolvedValue({ role: "owner" });

    await expect(service.getRangeStatement("user-1", "company-1", "nope", "2026-01-12")).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });
});
