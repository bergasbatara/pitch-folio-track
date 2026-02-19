import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CreateReceivableDto } from "./dto/create-receivable.dto";
import { UpdateReceivableDto } from "./dto/update-receivable.dto";

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
    return this.prisma.receivable.create({
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

    return this.prisma.receivable.update({
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
  }

  async deleteReceivable(userId: string, companyId: string, receivableId: string) {
    await this.assertMember(userId, companyId);
    const existing = await this.prisma.receivable.findFirst({
      where: { id: receivableId, companyId },
    });
    if (!existing) {
      throw new NotFoundException("Receivable not found");
    }
    await this.prisma.receivable.delete({ where: { id: receivableId } });
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
