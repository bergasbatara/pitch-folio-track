import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CreatePurchaseDto } from "./dto/create-purchase.dto";
import { UpdatePurchaseDto } from "./dto/update-purchase.dto";
import type { Prisma } from "@prisma/client";
import { DEFAULT_ACCOUNTS, DEFAULT_ACCOUNT_CODES } from "../accounts/accounts.defaults";

const DEFAULT_CATEGORY_NAME = "Umum";

@Injectable()
export class PurchasesService {
  constructor(private readonly prisma: PrismaService) {}

  async listPurchases(userId: string, companyId: string) {
    await this.assertMember(userId, companyId);
    const purchases = await this.prisma.purchase.findMany({
      where: { companyId },
      include: {
        category: { select: { name: true } },
        product: { select: { name: true, code: true } },
        taxCode: { select: { name: true } },
      },
      orderBy: { date: "desc" },
    });
    return purchases.map((purchase) => ({
      ...purchase,
      categoryName: purchase.category.name,
      productName: purchase.product?.name ?? null,
      productCode: purchase.product?.code ?? null,
      taxCodeName: purchase.taxCode?.name ?? null,
    }));
  }

  async getPurchase(userId: string, companyId: string, purchaseId: string) {
    await this.assertMember(userId, companyId);
    const purchase = await this.prisma.purchase.findFirst({
      where: { id: purchaseId, companyId },
      include: {
        category: { select: { name: true } },
        product: { select: { name: true, code: true } },
        taxCode: { select: { name: true } },
      },
    });
    if (!purchase) {
      throw new NotFoundException("Purchase not found");
    }
    return {
      ...purchase,
      categoryName: purchase.category.name,
      productName: purchase.product?.name ?? null,
      productCode: purchase.product?.code ?? null,
      taxCodeName: purchase.taxCode?.name ?? null,
    };
  }

