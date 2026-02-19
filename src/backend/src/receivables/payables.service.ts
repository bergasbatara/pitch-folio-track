import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CreatePayableDto } from "./dto/create-payable.dto";
import { UpdatePayableDto } from "./dto/update-payable.dto";

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
    return this.prisma.payable.create({
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

    return this.prisma.payable.update({
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
  }

  async deletePayable(userId: string, companyId: string, payableId: string) {
    await this.assertMember(userId, companyId);
    const existing = await this.prisma.payable.findFirst({
      where: { id: payableId, companyId },
    });
    if (!existing) {
      throw new NotFoundException("Payable not found");
    }
    await this.prisma.payable.delete({ where: { id: payableId } });
    return { success: true };
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
}
