import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CreateReceivableDto } from "./dto/create-receivable.dto";
import { UpdateReceivableDto } from "./dto/update-receivable.dto";
import type { Prisma } from "@prisma/client";
import { DEFAULT_ACCOUNTS, DEFAULT_ACCOUNT_CODES } from "../accounts/accounts.defaults";

@Injectable()
export class ReceivablesService {
  constructor(private readonly prisma: PrismaService) {}

  async listReceivables(userId: string, companyId: string) {
    await this.assertMember(userId, companyId);
    return this.prisma.receivable.findMany({
      where: { companyId },
      orderBy: { dueDate: "asc" },
    });
  }

  async getReceivable(userId: string, companyId: string, receivableId: string) {
    await this.assertMember(userId, companyId);
    const receivable = await this.prisma.receivable.findFirst({
      where: { id: receivableId, companyId },
    });
    if (!receivable) {
      throw new NotFoundException("Receivable not found");
    }
    return receivable;
  }

  async createReceivable(userId: string, companyId: string, dto: CreateReceivableDto) {
    await this.assertMember(userId, companyId);
    const paidAmount = dto.paidAmount ?? 0;
    if (paidAmount > dto.amount) {
      throw new BadRequestException("Paid amount cannot exceed amount");
    }
    const status = this.computeStatus(dto.amount, paidAmount, dto.dueDate);
    return this.prisma.$transaction(async (tx) => {
      const receivable = await tx.receivable.create({
        data: {
          companyId,
          customerName: String(dto.customerName ?? "").trim(),
          description: String(dto.description ?? "").trim(),
          amount: dto.amount,
          paidAmount,
          dueDate: dto.dueDate,
          status,
        },
      });
      await this.upsertReceivableJournal(tx, companyId, receivable.id, receivable.amount, receivable.dueDate);
      await this.upsertReceivablePaymentJournal(tx, companyId, receivable.id, receivable.paidAmount, receivable.dueDate);
      return receivable;
    });
  }

  async updateReceivable(userId: string, companyId: string, receivableId: string, dto: UpdateReceivableDto) {
    await this.assertMember(userId, companyId);
    const existing = await this.prisma.receivable.findFirst({
      where: { id: receivableId, companyId },
    });
    if (!existing) {
      throw new NotFoundException("Receivable not found");
    }
    const amount = dto.amount ?? existing.amount;
    const paidAmount = dto.paidAmount ?? existing.paidAmount;
    const dueDate = dto.dueDate ?? existing.dueDate;

    if (paidAmount > amount) {
      throw new BadRequestException("Paid amount cannot exceed amount");
    }

    const status = this.computeStatus(amount, paidAmount, dueDate);

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.receivable.update({
        where: { id: receivableId },
        data: {
          customerName: dto.customerName !== undefined ? String(dto.customerName).trim() : undefined,
          description: dto.description !== undefined ? String(dto.description).trim() : undefined,
          amount: dto.amount,
          paidAmount: dto.paidAmount,
          dueDate: dto.dueDate,
          status,
        },
      });
      await this.upsertReceivableJournal(tx, companyId, updated.id, updated.amount, updated.dueDate);
      await this.upsertReceivablePaymentJournal(tx, companyId, updated.id, updated.paidAmount, updated.dueDate);
      return updated;
    });
  }

  async deleteReceivable(userId: string, companyId: string, receivableId: string) {
    await this.assertMember(userId, companyId);
    const existing = await this.prisma.receivable.findFirst({
      where: { id: receivableId, companyId },
    });
    if (!existing) {
      throw new NotFoundException("Receivable not found");
    }
    return this.prisma.$transaction(async (tx) => {
      await tx.journalEntry.deleteMany({
        where: { companyId, sourceId: receivableId, source: { in: ["receivable", "receivable_payment"] } },
      });
      await tx.receivable.delete({ where: { id: receivableId } });
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

  private async upsertReceivableJournal(
    tx: Prisma.TransactionClient,
    companyId: string,
    receivableId: string,
    amount: number,
    date: Date,
  ) {
    await this.ensureDefaultAccounts(tx, companyId);
    const arId = await this.getAccountIdByCode(tx, companyId, DEFAULT_ACCOUNT_CODES.receivable);
    const revenueId = await this.getAccountIdByCode(tx, companyId, DEFAULT_ACCOUNT_CODES.revenue);

    const existing = await tx.journalEntry.findFirst({
      where: { companyId, source: "receivable", sourceId: receivableId },
    });

    if (!existing) {
      const entry = await tx.journalEntry.create({
        data: {
          companyId,
          date,
          memo: `Piutang #${receivableId}`,
          source: "receivable",
          sourceId: receivableId,
        },
      });
      await tx.journalLine.createMany({
        data: [
          { entryId: entry.id, accountId: arId, debit: amount, credit: 0 },
          { entryId: entry.id, accountId: revenueId, debit: 0, credit: amount },
        ],
      });
      return;
    }

    await tx.journalEntry.update({
      where: { id: existing.id },
      data: { date, memo: `Piutang #${receivableId}` },
    });
    await tx.journalLine.deleteMany({ where: { entryId: existing.id } });
    await tx.journalLine.createMany({
      data: [
        { entryId: existing.id, accountId: arId, debit: amount, credit: 0 },
        { entryId: existing.id, accountId: revenueId, debit: 0, credit: amount },
      ],
    });
  }

  private async upsertReceivablePaymentJournal(
    tx: Prisma.TransactionClient,
    companyId: string,
    receivableId: string,
    paidAmount: number,
    date: Date,
  ) {
    await this.ensureDefaultAccounts(tx, companyId);
    const cashId = await this.getAccountIdByCode(tx, companyId, DEFAULT_ACCOUNT_CODES.cash);
    const arId = await this.getAccountIdByCode(tx, companyId, DEFAULT_ACCOUNT_CODES.receivable);

    const existing = await tx.journalEntry.findFirst({
      where: { companyId, source: "receivable_payment", sourceId: receivableId },
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
          memo: `Pembayaran Piutang #${receivableId}`,
          source: "receivable_payment",
          sourceId: receivableId,
        },
      });
      await tx.journalLine.createMany({
        data: [
          { entryId: entry.id, accountId: cashId, debit: paidAmount, credit: 0 },
          { entryId: entry.id, accountId: arId, debit: 0, credit: paidAmount },
        ],
      });
      return;
    }

    await tx.journalEntry.update({
      where: { id: existing.id },
      data: { date, memo: `Pembayaran Piutang #${receivableId}` },
    });
    await tx.journalLine.deleteMany({ where: { entryId: existing.id } });
    await tx.journalLine.createMany({
      data: [
        { entryId: existing.id, accountId: cashId, debit: paidAmount, credit: 0 },
        { entryId: existing.id, accountId: arId, debit: 0, credit: paidAmount },
      ],
    });
  }
}
