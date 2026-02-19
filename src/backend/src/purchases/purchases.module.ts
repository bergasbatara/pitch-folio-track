import { Module } from "@nestjs/common";
import { PurchaseCategoriesController } from "./purchase-categories.controller";
import { PurchaseCategoriesService } from "./purchase-categories.service";
import { PurchasesController } from "./purchases.controller";
import { PurchasesService } from "./purchases.service";

@Module({
  providers: [PurchasesService, PurchaseCategoriesService],
  controllers: [PurchasesController, PurchaseCategoriesController],
})
export class PurchasesModule {}
