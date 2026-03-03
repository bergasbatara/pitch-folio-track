import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { PrismaModule } from "./prisma/prisma.module";
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

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
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
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
