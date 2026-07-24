import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import bcrypt from "bcrypt";
import { DEFAULT_ACCOUNTS, DEFAULT_ACCOUNT_CODES } from "../src/accounts/accounts.defaults";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({
  adapter: new PrismaPg(pool),
});

const DEMO_COMPANY_ID = "company-demo-001";
const DEMO_IDS = {
  sale: "demo-sale-cash-001",
  purchase: "demo-purchase-cash-001",
  receivable: "demo-receivable-001",
  payable: "demo-payable-001",
  fixedAsset: "demo-fixed-asset-001",
  journalOpening: "demo-journal-opening-001",
  journalFixedAsset: "demo-journal-fixed-asset-001",
  journalSaleCash: "demo-journal-sale-cash-001",
  journalPurchaseCash: "demo-journal-purchase-cash-001",
  journalReceivableIssue: "demo-journal-receivable-issue-001",
  journalReceivablePayment: "demo-journal-receivable-payment-001",
  journalPayableIssue: "demo-journal-payable-issue-001",
  journalPayablePayment: "demo-journal-payable-payment-001",
} as const;

function atMonthDay(base: Date, day: number) {
  return new Date(base.getFullYear(), base.getMonth(), day, 9, 0, 0, 0);
}

async function ensureDemoAccounts(companyId: string) {
  await prisma.account.createMany({
    data: DEFAULT_ACCOUNTS.map((account) => ({
      companyId,
      ...account,
    })),
    skipDuplicates: true,
  });

  const accounts = await prisma.account.findMany({
    where: { companyId },
    select: { id: true, code: true },
  });

  const map = new Map(accounts.map((account) => [account.code, account.id]));
  const requiredCodes = [
    DEFAULT_ACCOUNT_CODES.cash,
    DEFAULT_ACCOUNT_CODES.receivable,
    DEFAULT_ACCOUNT_CODES.payable,
    DEFAULT_ACCOUNT_CODES.fixedAsset,
    DEFAULT_ACCOUNT_CODES.revenue,
    DEFAULT_ACCOUNT_CODES.purchases,
    "3001",
  ];

  for (const code of requiredCodes) {
    if (!map.has(code)) {
      throw new Error(`Missing seeded account ${code} for company ${companyId}`);
    }
  }

  return map;
}

async function resetDemoDataset(companyId: string) {
  await prisma.$transaction([
    prisma.openingBalanceItem.deleteMany({ where: { companyId } }),
    prisma.journalEntry.deleteMany({ where: { companyId } }),
    prisma.fixedAsset.deleteMany({ where: { companyId } }),
    prisma.payable.deleteMany({ where: { companyId } }),
    prisma.receivable.deleteMany({ where: { companyId } }),
    prisma.purchase.deleteMany({ where: { companyId } }),
    prisma.sale.deleteMany({ where: { companyId } }),
  ]);
}

async function upsertJournalEntry(input: {
  id: string;
  companyId: string;
  date: Date;
  memo: string;
  source: string;
  sourceId: string;
  lines: Array<{
    accountId: string;
    debit: number;
    credit: number;
    memo?: string;
  }>;
}) {
  await prisma.$transaction(async (tx) => {
    await tx.journalEntry.upsert({
      where: { id: input.id },
      update: {
        companyId: input.companyId,
        date: input.date,
        memo: input.memo,
        source: input.source,
        sourceId: input.sourceId,
        status: "posted",
      },
      create: {
        id: input.id,
        companyId: input.companyId,
        date: input.date,
        memo: input.memo,
        source: input.source,
        sourceId: input.sourceId,
        status: "posted",
      },
    });

    await tx.journalLine.deleteMany({
      where: { entryId: input.id },
    });

    await tx.journalLine.createMany({
      data: input.lines.map((line, index) => ({
        id: `${input.id}-line-${index + 1}`,
        entryId: input.id,
        accountId: line.accountId,
        debit: line.debit,
        credit: line.credit,
        memo: line.memo,
      })),
    });
  });
}

