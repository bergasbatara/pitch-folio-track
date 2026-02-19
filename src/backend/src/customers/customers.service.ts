import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CreateCustomerDto } from "./dto/create-customer.dto";
import { UpdateCustomerDto } from "./dto/update-customer.dto";

@Injectable()
export class CustomersService {
  constructor(private readonly prisma: PrismaService) {}

  async listCustomers(userId: string, companyId: string) {
    await this.assertMember(userId, companyId);
    return this.prisma.customer.findMany({
      where: { companyId },
      orderBy: { createdAt: "desc" },
    });
  }

  async getCustomer(userId: string, companyId: string, customerId: string) {
    await this.assertMember(userId, companyId);
    const customer = await this.prisma.customer.findFirst({
      where: { id: customerId, companyId },
    });
    if (!customer) {
      throw new NotFoundException("Customer not found");
    }
    return customer;
  }

  async createCustomer(userId: string, companyId: string, dto: CreateCustomerDto) {
    await this.assertMember(userId, companyId);
    return this.prisma.customer.create({
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

  async updateCustomer(userId: string, companyId: string, customerId: string, dto: UpdateCustomerDto) {
    await this.assertMember(userId, companyId);
    const existing = await this.prisma.customer.findFirst({
      where: { id: customerId, companyId },
    });
    if (!existing) {
      throw new NotFoundException("Customer not found");
    }
    return this.prisma.customer.update({
      where: { id: customerId },
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

  async deleteCustomer(userId: string, companyId: string, customerId: string) {
    await this.assertMember(userId, companyId);
    const existing = await this.prisma.customer.findFirst({
      where: { id: customerId, companyId },
    });
    if (!existing) {
      throw new NotFoundException("Customer not found");
    }
    await this.prisma.customer.delete({ where: { id: customerId } });
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
