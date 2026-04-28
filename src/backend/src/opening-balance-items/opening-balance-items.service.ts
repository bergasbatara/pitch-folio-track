import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { CreateOpeningBalanceItemDto } from "./dto/create-opening-balance-item.dto";
import { UpdateOpeningBalanceItemDto } from "./dto/update-opening-balance-item.dto";

const PERANTARA_CODE = "3999";
const PERANTARA_NAME = "Saldo Awal Sementara";
const JOURNAL_SOURCE = "opening_balance_item_le";

@Injectable()
export class OpeningBalanceItemsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(userId: string, companyId: string) {
    await this.assertMember(userId, companyId);
    return this.prisma.openingBalanceItem.findMany({
      where: { companyId },
      include: {
        account: { select: { id: true, code: true, name: true, type: true } },
      },
      orderBy: [{ asOfDate: "desc" }, { createdAt: "desc" }],
    });
  }

  async create(userId: string, companyId: string, dto: CreateOpeningBalanceItemDto) {
    await this.assertOwner(userId, companyId);
    const asOfDate = dto.asOfDate ?? new Date();
    const memo = dto.memo?.trim() || (dto.kind === "liability" ? "Saldo Awal Liabilitas" : "Saldo Awal Ekuitas");

    return this.prisma.$transaction(async (tx) => {
      const account = await this.getAccount(tx, companyId, dto.accountId);
      this.assertKindMatchesAccount(dto.kind, account.type);
      const perantara = await this.ensurePerantaraAccount(tx, companyId);

      const created = await tx.openingBalanceItem.create({
        data: {
          companyId,
          kind: dto.kind as any,
          accountId: dto.accountId,
          asOfDate,
          amount: dto.amount,
          memo,
        },
      });

      const entry = await tx.journalEntry.create({
        data: {
          companyId,
          date: asOfDate,
          memo,
          source: JOURNAL_SOURCE,
          sourceId: created.id,
          status: "posted",
        },
      });

      await tx.journalLine.createMany({
        data: [
          { entryId: entry.id, accountId: perantara.id, debit: dto.amount, credit: 0, memo: "Penyeimbang Saldo Awal" },
          { entryId: entry.id, accountId: dto.accountId, debit: 0, credit: dto.amount, memo: dto.memo?.trim() || "" },
        ],
      });

      return tx.openingBalanceItem.update({
        where: { id: created.id },
        data: { journalEntryId: entry.id },
        include: { account: { select: { id: true, code: true, name: true, type: true } } },
      });
    });
  }

  async update(userId: string, companyId: string, itemId: string, dto: UpdateOpeningBalanceItemDto) {
    await this.assertOwner(userId, companyId);

    return this.prisma.$transaction(async (tx) => {
      const existing = await tx.openingBalanceItem.findFirst({ where: { id: itemId, companyId } });
      if (!existing) throw new NotFoundException("Opening balance item not found");

      const nextKind = (dto.kind ?? existing.kind) as string;
      const nextAccountId = dto.accountId ?? existing.accountId;
      const nextAsOfDate = dto.asOfDate ?? existing.asOfDate;
      const nextAmount = dto.amount ?? existing.amount;
      const nextMemo =
        dto.memo !== undefined
          ? dto.memo.trim()
          : existing.memo ?? (nextKind === "liability" ? "Saldo Awal Liabilitas" : "Saldo Awal Ekuitas");

      const account = await this.getAccount(tx, companyId, nextAccountId);
      this.assertKindMatchesAccount(nextKind, account.type);
      const perantara = await this.ensurePerantaraAccount(tx, companyId);

      const updatedItem = await tx.openingBalanceItem.update({
        where: { id: existing.id },
        data: {
          kind: nextKind as any,
          accountId: nextAccountId,
          asOfDate: nextAsOfDate,
          amount: nextAmount,
          memo: nextMemo,
        },
        include: { account: { select: { id: true, code: true, name: true, type: true } } },
      });

      const journalEntryId = existing.journalEntryId;
      if (!journalEntryId) {
        // Shouldn't happen for this feature, but keep it resilient.
        const entry = await tx.journalEntry.create({
          data: {
            companyId,
            date: nextAsOfDate,
            memo: nextMemo,
            source: JOURNAL_SOURCE,
            sourceId: existing.id,
            status: "posted",
          },
        });
        await tx.journalLine.createMany({
          data: [
            { entryId: entry.id, accountId: perantara.id, debit: nextAmount, credit: 0, memo: "Penyeimbang Saldo Awal" },
            { entryId: entry.id, accountId: nextAccountId, debit: 0, credit: nextAmount, memo: dto.memo?.trim() || "" },
          ],
        });
        return tx.openingBalanceItem.update({
          where: { id: existing.id },
          data: { journalEntryId: entry.id },
          include: { account: { select: { id: true, code: true, name: true, type: true } } },
        });
      }

      await tx.journalEntry.update({
        where: { id: journalEntryId },
        data: { date: nextAsOfDate, memo: nextMemo, status: "posted", source: JOURNAL_SOURCE, sourceId: existing.id },
      });
      await tx.journalLine.deleteMany({ where: { entryId: journalEntryId } });
      await tx.journalLine.createMany({
        data: [
          { entryId: journalEntryId, accountId: perantara.id, debit: nextAmount, credit: 0, memo: "Penyeimbang Saldo Awal" },
          { entryId: journalEntryId, accountId: nextAccountId, debit: 0, credit: nextAmount, memo: dto.memo?.trim() || "" },
        ],
      });

      return updatedItem;
    });
  }

  async remove(userId: string, companyId: string, itemId: string) {
    await this.assertOwner(userId, companyId);
    const item = await this.prisma.openingBalanceItem.findFirst({ where: { id: itemId, companyId } });
    if (!item) throw new NotFoundException("Opening balance item not found");

    await this.prisma.$transaction(async (tx) => {
      if (item.journalEntryId) {
        await tx.journalEntry.delete({ where: { id: item.journalEntryId } });
      }
      await tx.openingBalanceItem.delete({ where: { id: item.id } });
    });

    return { success: true };
  }

  private async getAccount(tx: Prisma.TransactionClient, companyId: string, accountId: string) {
    const account = await tx.account.findFirst({
      where: { id: accountId, companyId },
      select: { id: true, code: true, name: true, type: true },
    });
    if (!account) throw new BadRequestException("Account not found");
    return account;
  }

  private assertKindMatchesAccount(kind: string, accountType: string) {
    if (kind === "liability" && accountType !== "liability") {
      throw new BadRequestException("Selected account is not a liability account");
    }
    if (kind === "equity" && accountType !== "equity") {
      throw new BadRequestException("Selected account is not an equity account");
    }
  }

  private async ensurePerantaraAccount(tx: Prisma.TransactionClient, companyId: string) {
    const existing = await tx.account.findFirst({ where: { companyId, code: PERANTARA_CODE } });
    if (existing) return existing;
    return tx.account.create({
      data: {
        companyId,
        code: PERANTARA_CODE,
        name: PERANTARA_NAME,
        type: "equity",
        normalBalance: "debit",
        isSystem: true,
      },
    });
  }

  private async assertMember(userId: string, companyId: string) {
    const membership = await this.prisma.companyMember.findUnique({
      where: { userId_companyId: { userId, companyId } },
    });
    if (!membership) throw new ForbiddenException("Not a member of this company");
    return membership;
  }

  private async assertOwner(userId: string, companyId: string) {
    const membership = await this.prisma.companyMember.findUnique({
      where: { userId_companyId: { userId, companyId } },
    });
    if (!membership || membership.role !== "owner") throw new ForbiddenException("Owner role required");
    return membership;
  }
}
