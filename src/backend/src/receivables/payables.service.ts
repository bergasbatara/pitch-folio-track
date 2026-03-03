import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CreatePayableDto } from "./dto/create-payable.dto";
import { UpdatePayableDto } from "./dto/update-payable.dto";
import type { Prisma } from "@prisma/client";
import { DEFAULT_ACCOUNTS, DEFAULT_ACCOUNT_CODES } from "../accounts/accounts.defaults";

@Injectable()
export class PayablesService {
  constructor(private readonly prisma: PrismaService) {}

  async listPayables(userId: string, companyId: string) {
    await this.assertMember(userId, companyId);
    return this.prisma.payable.findMany({
      where: { companyId },
      orderBy: { dueDate: "asc" },
    });
  }

  async getPayable(userId: string, companyId: string, payableId: string) {
    await this.assertMember(userId, companyId);
    const payable = await this.prisma.payable.findFirst({
      where: { id: payableId, companyId },
    });
    if (!payable) {
      throw new NotFoundException("Payable not found");
    }
    return payable;
  }

  async createPayable(userId: string, companyId: string, dto: CreatePayableDto) {
    await this.assertMember(userId, companyId);
    const paidAmount = dto.paidAmount ?? 0;
    if (paidAmount > dto.amount) {
      throw new BadRequestException("Paid amount cannot exceed amount");
    }
    const status = this.computeStatus(dto.amount, paidAmount, dto.dueDate);
    return this.prisma.$transaction(async (tx) => {
      const payable = await tx.payable.create({
        data: {
          companyId,
          supplierName: String(dto.supplierName ?? "").trim(),
          description: String(dto.description ?? "").trim(),
          amount: dto.amount,
          paidAmount,
          dueDate: dto.dueDate,
          status,
        },
      });
      await this.upsertPayableJournal(tx, companyId, payable.id, payable.amount, payable.dueDate);
      await this.upsertPayablePaymentJournal(tx, companyId, payable.id, payable.paidAmount, payable.dueDate);
      return payable;
    });
  }

