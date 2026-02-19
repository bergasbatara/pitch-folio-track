import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CreatePurchaseCategoryDto } from "./dto/create-purchase-category.dto";
import { UpdatePurchaseCategoryDto } from "./dto/update-purchase-category.dto";

@Injectable()
export class PurchaseCategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  async listCategories(userId: string, companyId: string) {
    await this.assertMember(userId, companyId);
    return this.prisma.purchaseCategory.findMany({
      where: { companyId },
      orderBy: { createdAt: "asc" },
    });
  }

  async createCategory(userId: string, companyId: string, dto: CreatePurchaseCategoryDto) {
    await this.assertMember(userId, companyId);
    return this.prisma.purchaseCategory.create({
      data: {
        companyId,
        name: String(dto.name ?? "").trim(),
      },
    });
  }

  async updateCategory(userId: string, companyId: string, categoryId: string, dto: UpdatePurchaseCategoryDto) {
    await this.assertMember(userId, companyId);
    const category = await this.prisma.purchaseCategory.findFirst({
      where: { id: categoryId, companyId },
    });
    if (!category) {
      throw new NotFoundException("Category not found");
    }
    return this.prisma.purchaseCategory.update({
      where: { id: categoryId },
      data: {
        name: dto.name !== undefined ? String(dto.name).trim() : undefined,
      },
    });
  }

  async deleteCategory(userId: string, companyId: string, categoryId: string) {
    await this.assertMember(userId, companyId);
    const category = await this.prisma.purchaseCategory.findFirst({
      where: { id: categoryId, companyId },
    });
    if (!category) {
      throw new NotFoundException("Category not found");
    }
    const inUse = await this.prisma.purchase.findFirst({
      where: { categoryId, companyId },
      select: { id: true },
    });
    if (inUse) {
      throw new BadRequestException("Category has purchases");
    }
    await this.prisma.purchaseCategory.delete({ where: { id: categoryId } });
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
