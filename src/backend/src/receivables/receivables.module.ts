import { Module } from "@nestjs/common";
import { ReceivablesController } from "./receivables.controller";
import { ReceivablesService } from "./receivables.service";
import { PayablesController } from "./payables.controller";
import { PayablesService } from "./payables.service";

@Module({
  providers: [ReceivablesService, PayablesService],
  controllers: [ReceivablesController, PayablesController],
})
export class ReceivablesModule {}
