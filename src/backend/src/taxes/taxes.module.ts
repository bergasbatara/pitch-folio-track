import { Module } from "@nestjs/common";
import { TaxesController } from "./taxes.controller";
import { TaxesService } from "./taxes.service";
import { TaxPostingsController } from "./tax-postings.controller";

@Module({
  providers: [TaxesService],
  controllers: [TaxesController, TaxPostingsController],
})
export class TaxesModule {}