  async updatePayable(userId: string, companyId: string, payableId: string, dto: UpdatePayableDto) {
    await this.assertMember(userId, companyId);
    const existing = await this.prisma.payable.findFirst({
      where: { id: payableId, companyId },
    });
    if (!existing) {
      throw new NotFoundException("Payable not found");
    }
    const amount = dto.amount ?? existing.amount;
    const paidAmount = dto.paidAmount ?? existing.paidAmount;
    const dueDate = dto.dueDate ?? existing.dueDate;

    if (paidAmount > amount) {
      throw new BadRequestException("Paid amount cannot exceed amount");
    }

    const status = this.computeStatus(amount, paidAmount, dueDate);

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.payable.update({
        where: { id: payableId },
        data: {
          supplierName: dto.supplierName !== undefined ? String(dto.supplierName).trim() : undefined,
          description: dto.description !== undefined ? String(dto.description).trim() : undefined,
          amount: dto.amount,
          paidAmount: dto.paidAmount,
          dueDate: dto.dueDate,
          status,
        },
      });
      await this.upsertPayableJournal(tx, companyId, updated.id, updated.amount, updated.dueDate);
      await this.upsertPayablePaymentJournal(tx, companyId, updated.id, updated.paidAmount, updated.dueDate);
      return updated;
    });
  }

  async deletePayable(userId: string, companyId: string, payableId: string) {
    await this.assertMember(userId, companyId);
    const existing = await this.prisma.payable.findFirst({
      where: { id: payableId, companyId },
    });
    if (!existing) {
      throw new NotFoundException("Payable not found");
    }
    return this.prisma.$transaction(async (tx) => {
      await tx.journalEntry.deleteMany({
        where: { companyId, sourceId: payableId, source: { in: ["payable", "payable_payment"] } },
      });
      await tx.payable.delete({ where: { id: payableId } });
      return { success: true };
    });
  }

  private computeStatus(amount: number, paidAmount: number, dueDate: Date) {
    if (paidAmount >= amount) {
      return "paid";
    }
    if (paidAmount > 0) {
      return "partial";
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (dueDate < today) {
      return "overdue";
    }
    return "pending";
  }

  private async assertMember(userId: string, companyId: string) {
    const membership = await this.prisma.companyMember.findUnique({
      where: { userId_companyId: { userId, companyId } },
    });
    if (!membership) {
      throw new ForbiddenException("Not a member of this company");
    }
  }

  private async ensureDefaultAccounts(tx: Prisma.TransactionClient, companyId: string) {
    const existing = await tx.account.findMany({
      where: { companyId },
      select: { code: true },
    });
    const existingCodes = new Set(existing.map((a) => a.code));
    const toCreate = DEFAULT_ACCOUNTS.filter((acc) => !existingCodes.has(acc.code)).map((acc) => ({
      ...acc,
      companyId,
    }));
    if (toCreate.length === 0) return;
    await tx.account.createMany({ data: toCreate, skipDuplicates: true });
  }

  private async getAccountIdByCode(tx: Prisma.TransactionClient, companyId: string, code: string) {
    const account = await tx.account.findFirst({ where: { companyId, code } });
    if (!account) {
      throw new NotFoundException(`Account ${code} not found`);
    }
    return account.id;
  }

  private async upsertPayableJournal(
    tx: Prisma.TransactionClient,
    companyId: string,
    payableId: string,
    amount: number,
    date: Date,
  ) {
    await this.ensureDefaultAccounts(tx, companyId);
    const expenseId = await this.getAccountIdByCode(tx, companyId, DEFAULT_ACCOUNT_CODES.purchases);
    const apId = await this.getAccountIdByCode(tx, companyId, DEFAULT_ACCOUNT_CODES.payable);

    const existing = await tx.journalEntry.findFirst({
      where: { companyId, source: "payable", sourceId: payableId },
    });

    if (!existing) {
      const entry = await tx.journalEntry.create({
        data: {
          companyId,
          date,
          memo: `Hutang #${payableId}`,
          source: "payable",
          sourceId: payableId,
        },
      });
      await tx.journalLine.createMany({
        data: [
          { entryId: entry.id, accountId: expenseId, debit: amount, credit: 0 },
          { entryId: entry.id, accountId: apId, debit: 0, credit: amount },
        ],
      });
      return;
    }

    await tx.journalEntry.update({
      where: { id: existing.id },
      data: { date, memo: `Hutang #${payableId}` },
    });
    await tx.journalLine.deleteMany({ where: { entryId: existing.id } });
    await tx.journalLine.createMany({
      data: [
        { entryId: existing.id, accountId: expenseId, debit: amount, credit: 0 },
        { entryId: existing.id, accountId: apId, debit: 0, credit: amount },
      ],
    });
  }

  private async upsertPayablePaymentJournal(
    tx: Prisma.TransactionClient,
    companyId: string,
    payableId: string,
    paidAmount: number,
    date: Date,
  ) {
    await this.ensureDefaultAccounts(tx, companyId);
    const cashId = await this.getAccountIdByCode(tx, companyId, DEFAULT_ACCOUNT_CODES.cash);
    const apId = await this.getAccountIdByCode(tx, companyId, DEFAULT_ACCOUNT_CODES.payable);

    const existing = await tx.journalEntry.findFirst({
      where: { companyId, source: "payable_payment", sourceId: payableId },
    });

    if (paidAmount <= 0) {
      if (existing) {
        await tx.journalEntry.delete({ where: { id: existing.id } });
      }
      return;
    }

    if (!existing) {
      const entry = await tx.journalEntry.create({
        data: {
          companyId,
          date,
          memo: `Pembayaran Hutang #${payableId}`,
          source: "payable_payment",
          sourceId: payableId,
        },
      });
      await tx.journalLine.createMany({
        data: [
          { entryId: entry.id, accountId: apId, debit: paidAmount, credit: 0 },
          { entryId: entry.id, accountId: cashId, debit: 0, credit: paidAmount },
        ],
      });
      return;
    }

    await tx.journalEntry.update({
      where: { id: existing.id },
      data: { date, memo: `Pembayaran Hutang #${payableId}` },
    });
    await tx.journalLine.deleteMany({ where: { entryId: existing.id } });
    await tx.journalLine.createMany({
      data: [
        { entryId: existing.id, accountId: apId, debit: paidAmount, credit: 0 },
        { entryId: existing.id, accountId: cashId, debit: 0, credit: paidAmount },
      ],
    });
  }
}
