import { ConflictException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CreateTaxCodeDto } from "./dto/create-tax-code.dto";
import { UpdateTaxCodeDto } from "./dto/update-tax-code.dto";

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

  private async assertMember(userId: string, companyId: string) {
    const membership = await this.prisma.companyMember.findUnique({
      where: { userId_companyId: { userId, companyId } },
    });
    if (!membership) {
      throw new ForbiddenException("Not a member of this company");
    }
  }
}
