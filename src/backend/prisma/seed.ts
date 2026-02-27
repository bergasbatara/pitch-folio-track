import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import bcrypt from "bcrypt";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({
  adapter: new PrismaPg(pool),
});

async function main() {
  const passwordHash = await bcrypt.hash("password123", 10);
  const user = await prisma.user.upsert({
    where: { email: "admin@test.com" },
    update: {
      password: passwordHash,
      name: "Admin Test",
    },
    create: {
      email: "admin@test.com",
      password: passwordHash,
      name: "Admin Test",
    },
  });

  const company = await prisma.company.upsert({
    where: { id: "company-demo-001" },
    update: {},
    create: {
      id: "company-demo-001",
      name: "Asia Global Financial",
      address: "Jakarta",
      phone: "+62 21 1234567",
      email: "admin@test.com",
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

  await prisma.sale.create({
    data: {
      companyId: company.id,
      productId: products[0].id,
      quantity: 2,
      pricePerUnit: products[0].price,
      totalPrice: 2 * products[0].price,
      soldAt: new Date(),
    },
  });

  await prisma.purchase.create({
    data: {
      companyId: company.id,
      categoryId: categories[0].id,
      itemName: "Biji Kopi Mentah",
      supplier: "PT Kopi Nusantara",
      quantity: 10,
      unitCost: 120000,
      totalCost: 10 * 120000,
      date: new Date(),
    },
  });

  await prisma.receivable.create({
    data: {
      companyId: company.id,
      customerName: "Toko Serba Ada",
      description: "Penjualan barang - Invoice #INV1001",
      amount: 500000,
      paidAmount: 0,
      dueDate: new Date(),
      status: "pending",
    },
  });

  await prisma.payable.create({
    data: {
      companyId: company.id,
      supplierName: "PT Kopi Nusantara",
      description: "Pembelian barang - PO #PO2001",
      amount: 1200000,
      paidAmount: 0,
      dueDate: new Date(),
      status: "pending",
    },
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
