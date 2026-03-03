import { ConflictException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CreateTaxCodeDto } from "./dto/create-tax-code.dto";
import { UpdateTaxCodeDto } from "./dto/update-tax-code.dto";
import { PostTaxSettlementDto } from "./dto/post-tax-settlement.dto";
import type { Prisma } from "@prisma/client";
import { DEFAULT_ACCOUNTS, DEFAULT_ACCOUNT_CODES } from "../accounts/accounts.defaults";

const DEFAULT_TAX_CODES = [
  { name: "PPN", code: "PPN", rate: 11, description: "Pajak Pertambahan Nilai" },
  { name: "PPh 23 NPWP", code: "PPH23", rate: 2, description: "PPh Pasal 23 dengan NPWP" },
  { name: "PPh 23 Non-NPWP", code: "PPH23-NN", rate: 4, description: "PPh Pasal 23 tanpa NPWP" },
];

@Injectable()
export class TaxesService {
  constructor(private readonly prisma: PrismaService) {}

  async listTaxCodes(userId: string, companyId: string) {
    await this.assertMember(userId, companyId);
    const existing = await this.prisma.taxCode.findMany({
      where: { companyId },
      orderBy: { createdAt: "asc" },
    });
    if (existing.length > 0) {
      return existing;
    }
    await this.prisma.taxCode.createMany({
      data: DEFAULT_TAX_CODES.map((code) => ({
        companyId,
        name: code.name,
        code: code.code,
        rate: code.rate,
        description: code.description,
      })),
      skipDuplicates: true,
    });
    return this.prisma.taxCode.findMany({
      where: { companyId },
      orderBy: { createdAt: "asc" },
    });
  }

  async createTaxCode(userId: string, companyId: string, dto: CreateTaxCodeDto) {
    await this.assertMember(userId, companyId);
    const code = dto.code.toUpperCase();
    const existing = await this.prisma.taxCode.findFirst({
      where: { companyId, code },
    });
    if (existing) {
      throw new ConflictException("Tax code already exists");
    }
    return this.prisma.taxCode.create({
      data: {
        companyId,
        name: String(dto.name ?? "").trim(),
        code,
        rate: dto.rate,
        description: dto.description ? String(dto.description).trim() : undefined,
      },
    });
  }

  async updateTaxCode(userId: string, companyId: string, taxCodeId: string, dto: UpdateTaxCodeDto) {
    await this.assertMember(userId, companyId);
    const existing = await this.prisma.taxCode.findFirst({
      where: { id: taxCodeId, companyId },
    });
    if (!existing) {
      throw new NotFoundException("Tax code not found");
    }
    if (dto.code) {
      const conflict = await this.prisma.taxCode.findFirst({
        where: { companyId, code: dto.code, id: { not: taxCodeId } },
      });
      if (conflict) {
        throw new ConflictException("Tax code already exists");
      }
    }
    return this.prisma.taxCode.update({
      where: { id: taxCodeId },
      data: {
        name: dto.name !== undefined ? String(dto.name).trim() : undefined,
        code: dto.code !== undefined ? String(dto.code).trim().toUpperCase() : undefined,
        rate: dto.rate,
        description: dto.description !== undefined ? String(dto.description).trim() : undefined,
      },
    });
  }

  async deleteTaxCode(userId: string, companyId: string, taxCodeId: string) {
    await this.assertMember(userId, companyId);
    const existing = await this.prisma.taxCode.findFirst({
      where: { id: taxCodeId, companyId },
    });
    if (!existing) {
      throw new NotFoundException("Tax code not found");
    }
    await this.prisma.taxCode.delete({ where: { id: taxCodeId } });
    return { success: true };
  }

  async postTaxSettlement(userId: string, companyId: string, dto: PostTaxSettlementDto) {
    await this.assertOwner(userId, companyId);
    return this.prisma.$transaction(async (tx) => {
      await this.ensureDefaultAccounts(tx, companyId);
      const taxPayableId = await this.getAccountIdByCode(tx, companyId, DEFAULT_ACCOUNT_CODES.taxPayable);
      const cashId = await this.getAccountIdByCode(tx, companyId, DEFAULT_ACCOUNT_CODES.cash);
      const entry = await tx.journalEntry.create({
        data: {
          companyId,
          date: dto.date ?? new Date(),
          memo: dto.memo ?? "Pembayaran Pajak",
          source: "tax_settlement",
        },
      });
      await tx.journalLine.createMany({
        data: [
          { entryId: entry.id, accountId: taxPayableId, debit: dto.amount, credit: 0 },
          { entryId: entry.id, accountId: cashId, debit: 0, credit: dto.amount },
        ],
      });
      return entry;
    });
  }

  private async assertMember(userId: string, companyId: string) {
    const membership = await this.prisma.companyMember.findUnique({
      where: { userId_companyId: { userId, companyId } },
    });
    if (!membership) {
      throw new ForbiddenException("Not a member of this company");
    }
  }

  private async assertOwner(userId: string, companyId: string) {
    const membership = await this.prisma.companyMember.findUnique({
      where: { userId_companyId: { userId, companyId } },
    });
    if (!membership || membership.role !== "owner") {
      throw new ForbiddenException("Owner role required");
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
}
