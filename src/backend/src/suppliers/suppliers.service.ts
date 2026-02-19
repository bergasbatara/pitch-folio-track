import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CreateSupplierDto } from "./dto/create-supplier.dto";
import { UpdateSupplierDto } from "./dto/update-supplier.dto";

@Injectable()
export class SuppliersService {
  constructor(private readonly prisma: PrismaService) {}

  async listSuppliers(userId: string, companyId: string) {
    await this.assertMember(userId, companyId);
    return this.prisma.supplier.findMany({
      where: { companyId },
      orderBy: { createdAt: "desc" },
    });
  }

  async getSupplier(userId: string, companyId: string, supplierId: string) {
    await this.assertMember(userId, companyId);
    const supplier = await this.prisma.supplier.findFirst({
      where: { id: supplierId, companyId },
    });
    if (!supplier) {
      throw new NotFoundException("Supplier not found");
    }
    return supplier;
  }

  async createSupplier(userId: string, companyId: string, dto: CreateSupplierDto) {
    await this.assertMember(userId, companyId);
    return this.prisma.supplier.create({
      data: {
        companyId,
        name: String(dto.name ?? "").trim(),
        type: String(dto.type ?? "").trim(),
        address: dto.address ? String(dto.address).trim() : undefined,
        email: dto.email ? String(dto.email).trim() : undefined,
        phone: dto.phone ? String(dto.phone).trim() : undefined,
        npwp: dto.npwp ? String(dto.npwp).trim() : undefined,
      },
    });
  }

  async updateSupplier(userId: string, companyId: string, supplierId: string, dto: UpdateSupplierDto) {
    await this.assertMember(userId, companyId);
    const existing = await this.prisma.supplier.findFirst({
      where: { id: supplierId, companyId },
    });
    if (!existing) {
      throw new NotFoundException("Supplier not found");
    }
    return this.prisma.supplier.update({
      where: { id: supplierId },
      data: {
        name: dto.name !== undefined ? String(dto.name).trim() : undefined,
        type: dto.type !== undefined ? String(dto.type).trim() : undefined,
        address: dto.address !== undefined ? String(dto.address).trim() : undefined,
        email: dto.email !== undefined ? String(dto.email).trim() : undefined,
        phone: dto.phone !== undefined ? String(dto.phone).trim() : undefined,
        npwp: dto.npwp !== undefined ? String(dto.npwp).trim() : undefined,
      },
    });
  }

  async deleteSupplier(userId: string, companyId: string, supplierId: string) {
    await this.assertMember(userId, companyId);
    const existing = await this.prisma.supplier.findFirst({
      where: { id: supplierId, companyId },
    });
    if (!existing) {
      throw new NotFoundException("Supplier not found");
    }
    await this.prisma.supplier.delete({ where: { id: supplierId } });
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
