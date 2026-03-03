import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CreateJournalEntryDto } from "./dto/create-journal-entry.dto";
import { UpdateJournalEntryDto } from "./dto/update-journal-entry.dto";
import type { JournalLineDto } from "./dto/journal-line.dto";

@Injectable()
export class JournalsService {
  constructor(private readonly prisma: PrismaService) {}

  async listEntries(userId: string, companyId: string) {
    await this.assertMember(userId, companyId);
    return this.prisma.journalEntry.findMany({
      where: { companyId },
      include: {
        lines: {
          include: {
            account: { select: { id: true, code: true, name: true } },
          },
        },
      },
      orderBy: [{ date: "desc" }, { createdAt: "desc" }],
    });
  }

  async getEntry(userId: string, companyId: string, entryId: string) {
    await this.assertMember(userId, companyId);
    const entry = await this.prisma.journalEntry.findFirst({
      where: { id: entryId, companyId },
      include: {
        lines: {
          include: {
            account: { select: { id: true, code: true, name: true } },
          },
        },
      },
    });
    if (!entry) {
      throw new NotFoundException("Journal entry not found");
    }
    return entry;
  }

  async createEntry(userId: string, companyId: string, dto: CreateJournalEntryDto) {
    await this.assertOwner(userId, companyId);
    const { lines, totalDebit, totalCredit } = this.normalizeLines(dto.lines);
    if (totalDebit !== totalCredit) {
      throw new BadRequestException("Journal entry is not balanced");
    }

    await this.ensureAccounts(companyId, lines.map((l) => l.accountId));

    return this.prisma.$transaction(async (tx) => {
      const entry = await tx.journalEntry.create({
        data: {
          companyId,
          date: dto.date ?? new Date(),
          memo: dto.memo,
        },
      });
      await tx.journalLine.createMany({
        data: lines.map((line) => ({
          entryId: entry.id,
          accountId: line.accountId,
          debit: line.debit,
          credit: line.credit,
          memo: line.memo,
        })),
      });
      return tx.journalEntry.findFirst({
        where: { id: entry.id },
        include: {
          lines: {
            include: {
              account: { select: { id: true, code: true, name: true } },
            },
          },
        },
      });
    });
  }

  async updateEntry(userId: string, companyId: string, entryId: string, dto: UpdateJournalEntryDto) {
    await this.assertOwner(userId, companyId);
    const existing = await this.prisma.journalEntry.findFirst({
      where: { id: entryId, companyId },
    });
    if (!existing) {
      throw new NotFoundException("Journal entry not found");
    }
    if (existing.source) {
      throw new BadRequestException("System journal entry cannot be edited");
    }

    let normalizedLines: ReturnType<typeof this.normalizeLines> | null = null;
    if (dto.lines) {
      normalizedLines = this.normalizeLines(dto.lines);
      if (normalizedLines.totalDebit !== normalizedLines.totalCredit) {
        throw new BadRequestException("Journal entry is not balanced");
      }
      await this.ensureAccounts(companyId, normalizedLines.lines.map((l) => l.accountId));
    }

    return this.prisma.$transaction(async (tx) => {
      await tx.journalEntry.update({
        where: { id: entryId },
        data: {
          date: dto.date ?? existing.date,
          memo: dto.memo ?? existing.memo,
        },
      });

      if (normalizedLines) {
        await tx.journalLine.deleteMany({ where: { entryId } });
        await tx.journalLine.createMany({
          data: normalizedLines.lines.map((line) => ({
            entryId,
            accountId: line.accountId,
            debit: line.debit,
            credit: line.credit,
            memo: line.memo,
          })),
        });
      }

      return tx.journalEntry.findFirst({
        where: { id: entryId },
        include: {
          lines: {
            include: {
              account: { select: { id: true, code: true, name: true } },
            },
          },
        },
      });
    });
  }

  async deleteEntry(userId: string, companyId: string, entryId: string) {
    await this.assertOwner(userId, companyId);
    const existing = await this.prisma.journalEntry.findFirst({
      where: { id: entryId, companyId },
    });
    if (!existing) {
      throw new NotFoundException("Journal entry not found");
    }
    if (existing.source) {
      throw new BadRequestException("System journal entry cannot be deleted");
    }
    await this.prisma.journalEntry.delete({ where: { id: entryId } });
    return { success: true };
  }

  private normalizeLines(lines: JournalLineDto[]) {
    if (!lines?.length || lines.length < 2) {
      throw new BadRequestException("At least 2 journal lines are required");
    }
    let totalDebit = 0;
    let totalCredit = 0;
    const normalized = lines.map((line) => {
      const debit = Number(line.debit ?? 0);
      const credit = Number(line.credit ?? 0);
      if ((debit > 0 && credit > 0) || (debit === 0 && credit === 0)) {
        throw new BadRequestException("Each line must have either debit or credit");
      }
      totalDebit += debit;
      totalCredit += credit;
      return {
        accountId: line.accountId,
        debit,
        credit,
        memo: line.memo,
      };
    });
    return { lines: normalized, totalDebit, totalCredit };
  }

  private async ensureAccounts(companyId: string, accountIds: string[]) {
    const uniqueIds = Array.from(new Set(accountIds));
    const count = await this.prisma.account.count({
      where: { companyId, id: { in: uniqueIds } },
    });
    if (count !== uniqueIds.length) {
      throw new BadRequestException("One or more accounts are invalid");
    }
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

  private async assertOwner(userId: string, companyId: string) {
    const membership = await this.prisma.companyMember.findUnique({
      where: { userId_companyId: { userId, companyId } },
    });
    if (!membership || membership.role !== "owner") {
      throw new ForbiddenException("Owner role required");
    }
    return membership;
  }
}