async function main() {
  const nodeEnv = String(process.env.NODE_ENV ?? "development");
  const allowSeedInProd = String(process.env.ALLOW_SEED_IN_PROD ?? "false") === "true";
  if (nodeEnv === "production" && !allowSeedInProd) {
    throw new Error(
      "Refusing to run seed in production. Set ALLOW_SEED_IN_PROD=true only for one-off controlled runs.",
    );
  }

  const email = process.env.SEED_ADMIN_EMAIL ?? "admin@test.com";
  const password = process.env.SEED_ADMIN_PASSWORD ?? "password123";
  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.user.upsert({
    where: { email },
    update: {
      password: passwordHash,
      name: "Admin Test",
    },
    create: {
      email,
      password: passwordHash,
      name: "Admin Test",
    },
  });

  const company = await prisma.company.upsert({
    where: { id: DEMO_COMPANY_ID },
    update: {},
    create: {
      id: DEMO_COMPANY_ID,
      name: "Asia Global Financial",
      address: "Jakarta",
      phone: "+62 21 1234567",
      email,
      currency: "IDR",
    },
  });

  await prisma.companyMember.upsert({
    where: {
      userId_companyId: { userId: user.id, companyId: company.id },
    },
    update: { role: "owner" },
    create: {
      userId: user.id,
      companyId: company.id,
      role: "owner",
    },
  });

  const today = new Date();
  const openingDate = new Date(today.getFullYear(), 0, 1, 9, 0, 0, 0);
  const fixedAssetDate = atMonthDay(today, 2);
  const saleDate = atMonthDay(today, 5);
  const purchaseDate = atMonthDay(today, 7);
  const receivableDate = atMonthDay(today, 10);
  const receivablePaymentDate = atMonthDay(today, 12);
  const payableDate = atMonthDay(today, 14);
  const payablePaymentDate = atMonthDay(today, 15);

  await prisma.$transaction([
    prisma.plan.upsert({
      where: { id: "business" },
      update: {},
      create: {
        id: "business",
        name: "Business",
        price: 299000,
        currency: "IDR",
        period: "monthly",
        features: [
          "Pencatatan Transaksi",
          "Persiapan Penyusunan Laporan Keuangan",
          "Penyusunan Catatan Laporan Keuangan",
          "Neraca, Laba Rugi, Arus Kas",
        ],
        recommended: false,
      },
    }),
    prisma.plan.upsert({
      where: { id: "professional" },
      update: {},
      create: {
        id: "professional",
        name: "Professional",
        price: 499000,
        currency: "IDR",
        period: "monthly",
        features: [
          "Semua fitur Business",
          "Drafting Laporan Keuangan untuk Audit",
          "Rasio Keuangan",
          "Analisis Tren",
        ],
        recommended: true,
      },
    }),
    prisma.plan.upsert({
      where: { id: "premium" },
      update: {},
      create: {
        id: "premium",
        name: "Premium",
        price: 799000,
        currency: "IDR",
        period: "monthly",
        features: [
          "Semua fitur Professional",
          "Analisis Keuangan Lanjutan",
          "Modeling & Proyeksi Keuangan",
          "Konsultasi Prioritas",
        ],
        recommended: false,
      },
    }),
  ]);

  const categories = await prisma.$transaction([
    prisma.purchaseCategory.upsert({
      where: { companyId_name: { companyId: company.id, name: "Bahan Baku" } },
      update: {},
      create: { companyId: company.id, name: "Bahan Baku" },
    }),
    prisma.purchaseCategory.upsert({
      where: { companyId_name: { companyId: company.id, name: "Marketing" } },
      update: {},
      create: { companyId: company.id, name: "Marketing" },
    }),
  ]);

  const products = await prisma.$transaction([
    prisma.product.upsert({
      where: { companyId_name: { companyId: company.id, name: "Kopi Arabika Premium" } },
      update: {},
      create: {
        companyId: company.id,
        code: "PRD-KOPI-01",
        name: "Kopi Arabika Premium",
        price: 45000,
        stock: 150,
      },
    }),
    prisma.product.upsert({
      where: { companyId_name: { companyId: company.id, name: "Teh Hijau Organik" } },
      update: {},
      create: {
        companyId: company.id,
        code: "PRD-TEH-01",
        name: "Teh Hijau Organik",
        price: 35000,
        stock: 200,
      },
    }),
  ]);

  await ensureDemoAccounts(company.id);
  await resetDemoDataset(company.id);

  const accountIds = await ensureDemoAccounts(company.id);
  const cashId = accountIds.get(DEFAULT_ACCOUNT_CODES.cash)!;
  const receivableId = accountIds.get(DEFAULT_ACCOUNT_CODES.receivable)!;
  const payableId = accountIds.get(DEFAULT_ACCOUNT_CODES.payable)!;
  const fixedAssetId = accountIds.get(DEFAULT_ACCOUNT_CODES.fixedAsset)!;
  const revenueId = accountIds.get(DEFAULT_ACCOUNT_CODES.revenue)!;
  const purchasesId = accountIds.get(DEFAULT_ACCOUNT_CODES.purchases)!;
  const capitalId = accountIds.get("3001")!;

  await prisma.sale.create({
    data: {
      id: DEMO_IDS.sale,
      companyId: company.id,
      productId: products[0].id,
      settlementType: "cash",
      quantity: 2,
      pricePerUnit: products[0].price,
      subtotalAmount: 2 * products[0].price,
      taxRate: 0,
      taxAmount: 0,
      totalPrice: 2 * products[0].price,
      soldAt: saleDate,
    },
  });

  await prisma.purchase.create({
    data: {
      id: DEMO_IDS.purchase,
      companyId: company.id,
      categoryId: categories[0].id,
      settlementType: "cash",
      itemName: "Biji Kopi Mentah",
      supplier: "PT Kopi Nusantara",
      quantity: 10,
      unitCost: 120000,
      subtotalCost: 10 * 120000,
      taxRate: 0,
      taxAmount: 0,
      totalCost: 10 * 120000,
      date: purchaseDate,
    },
  });

  await prisma.receivable.create({
    data: {
      id: DEMO_IDS.receivable,
      companyId: company.id,
      customerName: "Toko Serba Ada",
      description: "Penjualan barang - Invoice #INV1001",
      amount: 500000,
      paidAmount: 200000,
      dueDate: receivableDate,
      status: "partial",
    },
  });

  await prisma.payable.create({
    data: {
      id: DEMO_IDS.payable,
      companyId: company.id,
      supplierName: "PT Kopi Nusantara",
      description: "Pembelian barang - PO #PO2001",
      amount: 1200000,
      paidAmount: 300000,
      dueDate: payableDate,
      status: "partial",
    },
  });

  await prisma.fixedAsset.create({
    data: {
      id: DEMO_IDS.fixedAsset,
      companyId: company.id,
      name: "Mesin Sangrai Kopi Demo",
      assetType: "tetap",
      category: "Mesin & Peralatan",
      acquisitionDate: fixedAssetDate,
      acquisitionCost: 2500000,
      usefulLifeMonths: 60,
      residualValue: 0,
      depreciationMethod: "garis_lurus",
    },
  });

  await upsertJournalEntry({
    id: DEMO_IDS.journalOpening,
    companyId: company.id,
    date: openingDate,
    memo: "Setoran modal awal demo",
    source: "seed_opening_capital",
    sourceId: "demo-opening-capital",
    lines: [
      { accountId: cashId, debit: 10000000, credit: 0 },
      { accountId: capitalId, debit: 0, credit: 10000000 },
    ],
  });

  await upsertJournalEntry({
    id: DEMO_IDS.journalFixedAsset,
    companyId: company.id,
    date: fixedAssetDate,
    memo: "Perolehan aset tetap demo",
    source: "seed_fixed_asset",
    sourceId: DEMO_IDS.fixedAsset,
    lines: [
      { accountId: fixedAssetId, debit: 2500000, credit: 0 },
      { accountId: cashId, debit: 0, credit: 2500000 },
    ],
  });

  await upsertJournalEntry({
    id: DEMO_IDS.journalSaleCash,
    companyId: company.id,
    date: saleDate,
    memo: "Penjualan tunai demo",
    source: "sale",
    sourceId: DEMO_IDS.sale,
    lines: [
      { accountId: cashId, debit: 90000, credit: 0 },
      { accountId: revenueId, debit: 0, credit: 90000 },
    ],
  });

  await upsertJournalEntry({
    id: DEMO_IDS.journalPurchaseCash,
    companyId: company.id,
    date: purchaseDate,
    memo: "Pembelian tunai demo",
    source: "purchase",
    sourceId: DEMO_IDS.purchase,
    lines: [
      { accountId: purchasesId, debit: 1200000, credit: 0 },
      { accountId: cashId, debit: 0, credit: 1200000 },
    ],
  });

  await upsertJournalEntry({
    id: DEMO_IDS.journalReceivableIssue,
    companyId: company.id,
    date: receivableDate,
    memo: "Piutang usaha demo",
    source: "receivable",
    sourceId: DEMO_IDS.receivable,
    lines: [
      { accountId: receivableId, debit: 500000, credit: 0 },
      { accountId: revenueId, debit: 0, credit: 500000 },
    ],
  });

  await upsertJournalEntry({
    id: DEMO_IDS.journalReceivablePayment,
    companyId: company.id,
    date: receivablePaymentDate,
    memo: "Pembayaran piutang demo",
    source: "receivable_payment",
    sourceId: DEMO_IDS.receivable,
    lines: [
      { accountId: cashId, debit: 200000, credit: 0 },
      { accountId: receivableId, debit: 0, credit: 200000 },
    ],
  });

  await upsertJournalEntry({
    id: DEMO_IDS.journalPayableIssue,
    companyId: company.id,
    date: payableDate,
    memo: "Hutang usaha demo",
    source: "payable",
    sourceId: DEMO_IDS.payable,
    lines: [
      { accountId: purchasesId, debit: 1200000, credit: 0 },
      { accountId: payableId, debit: 0, credit: 1200000 },
    ],
  });

  await upsertJournalEntry({
    id: DEMO_IDS.journalPayablePayment,
    companyId: company.id,
    date: payablePaymentDate,
    memo: "Pembayaran hutang demo",
    source: "payable_payment",
    sourceId: DEMO_IDS.payable,
    lines: [
      { accountId: payableId, debit: 300000, credit: 0 },
      { accountId: cashId, debit: 0, credit: 300000 },
    ],
  });

  await prisma.subscription.upsert({
    where: { companyId: company.id },
    update: {},
    create: {
      companyId: company.id,
      planId: "business",
      status: "active",
      startsAt: new Date(),
    },
  });
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
