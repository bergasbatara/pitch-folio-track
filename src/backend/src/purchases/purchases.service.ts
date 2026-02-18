import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CreatePurchaseDto } from "./dto/create-purchase.dto";
import { UpdatePurchaseDto } from "./dto/update-purchase.dto";

@Injectable()
export class PurchasesService {
  constructor(private readonly prisma: PrismaService) {}

  async listPurchases(userId: string, companyId: string) {
    await this.assertMember(userId, companyId);
    const purchases = await this.prisma.purchase.findMany({
      where: { companyId },
      include: {
        category: { select: { name: true } },
        product: { select: { name: true } },
      },
      orderBy: { date: "desc" },
    });
    return purchases.map((purchase) => ({
      ...purchase,
      categoryName: purchase.category.name,
      productName: purchase.product?.name ?? null,
    }));
  }

  async getPurchase(userId: string, companyId: string, purchaseId: string) {
    await this.assertMember(userId, companyId);
    const purchase = await this.prisma.purchase.findFirst({
      where: { id: purchaseId, companyId },
      include: {
        category: { select: { name: true } },
        product: { select: { name: true } },
      },
    });
    if (!purchase) {
      throw new NotFoundException("Purchase not found");
    }
    return {
      ...purchase,
      categoryName: purchase.category.name,
      productName: purchase.product?.name ?? null,
    };
  }

  async createPurchase(userId: string, companyId: string, dto: CreatePurchaseDto) {
    await this.assertMember(userId, companyId);
    return this.prisma.$transaction(async (tx) => {
      const category = await tx.purchaseCategory.findFirst({
        where: { id: dto.categoryId, companyId },
      });
      if (!category) {
        throw new NotFoundException("Category not found");
      }

      const product = dto.productId
        ? await tx.product.findFirst({
            where: { id: dto.productId, companyId },
          })
        : null;
      if (dto.productId && !product) {
        throw new NotFoundException("Product not found");
      }

      const purchase = await tx.purchase.create({
        data: {
          companyId,
          categoryId: category.id,
          productId: product?.id,
          itemName: String(dto.itemName ?? "").trim(),
          supplier: dto.supplier ? String(dto.supplier).trim() : undefined,
          quantity: dto.quantity,
          unitCost: dto.unitCost,
          totalCost: dto.quantity * dto.unitCost,
          date: dto.date ?? new Date(),
          notes: dto.notes ? String(dto.notes).trim() : undefined,
        },
        include: {
          category: { select: { name: true } },
          product: { select: { name: true } },
        },
      });

      if (product) {
        await tx.product.update({
          where: { id: product.id },
          data: { stock: product.stock + dto.quantity },
        });
      }

      return {
        ...purchase,
        categoryName: purchase.category.name,
        productName: purchase.product?.name ?? null,
      };
    });
  }

  async updatePurchase(userId: string, companyId: string, purchaseId: string, dto: UpdatePurchaseDto) {
    await this.assertMember(userId, companyId);
    return this.prisma.$transaction(async (tx) => {
      const purchase = await tx.purchase.findFirst({
        where: { id: purchaseId, companyId },
      });
      if (!purchase) {
        throw new NotFoundException("Purchase not found");
      }

      const nextCategoryId = dto.categoryId ?? purchase.categoryId;
      if (dto.categoryId && dto.categoryId !== purchase.categoryId) {
        const category = await tx.purchaseCategory.findFirst({
          where: { id: dto.categoryId, companyId },
        });
        if (!category) {
          throw new NotFoundException("Category not found");
        }
      }

      const nextProductId = dto.productId ?? purchase.productId;
      const nextQuantity = dto.quantity ?? purchase.quantity;
      const nextUnitCost = dto.unitCost ?? purchase.unitCost;

      if (nextProductId !== purchase.productId) {
        if (purchase.productId) {
          const oldProduct = await tx.product.findFirst({
            where: { id: purchase.productId, companyId },
          });
          if (!oldProduct) {
            throw new NotFoundException("Product not found");
          }
          const newStock = oldProduct.stock - purchase.quantity;
          if (newStock < 0) {
            throw new BadRequestException("Stock would become negative");
          }
          await tx.product.update({
            where: { id: oldProduct.id },
            data: { stock: newStock },
          });
        }

        if (nextProductId) {
          const newProduct = await tx.product.findFirst({
            where: { id: nextProductId, companyId },
          });
          if (!newProduct) {
            throw new NotFoundException("Product not found");
          }
          await tx.product.update({
            where: { id: newProduct.id },
            data: { stock: newProduct.stock + nextQuantity },
          });
        }
      } else if (nextProductId) {
        if (nextQuantity !== purchase.quantity) {
          const product = await tx.product.findFirst({
            where: { id: nextProductId, companyId },
          });
          if (!product) {
            throw new NotFoundException("Product not found");
          }
          const delta = nextQuantity - purchase.quantity;
          const newStock = product.stock + delta;
          if (newStock < 0) {
            throw new BadRequestException("Stock would become negative");
          }
          await tx.product.update({
            where: { id: product.id },
            data: { stock: newStock },
          });
        }
      }

      await tx.purchase.update({
        where: { id: purchase.id },
        data: {
          categoryId: nextCategoryId,
          productId: nextProductId,
          itemName: dto.itemName !== undefined ? String(dto.itemName).trim() : undefined,
          supplier: dto.supplier !== undefined ? String(dto.supplier).trim() : undefined,
          quantity: nextQuantity,
          unitCost: nextUnitCost,
          totalCost: nextQuantity * nextUnitCost,
          date: dto.date ?? purchase.date,
          notes: dto.notes !== undefined ? String(dto.notes).trim() : undefined,
        },
      });

      const refreshed = await tx.purchase.findFirst({
        where: { id: purchase.id, companyId },
        include: {
          category: { select: { name: true } },
          product: { select: { name: true } },
        },
      });

      if (!refreshed) {
        throw new NotFoundException("Purchase not found");
      }

      return {
        ...refreshed,
        categoryName: refreshed.category.name,
        productName: refreshed.product?.name ?? null,
      };
    });
  }

  async deletePurchase(userId: string, companyId: string, purchaseId: string) {
    await this.assertMember(userId, companyId);
    return this.prisma.$transaction(async (tx) => {
      const purchase = await tx.purchase.findFirst({
        where: { id: purchaseId, companyId },
      });
      if (!purchase) {
        throw new NotFoundException("Purchase not found");
      }

      if (purchase.productId) {
        const product = await tx.product.findFirst({
          where: { id: purchase.productId, companyId },
        });
        if (!product) {
          throw new NotFoundException("Product not found");
        }
        const newStock = product.stock - purchase.quantity;
        if (newStock < 0) {
          throw new BadRequestException("Stock would become negative");
        }
        await tx.product.update({
          where: { id: product.id },
          data: { stock: newStock },
        });
      }

      await tx.purchase.delete({ where: { id: purchase.id } });
      return { success: true };
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
}
