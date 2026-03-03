import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CreateAccountDto } from "./dto/create-account.dto";
import { UpdateAccountDto } from "./dto/update-account.dto";
import { DEFAULT_ACCOUNTS } from "./accounts.defaults";

@Injectable()
export class AccountsService {
  constructor(private readonly prisma: PrismaService) {}

  async listAccounts(userId: string, companyId: string) {
    await this.assertMember(userId, companyId);
    await this.ensureDefaults(companyId);
    return this.prisma.account.findMany({
      where: { companyId },
      orderBy: { code: "asc" },
    });
  }

  async getAccount(userId: string, companyId: string, accountId: string) {
    await this.assertMember(userId, companyId);
    const account = await this.prisma.account.findFirst({
      where: { id: accountId, companyId },
    });
    if (!account) {
      throw new NotFoundException("Account not found");
    }
    return account;
  }

  async createAccount(userId: string, companyId: string, dto: CreateAccountDto) {
    await this.assertOwner(userId, companyId);
    try {
      return await this.prisma.account.create({
        data: {
          companyId,
          code: String(dto.code ?? "").trim(),
          name: String(dto.name ?? "").trim(),
          type: String(dto.type ?? "").trim(),
          normalBalance: String(dto.normalBalance ?? "").trim(),
          isSystem: false,
        },
      });
    } catch (error: any) {
      if (error?.code === "P2002") {
        throw new ConflictException("Account code already exists");
      }
      throw error;
    }
  }

  async updateAccount(userId: string, companyId: string, accountId: string, dto: UpdateAccountDto) {
    await this.assertOwner(userId, companyId);
    const existing = await this.prisma.account.findFirst({
      where: { id: accountId, companyId },
    });
    if (!existing) {
      throw new NotFoundException("Account not found");
    }
    try {
      return await this.prisma.account.update({
        where: { id: accountId },
        data: {
          code: dto.code !== undefined ? String(dto.code).trim() : undefined,
          name: dto.name !== undefined ? String(dto.name).trim() : undefined,
          type: dto.type !== undefined ? String(dto.type).trim() : undefined,
          normalBalance: dto.normalBalance !== undefined ? String(dto.normalBalance).trim() : undefined,
        },
      });
    } catch (error: any) {
      if (error?.code === "P2002") {
        throw new ConflictException("Account code already exists");
      }
      throw error;
    }
  }

  async deleteAccount(userId: string, companyId: string, accountId: string) {
    await this.assertOwner(userId, companyId);
    const existing = await this.prisma.account.findFirst({
      where: { id: accountId, companyId },
    });
    if (!existing) {
      throw new NotFoundException("Account not found");
    }
    const used = await this.prisma.journalLine.count({ where: { accountId } });
    if (used > 0) {
      throw new BadRequestException("Account is used in journal entries");
    }
    await this.prisma.account.delete({ where: { id: accountId } });
    return { success: true };
  }

  private async ensureDefaults(companyId: string) {
    const count = await this.prisma.account.count({ where: { companyId } });
    if (count > 0) return;
    await this.prisma.account.createMany({
      data: DEFAULT_ACCOUNTS.map((acc) => ({ ...acc, companyId })),
      skipDuplicates: true,
    });
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
