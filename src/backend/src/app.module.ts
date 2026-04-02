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

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: (env) => {
        const required = ["JWT_ACCESS_SECRET", "JWT_REFRESH_SECRET"];
        for (const key of required) {
          if (!env[key]) {
            throw new Error(`Missing required env: ${key}`);
          }
        }
        if ((env.NODE_ENV ?? "development") === "production") {
          if (env.JWT_ACCESS_SECRET?.startsWith("dev_") || env.JWT_REFRESH_SECRET?.startsWith("dev_")) {
            throw new Error("JWT secrets must be rotated for production.");
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
  ],
  controllers: [AppController],
  providers: [
    AppService,
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_INTERCEPTOR, useClass: AuditInterceptor },
  ],
})
export class AppModule {}
