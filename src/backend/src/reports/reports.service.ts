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

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  async getDailyStatement(userId: string, companyId: string, date?: string) {
    await this.assertMember(userId, companyId);
    const target = this.parseDate(date);
    const start = new Date(target);
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(start.getDate() + 1);

    const lines = await this.prisma.journalLine.findMany({
      where: {
        entry: {
          companyId,
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
      date: start.toISOString().slice(0, 10),
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
