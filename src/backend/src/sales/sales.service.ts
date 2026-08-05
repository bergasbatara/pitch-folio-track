import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CreateSaleDto } from "./dto/create-sale.dto";
import { UpdateSaleDto } from "./dto/update-sale.dto";
import type { Prisma } from "@prisma/client";
import { DEFAULT_ACCOUNTS, DEFAULT_ACCOUNT_CODES } from "../accounts/accounts.defaults";

@Injectable()
export class SalesService {
  constructor(private readonly prisma: PrismaService) {}

  async listSales(userId: string, companyId: string) {
    await this.assertMember(userId, companyId);
    const sales = await this.prisma.sale.findMany({
      where: { companyId },
      include: {
        product: { select: { name: true } },
        taxCode: { select: { name: true } },
      },
      orderBy: { soldAt: "desc" },
    });
    return sales.map((sale) => ({
      ...sale,
      productName: sale.product.name,
      taxCodeName: sale.taxCode?.name ?? null,
    }));
  }

  async getSale(userId: string, companyId: string, saleId: string) {
    await this.assertMember(userId, companyId);
    const sale = await this.prisma.sale.findFirst({
      where: { id: saleId, companyId },
      include: {
        product: { select: { name: true } },
        taxCode: { select: { name: true } },
      },
    });
    if (!sale) {
      throw new NotFoundException("Sale not found");
    }
    return { ...sale, productName: sale.product.name, taxCodeName: sale.taxCode?.name ?? null };
  }

  async createSale(userId: string, companyId: string, dto: CreateSaleDto) {
    await this.assertMember(userId, companyId);
    return this.prisma.$transaction(async (tx) => {
      const effectiveDate = dto.soldAt ?? new Date();
      await this.assertPeriodOpen(tx, companyId, effectiveDate);
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
      const taxCode = await this.resolveTaxCode(tx, companyId, dto.taxCodeId);
      const subtotalAmount = dto.quantity * dto.pricePerUnit;
      const taxRate = taxCode?.rate ?? 0;
      const taxAmount = this.calculateTaxAmount(subtotalAmount, taxRate);
      const totalPrice = subtotalAmount + taxAmount;
      const settlementType = dto.settlementType ?? "receivable";
      const sale = await tx.sale.create({
        data: {
          companyId,
          productId: product.id,
          taxCodeId: taxCode?.id,
          status: "posted",
          settlementType,
          quantity: dto.quantity,
          pricePerUnit: dto.pricePerUnit,
          subtotalAmount,
          taxRate,
          taxAmount,
          totalPrice,
          soldAt: effectiveDate,
        },
        include: {
          product: { select: { name: true } },
          taxCode: { select: { name: true } },
        },
      });
      await tx.product.update({
        where: { id: product.id },
        data: { stock: product.stock - dto.quantity },
      });
      await this.syncSaleSettlement(tx, companyId, sale, product.name);
      return { ...sale, productName: product.name, taxCodeName: sale.taxCode?.name ?? null };
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
      this.assertTransactionMutable(sale.status, "Sale");
      await this.assertPeriodOpen(tx, companyId, sale.soldAt);
      await this.assertPeriodOpen(tx, companyId, dto.soldAt ?? sale.soldAt);

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
      const nextTaxCodeId = dto.taxCodeId === undefined ? sale.taxCodeId : dto.taxCodeId;
      const taxCode = await this.resolveTaxCode(tx, companyId, nextTaxCodeId);
      const subtotalAmount = quantity * pricePerUnit;
      const taxRate = taxCode?.rate ?? 0;
      const taxAmount = this.calculateTaxAmount(subtotalAmount, taxRate);
      const settlementType = dto.settlementType ?? sale.settlementType;

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
          taxCodeId: taxCode?.id ?? null,
          settlementType,
          quantity,
          pricePerUnit,
          subtotalAmount,
          taxRate,
          taxAmount,
          totalPrice: subtotalAmount + taxAmount,
          soldAt: dto.soldAt ?? sale.soldAt,
        },
        include: {
          product: { select: { name: true } },
          taxCode: { select: { name: true } },
        },
      });

      await this.syncSaleSettlement(tx, companyId, updated, updated.product.name);

