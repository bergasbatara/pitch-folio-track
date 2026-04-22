import { Global, Module } from "@nestjs/common";
import { PlanGuard } from "./plan.guard";

@Global()
@Module({
  providers: [PlanGuard],
  exports: [PlanGuard],
})
export class PlanModule {}

