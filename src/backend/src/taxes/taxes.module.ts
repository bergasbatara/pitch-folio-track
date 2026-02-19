import { Module } from "@nestjs/common";
import { TaxesController } from "./taxes.controller";
import { TaxesService } from "./taxes.service";

@Module({
  providers: [TaxesService],
  controllers: [TaxesController],
})
export class TaxesModule {}
