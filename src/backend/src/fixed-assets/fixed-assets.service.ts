import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CreateFixedAssetDto } from "./dto/create-fixed-asset.dto";
import { UpdateFixedAssetDto } from "./dto/update-fixed-asset.dto";
import type { Prisma } from "@prisma/client";
import { DEFAULT_ACCOUNTS, DEFAULT_ACCOUNT_CODES } from "../accounts/accounts.defaults";

@Injectable()
export class FixedAssetsService {
  constructor(private readonly prisma: PrismaService) {}

  async listAssets(userId: string, companyId: string) {
    await this.assertMember(userId, companyId);
    return this.prisma.fixedAsset.findMany({
      where: { companyId },
      orderBy: { createdAt: "desc" },
    });
  }

  async getAsset(userId: string, companyId: string, assetId: string) {
    await this.assertMember(userId, companyId);
    const asset = await this.prisma.fixedAsset.findFirst({
      where: { id: assetId, companyId },
    });
    if (!asset) {
      throw new NotFoundException("Fixed asset not found");
    }
    return asset;
  }

  async createAsset(userId: string, companyId: string, dto: CreateFixedAssetDto) {
    await this.assertMember(userId, companyId);
    return this.prisma.$transaction(async (tx) => {
      const asset = await tx.fixedAsset.create({
        data: {
          companyId,
          name: String(dto.name ?? "").trim(),
          assetType: String(dto.assetType ?? "tetap").trim(),
          category: String(dto.category ?? "").trim(),
          acquisitionDate: dto.acquisitionDate,
          acquisitionCost: Number(dto.acquisitionCost),
          residualValue: Number(dto.residualValue ?? 0),
          usefulLifeMonths: Number(dto.usefulLifeMonths ?? 0),
          depreciationMethod: String(dto.depreciationMethod ?? "straight_line").trim(),
        },
      });
      await this.upsertAcquisitionJournal(tx, companyId, asset.id, asset.acquisitionCost, asset.acquisitionDate);
      return asset;
    });
  }