      return {
        ...updated,
        productName: updated.product.name,
        taxCodeName: updated.taxCode?.name ?? null,
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
      this.assertTransactionMutable(sale.status, "Sale");
      await this.assertPeriodOpen(tx, companyId, sale.soldAt);
      const product = await tx.product.findFirst({
        where: { id: sale.productId, companyId },
      });
      if (product) {
        await tx.product.update({
          where: { id: product.id },
          data: { stock: product.stock + sale.quantity },
        });
      }
      const receivable = await tx.receivable.findFirst({
        where: { companyId, saleId: sale.id },
      });
      if (receivable) {
        if (receivable.paidAmount > 0) {
          throw new BadRequestException("Cannot delete a sale with recorded receivable payments");
        }
        await this.deleteReceivableForSale(tx, companyId, receivable.id);
      }
      await tx.journalEntry.deleteMany({
        where: { companyId, source: "sale", sourceId: sale.id },
      });
      await tx.sale.delete({ where: { id: sale.id } });
      return { success: true };
    });
  }

  async reverseSale(userId: string, companyId: string, saleId: string) {
    await this.assertMember(userId, companyId);
    return this.prisma.$transaction(async (tx) => {
      const sale = await tx.sale.findFirst({
        where: { id: saleId, companyId },
      });
      if (!sale) {
        throw new NotFoundException("Sale not found");
      }
      if (sale.status === "voided") {
        throw new BadRequestException("Sale has already been reversed");
      }
      if (sale.status !== "posted") {
        throw new BadRequestException("Only posted sales can be reversed");
      }
      await this.assertPeriodOpen(tx, companyId, sale.soldAt);

      const receivable = await tx.receivable.findFirst({
        where: { companyId, saleId: sale.id },
      });
      if (receivable && receivable.paidAmount > 0) {
        throw new BadRequestException("Cannot reverse a receivable sale with recorded payments");
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

      if (sale.settlementType === "cash") {
        await this.createReversalEntries(
          tx,
          companyId,
          { source: "sale", sourceId: sale.id },
          `Reversal Penjualan #${sale.id}`,
          "sale_reversal",
          sale.id,
          sale.soldAt,
        );
      } else if (receivable) {
        await this.createReversalEntries(
          tx,
          companyId,
          { source: "receivable", sourceId: receivable.id },
          `Reversal Piutang Penjualan #${sale.id}`,
          "receivable_reversal",
          receivable.id,
          sale.soldAt,
        );
        await tx.receivable.update({
          where: { id: receivable.id },
          data: { status: "voided" },
        });
      }

      const updated = await tx.sale.update({
        where: { id: sale.id },
        data: { status: "voided" },
        include: {
          product: { select: { name: true } },
          taxCode: { select: { name: true } },
        },
      });

      return {
        ...updated,
        productName: updated.product.name,
        taxCodeName: updated.taxCode?.name ?? null,
      };
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

  private async ensureDefaultAccounts(tx: Prisma.TransactionClient, companyId: string) {
    const existing = await tx.account.findMany({
      where: { companyId },
      select: { code: true },
    });
    const existingCodes = new Set(existing.map((a) => a.code));
    const toCreate = DEFAULT_ACCOUNTS.filter((acc) => !existingCodes.has(acc.code)).map((acc) => ({
      ...acc,
      companyId,
    }));
    if (toCreate.length === 0) return;
    await tx.account.createMany({ data: toCreate, skipDuplicates: true });
  }

  private async getAccountIdByCode(tx: Prisma.TransactionClient, companyId: string, code: string) {
    const account = await tx.account.findFirst({ where: { companyId, code } });
    if (!account) {
      throw new NotFoundException(`Account ${code} not found`);
    }
    return account.id;
  }

  private async resolveTaxCode(tx: Prisma.TransactionClient, companyId: string, taxCodeId?: string | null) {
    if (!taxCodeId) return null;
    const taxCode = await tx.taxCode.findFirst({
      where: { id: taxCodeId, companyId },
    });
    if (!taxCode) {
      throw new NotFoundException("Tax code not found");
    }
    return taxCode;
  }

  private calculateTaxAmount(baseAmount: number, taxRate: number) {
    return Math.round(baseAmount * (taxRate / 100));
  }

  private assertTransactionMutable(status: string, entityName: string) {
    if (status !== "draft") {
      throw new BadRequestException(`${entityName} is finalized and cannot be edited or deleted directly. Use reversal or adjustment journal.`);
    }
  }

  private async assertPeriodOpen(tx: Prisma.TransactionClient, companyId: string, effectiveDate: Date) {
    const company = await tx.company.findUnique({
      where: { id: companyId },
      select: { closedThrough: true },
    });
    if (!company?.closedThrough) return;

    const boundary = new Date(company.closedThrough);
    boundary.setHours(23, 59, 59, 999);
    if (effectiveDate <= boundary) {
      throw new BadRequestException("This accounting period is closed. Record the correction in an open period using adjustment or reversal flow.");
    }
  }

  private async createReversalEntries(
    tx: Prisma.TransactionClient,
    companyId: string,
    filter: { source: string; sourceId: string },
    memoPrefix: string,
    reversalSource: string,
    reversalSourceId: string,
    date: Date,
  ) {
    const originals = await tx.journalEntry.findMany({
      where: { companyId, ...filter },
      include: { lines: true },
      orderBy: [{ date: "asc" }, { createdAt: "asc" }],
    });

    for (const original of originals) {
      const reversal = await tx.journalEntry.create({
        data: {
          companyId,
          date,
          memo: `${memoPrefix} (${original.id})`,
          source: reversalSource,
          sourceId: reversalSourceId,
          status: "posted",
        },
      });

      await tx.journalLine.createMany({
        data: original.lines.map((line) => ({
          entryId: reversal.id,
          accountId: line.accountId,
          debit: line.credit,
          credit: line.debit,
          memo: line.memo ?? undefined,
        })),
      });
    }
  }

  private async upsertSaleJournal(
    tx: Prisma.TransactionClient,
    companyId: string,
    saleId: string,
    subtotalAmount: number,
    taxAmount: number,
    totalPrice: number,
    soldAt: Date,
  ) {
    await this.ensureDefaultAccounts(tx, companyId);
    const cashId = await this.getAccountIdByCode(tx, companyId, DEFAULT_ACCOUNT_CODES.cash);
    const revenueId = await this.getAccountIdByCode(tx, companyId, DEFAULT_ACCOUNT_CODES.revenue);
    const taxPayableId = await this.getAccountIdByCode(tx, companyId, DEFAULT_ACCOUNT_CODES.taxPayable);

    const existing = await tx.journalEntry.findFirst({
      where: { companyId, source: "sale", sourceId: saleId },
    });

    if (!existing) {
      const entry = await tx.journalEntry.create({
        data: {
          companyId,
          date: soldAt,
          memo: `Penjualan #${saleId}`,
          source: "sale",
          sourceId: saleId,
          status: "posted",
        },
      });
      await tx.journalLine.createMany({ data: this.buildCashSaleJournalLines(entry.id, cashId, revenueId, taxPayableId, subtotalAmount, taxAmount, totalPrice) });
      return;
    }

    await tx.journalEntry.update({
      where: { id: existing.id },
      data: { date: soldAt, memo: `Penjualan #${saleId}`, status: "posted" },
    });
    await tx.journalLine.deleteMany({ where: { entryId: existing.id } });
    await tx.journalLine.createMany({ data: this.buildCashSaleJournalLines(existing.id, cashId, revenueId, taxPayableId, subtotalAmount, taxAmount, totalPrice) });
  }

  private async syncSaleSettlement(
    tx: Prisma.TransactionClient,
    companyId: string,
    sale: {
      id: string;
      subtotalAmount: number;
      taxAmount: number;
      totalPrice: number;
      soldAt: Date;
      settlementType: string;
    },
    productName: string,
  ) {
    const linkedReceivable = await tx.receivable.findFirst({
      where: { companyId, saleId: sale.id },
    });

    if (sale.settlementType === "cash") {
      if (linkedReceivable) {
        if (linkedReceivable.paidAmount > 0) {
          throw new BadRequestException("Cannot convert a settled receivable sale to cash");
        }
        await this.deleteReceivableForSale(tx, companyId, linkedReceivable.id);
      }
      await this.upsertSaleJournal(
        tx,
        companyId,
        sale.id,
        sale.subtotalAmount,
        sale.taxAmount,
        sale.totalPrice,
        sale.soldAt,
      );
      return;
    }

    await tx.journalEntry.deleteMany({
      where: { companyId, source: "sale", sourceId: sale.id },
    });
    await this.upsertReceivableForSale(tx, companyId, sale, productName, linkedReceivable ?? undefined);
  }

  private async deleteReceivableForSale(
    tx: Prisma.TransactionClient,
    companyId: string,
    receivableId: string,
  ) {
    await tx.journalEntry.deleteMany({
      where: {
        companyId,
        OR: [
          { source: "receivable", sourceId: receivableId },
          { source: "receivable_payment", sourceId: receivableId },
        ],
      },
    });
    await tx.receivable.delete({ where: { id: receivableId } });
  }

  private async upsertReceivableForSale(
    tx: Prisma.TransactionClient,
    companyId: string,
    sale: { id: string; subtotalAmount: number; taxAmount: number; totalPrice: number; soldAt: Date },
    productName: string,
    existing?: {
      id: string;
      paidAmount: number;
    },
  ) {
    await this.ensureDefaultAccounts(tx, companyId);
    const receivableAccountId = await this.getAccountIdByCode(tx, companyId, DEFAULT_ACCOUNT_CODES.receivable);
    const revenueId = await this.getAccountIdByCode(tx, companyId, DEFAULT_ACCOUNT_CODES.revenue);
    const taxPayableId = await this.getAccountIdByCode(tx, companyId, DEFAULT_ACCOUNT_CODES.taxPayable);
    const cashId = await this.getAccountIdByCode(tx, companyId, DEFAULT_ACCOUNT_CODES.cash);
    const paidAmount = Math.min(existing?.paidAmount ?? 0, sale.totalPrice);
    const dueDate = sale.soldAt;
    const description = `Penjualan ${productName}`;

    const receivable = existing
      ? await tx.receivable.update({
          where: { id: existing.id },
          data: {
            customerName: "Pelanggan Umum",
            description,
            amount: sale.totalPrice,
            paidAmount,
            dueDate,
            status: this.getSettlementStatus(paidAmount, sale.totalPrice, dueDate),
          },
        })
      : await tx.receivable.create({
          data: {
            companyId,
            saleId: sale.id,
            customerName: "Pelanggan Umum",
            description,
            amount: sale.totalPrice,
            paidAmount: 0,
            dueDate,
            status: this.getSettlementStatus(0, sale.totalPrice, dueDate),
          },
        });

    const receivableEntry = await tx.journalEntry.findFirst({
      where: { companyId, source: "receivable", sourceId: receivable.id },
    });

    const receivableJournalId = receivableEntry
      ? receivableEntry.id
      : (
          await tx.journalEntry.create({
            data: {
              companyId,
              date: dueDate,
              memo: description,
              source: "receivable",
              sourceId: receivable.id,
              status: "posted",
            },
          })
        ).id;

    if (receivableEntry) {
      await tx.journalEntry.update({
        where: { id: receivableEntry.id },
        data: {
          date: dueDate,
          memo: description,
          status: "posted",
        },
      });
      await tx.journalLine.deleteMany({ where: { entryId: receivableEntry.id } });
    }

    await tx.journalLine.createMany({
      data: this.buildReceivableSaleJournalLines(
        receivableJournalId,
        receivableAccountId,
        revenueId,
        taxPayableId,
        sale.subtotalAmount,
        sale.taxAmount,
        sale.totalPrice,
      ),
    });

    const paymentEntry = await tx.journalEntry.findFirst({
      where: { companyId, source: "receivable_payment", sourceId: receivable.id },
    });

    if (paidAmount <= 0) {
      if (paymentEntry) {
        await tx.journalEntry.delete({ where: { id: paymentEntry.id } });
      }
      return;
    }

    const paymentJournalId = paymentEntry
      ? paymentEntry.id
      : (
          await tx.journalEntry.create({
            data: {
              companyId,
              date: dueDate,
              memo: `Pembayaran ${description}`,
              source: "receivable_payment",
              sourceId: receivable.id,
              status: "posted",
            },
          })
        ).id;

    if (paymentEntry) {
      await tx.journalEntry.update({
        where: { id: paymentEntry.id },
        data: {
          date: dueDate,
          memo: `Pembayaran ${description}`,
          status: "posted",
        },
      });
      await tx.journalLine.deleteMany({ where: { entryId: paymentEntry.id } });
    }

    await tx.journalLine.createMany({
      data: [
        { entryId: paymentJournalId, accountId: cashId, debit: paidAmount, credit: 0 },
        { entryId: paymentJournalId, accountId: receivableAccountId, debit: 0, credit: paidAmount },
      ],
    });
  }

  private getSettlementStatus(paidAmount: number, amount: number, dueDate: Date) {
    if (paidAmount >= amount) return "paid";
    if (paidAmount > 0) return "partial";
    if (dueDate.getTime() < Date.now()) return "overdue";
    return "pending";
  }

  private buildCashSaleJournalLines(
    entryId: string,
    cashId: string,
    revenueId: string,
    taxPayableId: string,
    subtotalAmount: number,
    taxAmount: number,
    totalPrice: number,
  ) {
    return [
      { entryId, accountId: cashId, debit: totalPrice, credit: 0 },
      { entryId, accountId: revenueId, debit: 0, credit: subtotalAmount },
      ...(taxAmount > 0 ? [{ entryId, accountId: taxPayableId, debit: 0, credit: taxAmount }] : []),
    ];
  }

  private buildReceivableSaleJournalLines(
    entryId: string,
    receivableAccountId: string,
    revenueId: string,
    taxPayableId: string,
    subtotalAmount: number,
    taxAmount: number,
    totalPrice: number,
  ) {
    return [
      { entryId, accountId: receivableAccountId, debit: totalPrice, credit: 0 },
      { entryId, accountId: revenueId, debit: 0, credit: subtotalAmount },
      ...(taxAmount > 0 ? [{ entryId, accountId: taxPayableId, debit: 0, credit: taxAmount }] : []),
    ];
  }
}
