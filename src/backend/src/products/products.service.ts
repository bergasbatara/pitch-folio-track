import { ConflictException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CreateProductDto } from "./dto/create-product.dto";
import { UpdateProductDto } from "./dto/update-product.dto";

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  async listProducts(userId: string, companyId: string) {
    await this.assertMember(userId, companyId);
    return this.prisma.product.findMany({
      where: { companyId },
      orderBy: { createdAt: "desc" },
    });
  }

  async getProduct(userId: string, companyId: string, productId: string) {
    await this.assertMember(userId, companyId);
    const product = await this.prisma.product.findFirst({
      where: { id: productId, companyId },
    });
    if (!product) {
      throw new NotFoundException("Product not found");
    }
    return product;
  }

  async createProduct(userId: string, companyId: string, dto: CreateProductDto) {
    await this.assertMember(userId, companyId);
    const code = dto.code ?? (await this.generateCode(companyId));
    if (code) {
      const existing = await this.prisma.product.findFirst({
        where: { companyId, code },
      });
      if (existing) {
        throw new ConflictException("Product code already exists");
      }
    }
    return this.prisma.product.create({
      data: {
        companyId,
        code,
        name: String(dto.name ?? "").trim(),
        price: dto.price,
        stock: dto.stock,
      },
    });
  }

  async updateProduct(userId: string, companyId: string, productId: string, dto: UpdateProductDto) {
    await this.assertMember(userId, companyId);
    const existing = await this.prisma.product.findFirst({
      where: { id: productId, companyId },
    });
    if (!existing) {
      throw new NotFoundException("Product not found");
    }
    if (dto.code) {
      const conflict = await this.prisma.product.findFirst({
        where: { companyId, code: dto.code, id: { not: productId } },
      });
      if (conflict) {
        throw new ConflictException("Product code already exists");
      }
    }
    return this.prisma.product.update({
      where: { id: productId },
      data: {
        code: dto.code,
        name: dto.name !== undefined ? String(dto.name).trim() : undefined,
        price: dto.price,
        stock: dto.stock,
      },
    });
  }

  async deleteProduct(userId: string, companyId: string, productId: string) {
    await this.assertMember(userId, companyId);
    const existing = await this.prisma.product.findFirst({
      where: { id: productId, companyId },
    });
    if (!existing) {
      throw new NotFoundException("Product not found");
    }
    await this.prisma.product.delete({ where: { id: productId } });
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

  private async generateCode(companyId: string) {
    for (let attempt = 0; attempt < 5; attempt += 1) {
      const random = Math.random().toString(36).slice(2, 6).toUpperCase();
      const time = Date.now().toString(36).toUpperCase().slice(-4);
      const code = `PRD-${time}${random}`;
      const exists = await this.prisma.product.findFirst({
        where: { companyId, code },
        select: { id: true },
      });
      if (!exists) {
        return code;
      }
    }
    throw new ConflictException("Unable to generate product code");
  }
}