  async updateAsset(userId: string, companyId: string, assetId: string, dto: UpdateFixedAssetDto) {
    await this.assertMember(userId, companyId);
    const existing = await this.prisma.fixedAsset.findFirst({
      where: { id: assetId, companyId },
    });
    if (!existing) {
      throw new NotFoundException("Fixed asset not found");
    }
    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.fixedAsset.update({
        where: { id: assetId },
        data: {
          name: dto.name !== undefined ? String(dto.name).trim() : undefined,
          assetType: dto.assetType !== undefined ? String(dto.assetType).trim() : undefined,
          category: dto.category !== undefined ? String(dto.category).trim() : undefined,
          acquisitionDate: dto.acquisitionDate !== undefined ? dto.acquisitionDate : undefined,
          acquisitionCost: dto.acquisitionCost !== undefined ? Number(dto.acquisitionCost) : undefined,
          residualValue: dto.residualValue !== undefined ? Number(dto.residualValue) : undefined,
          usefulLifeMonths: dto.usefulLifeMonths !== undefined ? Number(dto.usefulLifeMonths) : undefined,
          depreciationMethod: dto.depreciationMethod !== undefined ? String(dto.depreciationMethod).trim() : undefined,
        },
      });
      await this.upsertAcquisitionJournal(tx, companyId, updated.id, updated.acquisitionCost, updated.acquisitionDate);
      return updated;
    });
  }

  async deleteAsset(userId: string, companyId: string, assetId: string) {
    await this.assertMember(userId, companyId);
    const existing = await this.prisma.fixedAsset.findFirst({
      where: { id: assetId, companyId },
    });
    if (!existing) {
      throw new NotFoundException("Fixed asset not found");
    }
    return this.prisma.$transaction(async (tx) => {
      await tx.journalEntry.deleteMany({
        where: { companyId, sourceId: assetId, source: "fixed_asset" },
      });
      await tx.journalEntry.deleteMany({
        where: { companyId, source: "depreciation", sourceId: { startsWith: `${assetId}:` } },
      });
      await tx.fixedAsset.delete({ where: { id: assetId } });
      return { success: true };
    });
  }

  async postDepreciation(userId: string, companyId: string, assetId: string, date?: Date) {
    await this.assertMember(userId, companyId);
    const asset = await this.prisma.fixedAsset.findFirst({ where: { id: assetId, companyId } });
    if (!asset) {
      throw new NotFoundException("Fixed asset not found");
    }
    if (asset.usefulLifeMonths <= 0) {
      throw new BadRequestException("Asset has no depreciation");
    }
    const depreciable = asset.acquisitionCost - asset.residualValue;
    const monthly = Math.round(depreciable / asset.usefulLifeMonths);
    const entryDate = date ?? new Date();
    const periodKey = `${entryDate.getFullYear()}-${String(entryDate.getMonth() + 1).padStart(2, "0")}`;
    const sourceId = `${asset.id}:${periodKey}`;

    return this.prisma.$transaction(async (tx) => {
      await this.ensureDefaultAccounts(tx, companyId);
      const expenseId = await this.getAccountIdByCode(tx, companyId, DEFAULT_ACCOUNT_CODES.depreciationExpense);
      const accDepId = await this.getAccountIdByCode(tx, companyId, DEFAULT_ACCOUNT_CODES.accumulatedDepreciation);

      const existing = await tx.journalEntry.findFirst({
        where: { companyId, source: "depreciation", sourceId },
      });

      if (!existing) {
        const entry = await tx.journalEntry.create({
          data: {
            companyId,
            date: entryDate,
            memo: `Penyusutan ${asset.name} (${periodKey})`,
            source: "depreciation",
            sourceId,
          },
        });
        await tx.journalLine.createMany({
          data: [
            { entryId: entry.id, accountId: expenseId, debit: monthly, credit: 0 },
            { entryId: entry.id, accountId: accDepId, debit: 0, credit: monthly },
          ],
        });
        return entry;
      }

      await tx.journalEntry.update({
        where: { id: existing.id },
        data: { date: entryDate, memo: `Penyusutan ${asset.name} (${periodKey})` },
      });
      await tx.journalLine.deleteMany({ where: { entryId: existing.id } });
      await tx.journalLine.createMany({
        data: [
          { entryId: existing.id, accountId: expenseId, debit: monthly, credit: 0 },
          { entryId: existing.id, accountId: accDepId, debit: 0, credit: monthly },
        ],
      });
      return existing;
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

  private async upsertAcquisitionJournal(
    tx: Prisma.TransactionClient,
    companyId: string,
    assetId: string,
    amount: number,
    date: Date,
  ) {
    await this.ensureDefaultAccounts(tx, companyId);
    const assetIdAccount = await this.getAccountIdByCode(tx, companyId, DEFAULT_ACCOUNT_CODES.fixedAsset);
    const cashId = await this.getAccountIdByCode(tx, companyId, DEFAULT_ACCOUNT_CODES.cash);

    const existing = await tx.journalEntry.findFirst({
      where: { companyId, source: "fixed_asset", sourceId: assetId },
    });

    if (!existing) {
      const entry = await tx.journalEntry.create({
        data: {
          companyId,
          date,
          memo: `Perolehan Aset #${assetId}`,
          source: "fixed_asset",
          sourceId: assetId,
        },
      });
      await tx.journalLine.createMany({
        data: [
          { entryId: entry.id, accountId: assetIdAccount, debit: amount, credit: 0 },
          { entryId: entry.id, accountId: cashId, debit: 0, credit: amount },
        ],
      });
      return;
    }

    await tx.journalEntry.update({
      where: { id: existing.id },
      data: { date, memo: `Perolehan Aset #${assetId}` },
    });
    await tx.journalLine.deleteMany({ where: { entryId: existing.id } });
    await tx.journalLine.createMany({
      data: [
        { entryId: existing.id, accountId: assetIdAccount, debit: amount, credit: 0 },
        { entryId: existing.id, accountId: cashId, debit: 0, credit: amount },
      ],
    });
  }
}
