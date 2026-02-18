<<<<<<< HEAD
import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CreateSaleDto } from "./dto/create-sale.dto";
import { UpdateSaleDto } from "./dto/update-sale.dto";
=======
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSaleDto } from './dto/create-sale.dto';
import { UpdateSaleDto } from './dto/update-sale.dto';
>>>>>>> 0849f75 (Auth db error)

@Injectable()
export class SalesService {
  constructor(private readonly prisma: PrismaService) {}

  async listSales(userId: string, companyId: string) {
    await this.assertMember(userId, companyId);
    const sales = await this.prisma.sale.findMany({
      where: { companyId },
      include: { product: { select: { name: true } } },
<<<<<<< HEAD
      orderBy: { soldAt: "desc" },
    });
=======
      orderBy: { soldAt: 'desc' },
    });

>>>>>>> 0849f75 (Auth db error)
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
<<<<<<< HEAD
    if (!sale) {
      throw new NotFoundException("Sale not found");
    }
=======

    if (!sale) {
      throw new NotFoundException('Sale not found');
    }

>>>>>>> 0849f75 (Auth db error)
    return { ...sale, productName: sale.product.name };
  }

  async createSale(userId: string, companyId: string, dto: CreateSaleDto) {
    await this.assertMember(userId, companyId);
<<<<<<< HEAD
=======

>>>>>>> 0849f75 (Auth db error)
    return this.prisma.$transaction(async (tx) => {
      const product = await tx.product.findFirst({
        where: { id: dto.productId, companyId },
      });
<<<<<<< HEAD
      if (!product) {
        throw new NotFoundException("Product not found");
      }
      if (product.stock < dto.quantity) {
        throw new BadRequestException("Insufficient stock");
      }
=======

      if (!product) {
        throw new NotFoundException('Product not found');
      }

      if (product.stock < dto.quantity) {
        throw new BadRequestException('Insufficient stock');
      }

>>>>>>> 0849f75 (Auth db error)
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
<<<<<<< HEAD
=======

>>>>>>> 0849f75 (Auth db error)
      await tx.product.update({
        where: { id: product.id },
        data: { stock: product.stock - dto.quantity },
      });
<<<<<<< HEAD
=======

>>>>>>> 0849f75 (Auth db error)
      return { ...sale, productName: product.name };
    });
  }

  async updateSale(userId: string, companyId: string, saleId: string, dto: UpdateSaleDto) {
    await this.assertMember(userId, companyId);
<<<<<<< HEAD
=======

>>>>>>> 0849f75 (Auth db error)
    return this.prisma.$transaction(async (tx) => {
      const sale = await tx.sale.findFirst({
        where: { id: saleId, companyId },
      });
<<<<<<< HEAD
      if (!sale) {
        throw new NotFoundException("Sale not found");
=======

      if (!sale) {
        throw new NotFoundException('Sale not found');
>>>>>>> 0849f75 (Auth db error)
      }

      const targetProductId = dto.productId ?? sale.productId;
      const quantity = dto.quantity ?? sale.quantity;
      const pricePerUnit = dto.pricePerUnit ?? sale.pricePerUnit;

      if (targetProductId !== sale.productId) {
        const oldProduct = await tx.product.findFirst({
          where: { id: sale.productId, companyId },
        });
        const newProduct = await tx.product.findFirst({
          where: { id: targetProductId, companyId },
        });
<<<<<<< HEAD
        if (!oldProduct || !newProduct) {
          throw new NotFoundException("Product not found");
        }
        if (newProduct.stock < quantity) {
          throw new BadRequestException("Insufficient stock");
        }
=======

        if (!oldProduct || !newProduct) {
          throw new NotFoundException('Product not found');
        }

        if (newProduct.stock < quantity) {
          throw new BadRequestException('Insufficient stock');
        }

>>>>>>> 0849f75 (Auth db error)
        await tx.product.update({
          where: { id: oldProduct.id },
          data: { stock: oldProduct.stock + sale.quantity },
        });
<<<<<<< HEAD
=======

>>>>>>> 0849f75 (Auth db error)
        await tx.product.update({
          where: { id: newProduct.id },
          data: { stock: newProduct.stock - quantity },
        });
      } else if (quantity !== sale.quantity) {
        const product = await tx.product.findFirst({
          where: { id: sale.productId, companyId },
        });
<<<<<<< HEAD
        if (!product) {
          throw new NotFoundException("Product not found");
        }
        const delta = quantity - sale.quantity;
        if (delta > 0 && product.stock < delta) {
          throw new BadRequestException("Insufficient stock");
        }
=======

        if (!product) {
          throw new NotFoundException('Product not found');
        }

        const delta = quantity - sale.quantity;
        if (delta > 0 && product.stock < delta) {
          throw new BadRequestException('Insufficient stock');
        }

>>>>>>> 0849f75 (Auth db error)
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
<<<<<<< HEAD
        productName: product?.name ?? "",
=======
        productName: product?.name ?? '',
>>>>>>> 0849f75 (Auth db error)
      };
    });
  }

  async deleteSale(userId: string, companyId: string, saleId: string) {
    await this.assertMember(userId, companyId);
<<<<<<< HEAD
=======

>>>>>>> 0849f75 (Auth db error)
    return this.prisma.$transaction(async (tx) => {
      const sale = await tx.sale.findFirst({
        where: { id: saleId, companyId },
      });
<<<<<<< HEAD
      if (!sale) {
        throw new NotFoundException("Sale not found");
      }
      const product = await tx.product.findFirst({
        where: { id: sale.productId, companyId },
      });
=======

      if (!sale) {
        throw new NotFoundException('Sale not found');
      }

      const product = await tx.product.findFirst({
        where: { id: sale.productId, companyId },
      });

>>>>>>> 0849f75 (Auth db error)
      if (product) {
        await tx.product.update({
          where: { id: product.id },
          data: { stock: product.stock + sale.quantity },
        });
      }
<<<<<<< HEAD
=======

>>>>>>> 0849f75 (Auth db error)
      await tx.sale.delete({ where: { id: sale.id } });
      return { success: true };
    });
  }

  private async assertMember(userId: string, companyId: string) {
    const membership = await this.prisma.companyMember.findUnique({
      where: { userId_companyId: { userId, companyId } },
    });
    if (!membership) {
<<<<<<< HEAD
      throw new ForbiddenException("Not a member of this company");
=======
      throw new ForbiddenException('Not a member of this company');
>>>>>>> 0849f75 (Auth db error)
    }
  }
}
