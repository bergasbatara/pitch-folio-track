import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CreateSaleDto } from "./dto/create-sale.dto";
import { UpdateSaleDto } from "./dto/update-sale.dto";

@Injectable()
export class SalesService {
  constructor(private readonly prisma: PrismaService) {}

  async listSales(userId: string, companyId: string) {
    await this.assertMember(userId, companyId);
    const sales = await this.prisma.sale.findMany({
      where: { companyId },
      include: { product: { select: { name: true } } },
      orderBy: { soldAt: "desc" },
    });
    return sales.map((sale) => ({
      ...sale,
      productName: sale.product.name,
    }));
  }

  async getSale(userId: string, companyId: string, saleId: string) {
    await this.assertMember(userId, companyId);
    const sale = await this.prisma.sale.findFirst({
      where: { id: saleId, companyId },
      include: { product: { select: { name: true } } },
    });
    if (!sale) {
      throw new NotFoundException("Sale not found");
    }
    return { ...sale, productName: sale.product.name };
  }

  async createSale(userId: string, companyId: string, dto: CreateSaleDto) {
    await this.assertMember(userId, companyId);
    return this.prisma.$transaction(async (tx) => {
      if (!dto.productId && !dto.productCode) {
        throw new BadRequestException("Product is required");
      }
      const product = await tx.product.findFirst({
        where: dto.productId
          ? { id: dto.productId, companyId }
          : { code: dto.productCode, companyId },
      });
      if (!product) {
        throw new NotFoundException("Product not found");
      }
      if (product.stock < dto.quantity) {
        throw new BadRequestException("Insufficient stock");
      }
      const totalPrice = dto.quantity * dto.pricePerUnit;
      const sale = await tx.sale.create({
        data: {
          companyId,
          productId: product.id,
          quantity: dto.quantity,
          pricePerUnit: dto.pricePerUnit,
          totalPrice,
          soldAt: dto.soldAt ?? new Date(),
        },
      });
      await tx.product.update({
        where: { id: product.id },
        data: { stock: product.stock - dto.quantity },
      });
      return { ...sale, productName: product.name };
    });
  }

  async updateSale(userId: string, companyId: string, saleId: string, dto: UpdateSaleDto) {
    await this.assertMember(userId, companyId);
    return this.prisma.$transaction(async (tx) => {
      const sale = await tx.sale.findFirst({
        where: { id: saleId, companyId },
      });
      if (!sale) {
        throw new NotFoundException("Sale not found");
      }

      const resolvedProductId = dto.productCode
        ? (await tx.product.findFirst({
            where: { companyId, code: dto.productCode },
            select: { id: true },
          }))?.id
        : dto.productId;
      if (dto.productCode && !resolvedProductId) {
        throw new NotFoundException("Product not found");
      }
      const targetProductId = resolvedProductId ?? sale.productId;
      const quantity = dto.quantity ?? sale.quantity;
      const pricePerUnit = dto.pricePerUnit ?? sale.pricePerUnit;

      if (targetProductId !== sale.productId) {
        const oldProduct = await tx.product.findFirst({
          where: { id: sale.productId, companyId },
        });
        const newProduct = await tx.product.findFirst({
          where: { id: targetProductId, companyId },
        });
        if (!oldProduct || !newProduct) {
          throw new NotFoundException("Product not found");
        }
        if (newProduct.stock < quantity) {
          throw new BadRequestException("Insufficient stock");
        }
        await tx.product.update({
          where: { id: oldProduct.id },
          data: { stock: oldProduct.stock + sale.quantity },
        });
        await tx.product.update({
          where: { id: newProduct.id },
          data: { stock: newProduct.stock - quantity },
        });
      } else if (quantity !== sale.quantity) {
        const product = await tx.product.findFirst({
          where: { id: sale.productId, companyId },
        });
        if (!product) {
          throw new NotFoundException("Product not found");
        }
        const delta = quantity - sale.quantity;
        if (delta > 0 && product.stock < delta) {
          throw new BadRequestException("Insufficient stock");
        }
        await tx.product.update({
          where: { id: product.id },
          data: { stock: product.stock - delta },
        });
      }

      const updated = await tx.sale.update({
        where: { id: sale.id },
        data: {
          productId: targetProductId,
          quantity,
          pricePerUnit,
          totalPrice: quantity * pricePerUnit,
          soldAt: dto.soldAt ?? sale.soldAt,
        },
      });

      const product = await tx.product.findFirst({
        where: { id: updated.productId, companyId },
      });

      return {
        ...updated,
        productName: product?.name ?? "",
      };
    });
  }

  async deleteSale(userId: string, companyId: string, saleId: string) {
    await this.assertMember(userId, companyId);
    return this.prisma.$transaction(async (tx) => {
      const sale = await tx.sale.findFirst({
        where: { id: saleId, companyId },
      });
      if (!sale) {
        throw new NotFoundException("Sale not found");
      }
      const product = await tx.product.findFirst({
        where: { id: sale.productId, companyId },
      });
      if (product) {
        await tx.product.update({
          where: { id: product.id },
          data: { stock: product.stock + sale.quantity },
        });
      }
      await tx.sale.delete({ where: { id: sale.id } });
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