  async createPurchase(userId: string, companyId: string, dto: CreatePurchaseDto) {
    await this.assertMember(userId, companyId);
    return this.prisma.$transaction(async (tx) => {
      const effectiveDate = dto.date ?? new Date();
      await this.assertPeriodOpen(tx, companyId, effectiveDate);
      const ensuredCategory = dto.categoryId
        ? await tx.purchaseCategory.findFirst({ where: { id: dto.categoryId, companyId } })
        : await tx.purchaseCategory.upsert({
            where: { companyId_name: { companyId, name: DEFAULT_CATEGORY_NAME } },
            create: { companyId, name: DEFAULT_CATEGORY_NAME },
            update: {},
          });
      if (!ensuredCategory) throw new NotFoundException("Category not found");

      const product = dto.productId
        ? await tx.product.findFirst({
            where: { id: dto.productId, companyId },
          })
        : dto.productCode
          ? await tx.product.findFirst({
              where: { code: dto.productCode, companyId },
            })
          : null;
      if ((dto.productId || dto.productCode) && !product) {
        throw new NotFoundException("Product not found");
      }
      const taxCode = await this.resolveTaxCode(tx, companyId, dto.taxCodeId);
      const settlementType = dto.settlementType ?? "payable";
      const subtotalCost = dto.quantity * dto.unitCost;
      const taxRate = taxCode?.rate ?? 0;
      const taxAmount = this.calculateTaxAmount(subtotalCost, taxRate);

      const purchase = await tx.purchase.create({
        data: {
          companyId,
          categoryId: ensuredCategory.id,
          productId: product?.id,
          taxCodeId: taxCode?.id,
          status: "posted",
          settlementType,
          itemName: String(dto.itemName ?? "").trim(),
          supplier: dto.supplier ? String(dto.supplier).trim() : undefined,
          quantity: dto.quantity,
          unitCost: dto.unitCost,
          subtotalCost,
          taxRate,
          taxAmount,
          totalCost: subtotalCost + taxAmount,
          date: effectiveDate,
          notes: dto.notes ? String(dto.notes).trim() : undefined,
        },
        include: {
          category: { select: { name: true } },
          product: { select: { name: true, code: true } },
          taxCode: { select: { name: true } },
        },
      });

      if (product) {
        await tx.product.update({
          where: { id: product.id },
          data: { stock: product.stock + dto.quantity },
        });
      }

      await this.syncPurchaseSettlement(tx, companyId, purchase);

      return {
        ...purchase,
        categoryName: purchase.category.name,
        productName: purchase.product?.name ?? null,
        productCode: purchase.product?.code ?? null,
        taxCodeName: purchase.taxCode?.name ?? null,
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
      this.assertTransactionMutable(purchase.status, "Purchase");
      await this.assertPeriodOpen(tx, companyId, purchase.date);
      await this.assertPeriodOpen(tx, companyId, dto.date ?? purchase.date);

      const nextCategoryId = dto.categoryId ?? purchase.categoryId;
      if (dto.categoryId && dto.categoryId !== purchase.categoryId) {
        const category = await tx.purchaseCategory.findFirst({
          where: { id: dto.categoryId, companyId },
        });
        if (!category) {
          throw new NotFoundException("Category not found");
        }
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
      const nextProductId = resolvedProductId ?? purchase.productId;
      const nextQuantity = dto.quantity ?? purchase.quantity;
      const nextUnitCost = dto.unitCost ?? purchase.unitCost;
      const nextTaxCodeId = dto.taxCodeId === undefined ? purchase.taxCodeId : dto.taxCodeId;
      const taxCode = await this.resolveTaxCode(tx, companyId, nextTaxCodeId);
      const subtotalCost = nextQuantity * nextUnitCost;
      const taxRate = taxCode?.rate ?? 0;
      const taxAmount = this.calculateTaxAmount(subtotalCost, taxRate);
      const settlementType = dto.settlementType ?? purchase.settlementType;

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
          taxCodeId: taxCode?.id ?? null,
          settlementType,
          itemName: dto.itemName !== undefined ? String(dto.itemName).trim() : undefined,
          supplier: dto.supplier !== undefined ? String(dto.supplier).trim() : undefined,
          quantity: nextQuantity,
          unitCost: nextUnitCost,
          subtotalCost,
          taxRate,
          taxAmount,
          totalCost: subtotalCost + taxAmount,
          date: dto.date ?? purchase.date,
          notes: dto.notes !== undefined ? String(dto.notes).trim() : undefined,
        },
      });

      const refreshed = await tx.purchase.findFirst({
        where: { id: purchase.id, companyId },
        include: {
          category: { select: { name: true } },
          product: { select: { name: true, code: true } },
          taxCode: { select: { name: true } },
        },
      });

      if (!refreshed) {
        throw new NotFoundException("Purchase not found");
      }

      await this.syncPurchaseSettlement(tx, companyId, refreshed);

      return {
        ...refreshed,
        categoryName: refreshed.category.name,
        productName: refreshed.product?.name ?? null,
        productCode: refreshed.product?.code ?? null,
        taxCodeName: refreshed.taxCode?.name ?? null,
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
      this.assertTransactionMutable(purchase.status, "Purchase");
      await this.assertPeriodOpen(tx, companyId, purchase.date);

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

      const payable = await tx.payable.findFirst({
        where: { companyId, purchaseId: purchase.id },
      });
      if (payable) {
        if (payable.paidAmount > 0) {
          throw new BadRequestException("Cannot delete a purchase with recorded payable payments");
        }
        await this.deletePayableForPurchase(tx, companyId, payable.id);
      }
      await tx.journalEntry.deleteMany({
        where: { companyId, source: "purchase", sourceId: purchase.id },
      });
      await tx.purchase.delete({ where: { id: purchase.id } });
      return { success: true };
    });
  }

