import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CreateFixedAssetDto } from "./dto/create-fixed-asset.dto";
import { UpdateFixedAssetDto } from "./dto/update-fixed-asset.dto";

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
    return this.prisma.fixedAsset.create({
      data: {
        companyId,
        name: String(dto.name ?? "").trim(),
        category: String(dto.category ?? "").trim(),
        acquisitionDate: dto.acquisitionDate,
        acquisitionCost: Number(dto.acquisitionCost),
        residualValue: Number(dto.residualValue ?? 0),
        usefulLifeMonths: Number(dto.usefulLifeMonths ?? 0),
        depreciationMethod: String(dto.depreciationMethod ?? "straight_line").trim(),
      },
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
    return this.prisma.fixedAsset.update({
      where: { id: assetId },
      data: {
        name: dto.name !== undefined ? String(dto.name).trim() : undefined,
        category: dto.category !== undefined ? String(dto.category).trim() : undefined,
        acquisitionDate: dto.acquisitionDate !== undefined ? dto.acquisitionDate : undefined,
        acquisitionCost: dto.acquisitionCost !== undefined ? Number(dto.acquisitionCost) : undefined,
        residualValue: dto.residualValue !== undefined ? Number(dto.residualValue) : undefined,
        usefulLifeMonths: dto.usefulLifeMonths !== undefined ? Number(dto.usefulLifeMonths) : undefined,
        depreciationMethod: dto.depreciationMethod !== undefined ? String(dto.depreciationMethod).trim() : undefined,
      },
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
    await this.prisma.fixedAsset.delete({ where: { id: assetId } });
    return { success: true };
  }

  private async assertMember(userId: string, companyId: string) {
    const membership = await this.prisma.companyMember.findUnique({
      where: { userId_companyId: { userId, companyId } },
    });
    if (!membership) {
      throw new ForbiddenException("Not a member of this company");
    }
  }
}
