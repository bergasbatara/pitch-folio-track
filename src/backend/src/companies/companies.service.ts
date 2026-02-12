import { ConflictException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CreateCompanyDto } from "./dto/create-company.dto";
import { UpdateCompanyDto } from "./dto/update-company.dto";
import { AddMemberDto } from "./dto/add-member.dto";

@Injectable()
export class CompaniesService {
  constructor(private readonly prisma: PrismaService) {}

  async createCompany(userId: string, dto: CreateCompanyDto) {
    return this.prisma.$transaction(async (tx) => {
      const company = await tx.company.create({
        data: {
          name: String(dto.name ?? "").trim(),
          address: dto.address ? String(dto.address).trim() : undefined,
          phone: dto.phone ? String(dto.phone).trim() : undefined,
          email: dto.email ? String(dto.email).trim() : undefined,
          taxId: dto.taxId ? String(dto.taxId).trim() : undefined,
          currency: dto.currency ? String(dto.currency).trim() : "IDR",
        },
      });
      await tx.companyMember.create({
        data: {
          userId,
          companyId: company.id,
          role: "owner",
        },
      });
      return company;
    });
  }

  async listCompanies(userId: string) {
    const memberships = await this.prisma.companyMember.findMany({
      where: { userId },
      include: { company: true },
      orderBy: { createdAt: "asc" },
    });
    return memberships.map((membership) => ({
      role: membership.role,
      company: membership.company,
    }));
  }

  async getCurrentCompany(userId: string) {
    const membership = await this.prisma.companyMember.findFirst({
      where: { userId },
      include: { company: true },
      orderBy: { createdAt: "asc" },
    });
    if (!membership) {
      throw new NotFoundException("No company found for user");
    }
    return membership.company;
  }

  async getCompany(userId: string, companyId: string) {
    await this.assertMember(userId, companyId);
    const company = await this.prisma.company.findUnique({
      where: { id: companyId },
    });
    if (!company) {
      throw new NotFoundException("Company not found");
    }
    return company;
  }

  async updateCompany(userId: string, companyId: string, dto: UpdateCompanyDto) {
    await this.assertOwner(userId, companyId);
    return this.prisma.company.update({
      where: { id: companyId },
      data: {
        name: dto.name,
        address: dto.address,
        phone: dto.phone,
        email: dto.email,
        taxId: dto.taxId,
        currency: dto.currency,
      },
    });
  }

  async listMembers(userId: string, companyId: string) {
    await this.assertMember(userId, companyId);
    return this.prisma.companyMember.findMany({
      where: { companyId },
      include: {
        user: {
          select: { id: true, email: true, name: true, avatar: true },
        },
      },
      orderBy: { createdAt: "asc" },
    });
  }

  async addMember(userId: string, companyId: string, dto: AddMemberDto) {
    await this.assertOwner(userId, companyId);
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (!user) {
      throw new NotFoundException("User not found");
    }
    const existing = await this.prisma.companyMember.findUnique({
      where: { userId_companyId: { userId: user.id, companyId } },
    });
    if (existing) {
      throw new ConflictException("User is already a member");
    }
    return this.prisma.companyMember.create({
      data: {
        userId: user.id,
        companyId,
        role: dto.role ?? "member",
      },
    });
  }

  async removeMember(userId: string, companyId: string, memberUserId: string) {
    await this.assertOwner(userId, companyId);
    if (userId === memberUserId) {
      throw new ForbiddenException("Cannot remove yourself");
    }
    const membership = await this.prisma.companyMember.findUnique({
      where: { userId_companyId: { userId: memberUserId, companyId } },
    });
    if (!membership) {
      throw new NotFoundException("Membership not found");
    }
    await this.prisma.companyMember.delete({
      where: { userId_companyId: { userId: memberUserId, companyId } },
    });
    return { success: true };
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