  async reversePurchase(userId: string, companyId: string, purchaseId: string) {
    await this.assertMember(userId, companyId);
    return this.prisma.$transaction(async (tx) => {
      const purchase = await tx.purchase.findFirst({
        where: { id: purchaseId, companyId },
      });
      if (!purchase) {
        throw new NotFoundException("Purchase not found");
      }
      if (purchase.status === "voided") {
        throw new BadRequestException("Purchase has already been reversed");
      }
      if (purchase.status !== "posted") {
        throw new BadRequestException("Only posted purchases can be reversed");
      }
      await this.assertPeriodOpen(tx, companyId, purchase.date);

      const payable = await tx.payable.findFirst({
        where: { companyId, purchaseId: purchase.id },
      });
      if (payable && payable.paidAmount > 0) {
        throw new BadRequestException("Cannot reverse a payable purchase with recorded payments");
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

      if (purchase.settlementType === "cash") {
        await this.createReversalEntries(
          tx,
          companyId,
          { source: "purchase", sourceId: purchase.id },
          `Reversal Pembelian #${purchase.id}`,
          "purchase_reversal",
          purchase.id,
          purchase.date,
        );
      } else if (payable) {
        await this.createReversalEntries(
          tx,
          companyId,
          { source: "payable", sourceId: payable.id },
          `Reversal Hutang Pembelian #${purchase.id}`,
          "payable_reversal",
          payable.id,
          purchase.date,
        );
        await tx.payable.update({
          where: { id: payable.id },
          data: { status: "voided" },
        });
      }

      const updated = await tx.purchase.update({
        where: { id: purchase.id },
        data: { status: "voided" },
        include: {
          category: { select: { name: true } },
          product: { select: { name: true, code: true } },
          taxCode: { select: { name: true } },
        },
      });

      return {
        ...updated,
        categoryName: updated.category.name,
        productName: updated.product?.name ?? null,
        productCode: updated.product?.code ?? null,
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

  private async upsertPurchaseJournal(
    tx: Prisma.TransactionClient,
    companyId: string,
    purchaseId: string,
    subtotalCost: number,
    taxAmount: number,
    totalCost: number,
    date: Date,
  ) {
    await this.ensureDefaultAccounts(tx, companyId);
    const cashId = await this.getAccountIdByCode(tx, companyId, DEFAULT_ACCOUNT_CODES.cash);
    const expenseId = await this.getAccountIdByCode(tx, companyId, DEFAULT_ACCOUNT_CODES.purchases);
    const taxInputId = await this.getAccountIdByCode(tx, companyId, DEFAULT_ACCOUNT_CODES.taxInput);

    const existing = await tx.journalEntry.findFirst({
      where: { companyId, source: "purchase", sourceId: purchaseId },
    });

    if (!existing) {
      const entry = await tx.journalEntry.create({
        data: {
          companyId,
          date,
          memo: `Pembelian #${purchaseId}`,
          source: "purchase",
          sourceId: purchaseId,
          status: "posted",
        },
      });
      await tx.journalLine.createMany({ data: this.buildCashPurchaseJournalLines(entry.id, expenseId, taxInputId, cashId, subtotalCost, taxAmount, totalCost) });
      return;
    }

    await tx.journalEntry.update({
      where: { id: existing.id },
      data: { date, memo: `Pembelian #${purchaseId}`, status: "posted" },
    });
    await tx.journalLine.deleteMany({ where: { entryId: existing.id } });
    await tx.journalLine.createMany({ data: this.buildCashPurchaseJournalLines(existing.id, expenseId, taxInputId, cashId, subtotalCost, taxAmount, totalCost) });
  }

  private async syncPurchaseSettlement(
    tx: Prisma.TransactionClient,
    companyId: string,
    purchase: {
      id: string;
      itemName: string;
      supplier: string | null;
      subtotalCost: number;
      taxAmount: number;
      totalCost: number;
      date: Date;
      settlementType: string;
    },
  ) {
    const linkedPayable = await tx.payable.findFirst({
      where: { companyId, purchaseId: purchase.id },
    });

    if (purchase.settlementType === "cash") {
      if (linkedPayable) {
        if (linkedPayable.paidAmount > 0) {
          throw new BadRequestException("Cannot convert a settled payable purchase to cash");
        }
        await this.deletePayableForPurchase(tx, companyId, linkedPayable.id);
      }
      await this.upsertPurchaseJournal(
        tx,
        companyId,
        purchase.id,
        purchase.subtotalCost,
        purchase.taxAmount,
        purchase.totalCost,
        purchase.date,
      );
      return;
    }

    await tx.journalEntry.deleteMany({
      where: { companyId, source: "purchase", sourceId: purchase.id },
    });
    await this.upsertPayableForPurchase(tx, companyId, purchase, linkedPayable ?? undefined);
  }

  private async deletePayableForPurchase(
    tx: Prisma.TransactionClient,
    companyId: string,
    payableId: string,
  ) {
    await tx.journalEntry.deleteMany({
      where: {
        companyId,
        OR: [
          { source: "payable", sourceId: payableId },
          { source: "payable_payment", sourceId: payableId },
        ],
      },
    });
    await tx.payable.delete({ where: { id: payableId } });
  }

  private async upsertPayableForPurchase(
    tx: Prisma.TransactionClient,
    companyId: string,
    purchase: {
      id: string;
      itemName: string;
      supplier: string | null;
      subtotalCost: number;
      taxAmount: number;
      totalCost: number;
      date: Date;
    },
    existing?: {
      id: string;
      paidAmount: number;
    },
  ) {
    await this.ensureDefaultAccounts(tx, companyId);
    const expenseId = await this.getAccountIdByCode(tx, companyId, DEFAULT_ACCOUNT_CODES.purchases);
    const taxInputId = await this.getAccountIdByCode(tx, companyId, DEFAULT_ACCOUNT_CODES.taxInput);
    const payableAccountId = await this.getAccountIdByCode(tx, companyId, DEFAULT_ACCOUNT_CODES.payable);
    const cashId = await this.getAccountIdByCode(tx, companyId, DEFAULT_ACCOUNT_CODES.cash);
    const paidAmount = Math.min(existing?.paidAmount ?? 0, purchase.totalCost);
    const dueDate = purchase.date;
    const description = purchase.itemName;

    const payable = existing
      ? await tx.payable.update({
          where: { id: existing.id },
          data: {
            supplierName: purchase.supplier || "Supplier Umum",
            description,
            amount: purchase.totalCost,
            paidAmount,
            dueDate,
            status: this.getSettlementStatus(paidAmount, purchase.totalCost, dueDate),
          },
        })
      : await tx.payable.create({
          data: {
            companyId,
            purchaseId: purchase.id,
            supplierName: purchase.supplier || "Supplier Umum",
            description,
            amount: purchase.totalCost,
            paidAmount: 0,
            dueDate,
            status: this.getSettlementStatus(0, purchase.totalCost, dueDate),
          },
        });

    const payableEntry = await tx.journalEntry.findFirst({
      where: { companyId, source: "payable", sourceId: payable.id },
    });

    const payableJournalId = payableEntry
      ? payableEntry.id
      : (
          await tx.journalEntry.create({
            data: {
              companyId,
              date: dueDate,
              memo: `Pembelian ${description}`,
              source: "payable",
              sourceId: payable.id,
              status: "posted",
            },
          })
        ).id;

    if (payableEntry) {
      await tx.journalEntry.update({
        where: { id: payableEntry.id },
        data: {
          date: dueDate,
          memo: `Pembelian ${description}`,
          status: "posted",
        },
      });
      await tx.journalLine.deleteMany({ where: { entryId: payableEntry.id } });
    }

    await tx.journalLine.createMany({
      data: this.buildPayablePurchaseJournalLines(
        payableJournalId,
        expenseId,
        taxInputId,
        payableAccountId,
        purchase.subtotalCost,
        purchase.taxAmount,
        purchase.totalCost,
      ),
    });

    const paymentEntry = await tx.journalEntry.findFirst({
      where: { companyId, source: "payable_payment", sourceId: payable.id },
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
              source: "payable_payment",
              sourceId: payable.id,
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
        { entryId: paymentJournalId, accountId: payableAccountId, debit: paidAmount, credit: 0 },
        { entryId: paymentJournalId, accountId: cashId, debit: 0, credit: paidAmount },
      ],
    });
  }

  private getSettlementStatus(paidAmount: number, amount: number, dueDate: Date) {
    if (paidAmount >= amount) return "paid";
    if (paidAmount > 0) return "partial";
    if (dueDate.getTime() < Date.now()) return "overdue";
    return "pending";
  }

  private buildCashPurchaseJournalLines(
    entryId: string,
    expenseId: string,
    taxInputId: string,
    cashId: string,
    subtotalCost: number,
    taxAmount: number,
    totalCost: number,
  ) {
    return [
      { entryId, accountId: expenseId, debit: subtotalCost, credit: 0 },
      ...(taxAmount > 0 ? [{ entryId, accountId: taxInputId, debit: taxAmount, credit: 0 }] : []),
      { entryId, accountId: cashId, debit: 0, credit: totalCost },
    ];
  }

  private buildPayablePurchaseJournalLines(
    entryId: string,
    expenseId: string,
    taxInputId: string,
    payableAccountId: string,
    subtotalCost: number,
    taxAmount: number,
    totalCost: number,
  ) {
    return [
      { entryId, accountId: expenseId, debit: subtotalCost, credit: 0 },
      ...(taxAmount > 0 ? [{ entryId, accountId: taxInputId, debit: taxAmount, credit: 0 }] : []),
      { entryId, accountId: payableAccountId, debit: 0, credit: totalCost },
    ];
  }
}
