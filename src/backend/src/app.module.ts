import { Module } from "@nestjs/common";
import { APP_GUARD, APP_INTERCEPTOR } from "@nestjs/core";
import { ConfigModule } from "@nestjs/config";
import { ThrottlerGuard, ThrottlerModule } from "@nestjs/throttler";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { PrismaModule } from "./prisma/prisma.module";
import { AuditModule } from "./audit/audit.module";
import { AuditInterceptor } from "./audit/audit.interceptor";
import { AuthModule } from "./auth/auth.module";
import { CompaniesModule } from "./companies/companies.module";
import { ProductsModule } from "./products/products.module";
import { SalesModule } from "./sales/sales.module";
import { PurchasesModule } from "./purchases/purchases.module";
import { ReceivablesModule } from "./receivables/receivables.module";
import { CustomersModule } from "./customers/customers.module";
import { SuppliersModule } from "./suppliers/suppliers.module";
import { TaxesModule } from "./taxes/taxes.module";
import { FixedAssetsModule } from "./fixed-assets/fixed-assets.module";
import { ProfileModule } from "./profile/profile.module";
import { PlansModule } from "./plans/plans.module";
import { SubscriptionsModule } from "./subscriptions/subscriptions.module";
import { AccountsModule } from "./accounts/accounts.module";
import { JournalsModule } from "./journals/journals.module";
import { ReportsModule } from "./reports/reports.module";
import { PaymentsModule } from "./payments/payments.module";
import { PlanModule } from "./common/plan/plan.module";
import { OpeningBalanceItemsModule } from "./opening-balance-items/opening-balance-items.module";

const parseKeyPairs = (raw: unknown): Array<{ kid: string; secret: string }> => {
  const input = String(raw ?? "").trim();
  if (!input) return [];
  return input
    .split(",")
    .map((p) => p.trim())
    .filter(Boolean)
    .map((pair) => {
      const idx = pair.indexOf(":");
      if (idx === -1) {
        throw new Error('JWT_*_KEYS must be "kid:secret,kid2:secret2"');
      }
      const kid = pair.slice(0, idx).trim();
      const secret = pair.slice(idx + 1).trim();
      if (!kid || !secret) {
        throw new Error("JWT_*_KEYS contains empty kid/secret");
      }
      return { kid, secret };
    });
};

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: (env) => {
        const isProd = (env.NODE_ENV ?? "development") === "production";
        const accessPairs = parseKeyPairs(env.JWT_ACCESS_KEYS);
        const refreshPairs = parseKeyPairs(env.JWT_REFRESH_KEYS);
        const required: string[] = ["FRONTEND_URL"];
        if (accessPairs.length === 0) required.push("JWT_ACCESS_SECRET");
        if (refreshPairs.length === 0) required.push("JWT_REFRESH_SECRET");
        for (const key of required) {
          if (!env[key]) throw new Error(`Missing required env: ${key}`);
        }

        const allSecrets = [
          env.JWT_ACCESS_SECRET,
          env.JWT_REFRESH_SECRET,
          ...accessPairs.map((p) => p.secret),
          ...refreshPairs.map((p) => p.secret),
        ].filter(Boolean) as string[];

        if (isProd) {
          if (String(env.FRONTEND_URL ?? "").includes("*")) {
            throw new Error("FRONTEND_URL must not contain wildcard in production.");
          }
          for (const secret of allSecrets) {
            if (secret.startsWith("dev_")) throw new Error("JWT secrets must be rotated for production.");
            if (secret.length < 32) throw new Error("JWT secrets must be at least 32 characters in production.");
          }
          if (String(env.CSRF_ENABLED ?? "true") !== "true") {
            throw new Error("CSRF must be enabled in production.");
          }
          if (String(env.CORS_ALLOW_NO_ORIGIN ?? "false") === "true") {
            throw new Error("CORS_ALLOW_NO_ORIGIN must be false in production.");
          }
        }
        return env;
      },
    }),
    ThrottlerModule.forRoot({
      throttlers: [
        {
          ttl: Number(process.env.RATE_LIMIT_TTL ?? 60),
          limit: Number(process.env.RATE_LIMIT_LIMIT ?? 120),
        },
      ],
    }),
    PlanModule,
    PrismaModule,
    AuditModule,
    AuthModule,
    CompaniesModule,
    ProductsModule,
    SalesModule,
    PurchasesModule,
    ReceivablesModule,
    CustomersModule,
    SuppliersModule,
    TaxesModule,
    FixedAssetsModule,
    ProfileModule,
    PlansModule,
    SubscriptionsModule,
    AccountsModule,
    JournalsModule,
    ReportsModule,
    PaymentsModule,
    OpeningBalanceItemsModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_INTERCEPTOR, useClass: AuditInterceptor },
  ],
})
export class AppModule {}
