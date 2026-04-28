import { Module } from "@nestjs/common";
import { OpeningBalanceItemsController } from "./opening-balance-items.controller";
import { OpeningBalanceItemsService } from "./opening-balance-items.service";

@Module({
  controllers: [OpeningBalanceItemsController],
  providers: [OpeningBalanceItemsService],
})
export class OpeningBalanceItemsModule {}

