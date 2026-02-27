import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

const DEFAULT_PLANS = [
  {
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
  {
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
  {
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
];

@Injectable()
export class PlansService {
  constructor(private readonly prisma: PrismaService) {}

  async listPlans() {
    await this.ensureSeeded();
    return this.prisma.plan.findMany({ orderBy: { price: "asc" } });
  }

  private async ensureSeeded() {
    const count = await this.prisma.plan.count();
    if (count > 0) return;
    await this.prisma.plan.createMany({ data: DEFAULT_PLANS });
  }
}
