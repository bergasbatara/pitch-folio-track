import { Module } from "@nestjs/common";
import { PaymentsController } from "./payments.controller";
import { PaymentsService } from "./payments.service";
import { MidtransService } from "./midtrans.service";

@Module({
  providers: [PaymentsService, MidtransService],
  controllers: [PaymentsController],
})
export class PaymentsModule {}
