import { BadRequestException, ForbiddenException, Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { DEFAULT_ACCOUNT_CODES } from "../accounts/accounts.defaults";

type AccountSummary = {
  id: string;
  code: string;
  name: string;
  type: string;
  normalBalance: string;
  debit: number;
  credit: number;
  net: number;
};

type BalanceCategories = {
  cash: number;
  receivable: number;
  inventory: number;
  prepaid: number;
  prepaidTax: number;
  otherCurrentAssets: number;
  fixedAssetsGross: number;
  accumulatedDepreciation: number;
  fixedAssetsNet: number;
  payables: number;
  bankDebtShort: number;
  otherCurrentLiabilities: number;
  bankDebtLong: number;
  financingDebt: number;
  equityCapital: number;
  retainedEarnings: number;
  totalCurrentAssets: number;
  totalNonCurrentAssets: number;
  totalAssets: number;
  totalCurrentLiabilities: number;
  totalLongTermLiabilities: number;
  totalLiabilities: number;
  totalEquity: number;
};

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  async getRangeStatement(userId: string, companyId: string, fromStr: string, toStr: string) {
    await this.assertMember(userId, companyId);
    const from = this.parseDate(fromStr);
    const to = this.parseDate(toStr);
    const start = new Date(from);
    start.setHours(0, 0, 0, 0);
    const end = new Date(to);
    end.setHours(23, 59, 59, 999);
    return this.buildReport(companyId, start, end);
  }

  async getNotesSummary(userId: string, companyId: string, fromStr: string, toStr: string) {
    await this.assertMember(userId, companyId);
    const from = this.parseDate(fromStr);
    const to = this.parseDate(toStr);
    const start = new Date(from);
    start.setHours(0, 0, 0, 0);
    const end = new Date(to);
    end.setHours(23, 59, 59, 999);

    const report = await this.buildReport(companyId, start, end);
    const products = await this.prisma.product.findMany({
      where: { companyId },
      select: { price: true, stock: true },
    });
    const inventoryValue = products.reduce((sum, p) => sum + (p.price * p.stock), 0);

    return {
      ...report,
      totals: {
        ...report.totals,
        inventoryValue,
      },
    };
  }

  async getDailyStatement(userId: string, companyId: string, date?: string) {
    await this.assertMember(userId, companyId);
    const target = this.parseDate(date);
    const start = new Date(target);
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(start.getDate() + 1);
    return this.buildReport(companyId, start, end);
  }

  async getBalanceSnapshot(userId: string, companyId: string, asOf?: string) {
    await this.assertMember(userId, companyId);
    const target = this.parseDate(asOf);
    const end = new Date(target);
    end.setHours(23, 59, 59, 999);
    return this.buildBalanceSnapshot(companyId, end);
  }

  private async buildReport(companyId: string, start: Date, end: Date) {
    const lines = await this.prisma.journalLine.findMany({
      where: {
        entry: {
          companyId,
          status: "posted",
          date: { gte: start, lt: end },
        },
      },
      include: {
        account: { select: { id: true, code: true, name: true, type: true, normalBalance: true } },
      },
    });

    const accountMap = new Map<string, AccountSummary>();
    const totalsByType: Record<string, number> = {
      asset: 0,
      liability: 0,
      equity: 0,
      revenue: 0,
      expense: 0,
    };

    let cashIn = 0;
    let cashOut = 0;
    let receivableChange = 0;
    let payableChange = 0;

    for (const line of lines) {
      const debit = Number(line.debit ?? 0);
      const credit = Number(line.credit ?? 0);
      const account = line.account;

      const existing = accountMap.get(account.id) ?? {
        id: account.id,
        code: account.code,
        name: account.name,
        type: account.type,
        normalBalance: account.normalBalance,
        debit: 0,
        credit: 0,
        net: 0,
      };

      existing.debit += debit;
      existing.credit += credit;
      existing.net =
        account.normalBalance === "credit"
          ? existing.credit - existing.debit
          : existing.debit - existing.credit;

      accountMap.set(account.id, existing);

      if (totalsByType[account.type] !== undefined) {
        totalsByType[account.type] +=
          account.normalBalance === "credit" ? credit - debit : debit - credit;
      }

      if (account.code === DEFAULT_ACCOUNT_CODES.cash) {
        cashIn += debit;
        cashOut += credit;
      }
      if (account.code === DEFAULT_ACCOUNT_CODES.receivable) {
        receivableChange += debit - credit;
      }
      if (account.code === DEFAULT_ACCOUNT_CODES.payable) {
        payableChange += credit - debit;
      }
    }

    const revenue = totalsByType.revenue ?? 0;
    const expense = totalsByType.expense ?? 0;
    const netProfit = revenue - expense;

    return {
      from: start.toISOString().slice(0, 10),
      to: new Date(end.getTime() - 1).toISOString().slice(0, 10),
      totals: {
        revenue,
        expense,
        netProfit,
        cashIn,
        cashOut,
        netCash: cashIn - cashOut,
        receivableChange,
        payableChange,
      },
      byType: totalsByType,
      accounts: Array.from(accountMap.values()).sort((a, b) => a.code.localeCompare(b.code)),
    };
  }

  private async buildBalanceSnapshot(companyId: string, end: Date) {
    const lines = await this.prisma.journalLine.findMany({
      where: {
        entry: {
          companyId,
          status: "posted",
          date: { lte: end },
        },
      },
      include: {
        account: { select: { id: true, code: true, name: true, type: true, normalBalance: true } },
      },
    });

    const accountMap = new Map<string, AccountSummary>();
    const totalsByType: Record<string, number> = {
      asset: 0,
      liability: 0,
      equity: 0,
      revenue: 0,
      expense: 0,
    };

    for (const line of lines) {
      const debit = Number(line.debit ?? 0);
      const credit = Number(line.credit ?? 0);
      const account = line.account;

      const existing = accountMap.get(account.id) ?? {
        id: account.id,
        code: account.code,
        name: account.name,
        type: account.type,
        normalBalance: account.normalBalance,
        debit: 0,
        credit: 0,
        net: 0,
      };

      existing.debit += debit;
      existing.credit += credit;
      existing.net =
        account.normalBalance === "credit"
          ? existing.credit - existing.debit
          : existing.debit - existing.credit;

      accountMap.set(account.id, existing);

      if (totalsByType[account.type] !== undefined) {
        totalsByType[account.type] +=
          account.normalBalance === "credit" ? credit - debit : debit - credit;
      }
    }

    const accounts = Array.from(accountMap.values()).sort((a, b) => a.code.localeCompare(b.code));
    const products = await this.prisma.product.findMany({
      where: { companyId },
      select: { price: true, stock: true },
    });
    const inventoryValue = products.reduce((sum, p) => sum + (p.price * p.stock), 0);
    const categories = this.buildBalanceCategories(accounts, inventoryValue);

    return {
      asOf: end.toISOString().slice(0, 10),
      byType: totalsByType,
      accounts,
      categories,
    };
  }

  private buildBalanceCategories(accounts: AccountSummary[], inventoryValue: number): BalanceCategories {
    const lower = (value: string) => value.toLowerCase();
    const hasName = (acc: AccountSummary, keywords: string[]) =>
      keywords.some((kw) => lower(acc.name).includes(kw));
    const hasPrefix = (acc: AccountSummary, prefixes: string[]) =>
      prefixes.some((prefix) => acc.code.startsWith(prefix));
    const sum = (items: AccountSummary[]) => items.reduce((total, acc) => total + (acc.net ?? 0), 0);

    const cash = sum(accounts.filter((acc) =>
      acc.code === DEFAULT_ACCOUNT_CODES.cash || hasName(acc, ["kas"])
    ));
    const receivable = sum(accounts.filter((acc) =>
      acc.code === DEFAULT_ACCOUNT_CODES.receivable || hasName(acc, ["piutang"])
    ));
    const fixedAssetsGross = sum(accounts.filter((acc) =>
      acc.code === DEFAULT_ACCOUNT_CODES.fixedAsset || hasPrefix(acc, ["13"]) || hasName(acc, ["aset tetap", "peralatan"])
    ));
    const accumulatedDepreciation = sum(accounts.filter((acc) =>
      acc.code === DEFAULT_ACCOUNT_CODES.accumulatedDepreciation || hasPrefix(acc, ["14"]) || hasName(acc, ["akumulasi penyusutan"])
    ));
    const prepaid = sum(accounts.filter((acc) =>
      hasPrefix(acc, ["15"]) || hasName(acc, ["dibayar dimuka", "prepaid"])
    ));
    const prepaidTax = sum(accounts.filter((acc) =>
      hasName(acc, ["pajak dibayar dimuka"])
    ));

    const inventory = inventoryValue;

    const assetAccounts = accounts.filter((acc) => acc.type === "asset");
    const excludedAssetIds = new Set(
      accounts
        .filter((acc) =>
          acc.code === DEFAULT_ACCOUNT_CODES.cash ||
          acc.code === DEFAULT_ACCOUNT_CODES.receivable ||
          acc.code === DEFAULT_ACCOUNT_CODES.fixedAsset ||
          acc.code === DEFAULT_ACCOUNT_CODES.accumulatedDepreciation ||
          hasPrefix(acc, ["12", "13", "14", "15"]) ||
          hasName(acc, ["kas", "piutang", "persediaan", "aset tetap", "peralatan", "akumulasi penyusutan", "dibayar dimuka", "prepaid"])
        )
        .map((acc) => acc.id),
    );

    const otherCurrentAssets = sum(assetAccounts.filter((acc) => !excludedAssetIds.has(acc.id) && !hasPrefix(acc, ["13", "14"])));

    const payables = sum(accounts.filter((acc) =>
      acc.code === DEFAULT_ACCOUNT_CODES.payable || hasName(acc, ["utang usaha", "hutang usaha"])
    ));
    const bankDebtShort = sum(accounts.filter((acc) =>
      hasName(acc, ["utang bank", "pinjaman bank"]) && (hasPrefix(acc, ["21", "22"]) || hasName(acc, ["jangka pendek"]))
    ));
    const otherCurrentLiabilities = sum(accounts.filter((acc) =>
      acc.type === "liability" &&
      !(hasName(acc, ["utang usaha", "hutang usaha", "utang bank", "pinjaman bank", "pembiayaan"])) &&
      (hasPrefix(acc, ["21", "22"]) || hasName(acc, ["kewajiban", "hutang", "utang"]))
    ));
    const bankDebtLong = sum(accounts.filter((acc) =>
      hasName(acc, ["utang bank", "pinjaman bank"]) && (hasPrefix(acc, ["23", "24"]) || hasName(acc, ["jangka panjang"]))
    ));
    const financingDebt = sum(accounts.filter((acc) =>
      hasName(acc, ["pembiayaan", "leasing"])
    ));

    const equityCapital = sum(accounts.filter((acc) =>
      acc.type === "equity" && (hasName(acc, ["modal", "saham"]) || hasPrefix(acc, ["30"]))
    ));
    const retainedEarnings = sum(accounts.filter((acc) =>
      acc.type === "equity" && !hasName(acc, ["modal", "saham"])
    ));

    const fixedAssetsNet = fixedAssetsGross - accumulatedDepreciation;
    const totalCurrentAssets = cash + receivable + inventory + prepaid + prepaidTax + otherCurrentAssets;
    const totalNonCurrentAssets = fixedAssetsNet;
    const totalAssets = totalCurrentAssets + totalNonCurrentAssets;

    const totalCurrentLiabilities = payables + bankDebtShort + otherCurrentLiabilities;
    const totalLongTermLiabilities = bankDebtLong + financingDebt;
    const totalLiabilities = totalCurrentLiabilities + totalLongTermLiabilities;
    const totalEquity = equityCapital + retainedEarnings;

    return {
      cash,
      receivable,
      inventory,
      prepaid,
      prepaidTax,
      otherCurrentAssets,
      fixedAssetsGross,
      accumulatedDepreciation,
      fixedAssetsNet,
      payables,
      bankDebtShort,
      otherCurrentLiabilities,
      bankDebtLong,
      financingDebt,
      equityCapital,
      retainedEarnings,
      totalCurrentAssets,
      totalNonCurrentAssets,
      totalAssets,
      totalCurrentLiabilities,
      totalLongTermLiabilities,
      totalLiabilities,
      totalEquity,
    };
  }

  private parseDate(date?: string) {
    if (!date) return new Date();
    const parsed = new Date(date);
    if (Number.isNaN(parsed.getTime())) {
      throw new BadRequestException("Invalid date");
    }
    return parsed;
  }

  private async assertMember(userId: string, companyId: string) {
    const membership = await this.prisma.companyMember.findUnique({
      where: { userId_companyId: { userId, companyId } },
    });
    if (!membership) {
      throw new ForbiddenException("Not a member of this company");
    }
    return membership;
  }
}
