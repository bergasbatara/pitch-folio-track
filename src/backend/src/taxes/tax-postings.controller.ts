import { Body, Controller, Post, Param, Req, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { PlanGuard } from "../common/plan/plan.guard";
import { PlanRequired } from "../common/plan/plan-required.decorator";
import { PostTaxSettlementDto } from "./dto/post-tax-settlement.dto";
import { TaxesService } from "./taxes.service";

@UseGuards(JwtAuthGuard, PlanGuard)
@PlanRequired("business")
@Controller("companies/:companyId/taxes")
export class TaxPostingsController {
  constructor(private readonly taxesService: TaxesService) {}

  @Post("settlement")
  postSettlement(
    @Req() req: { user: { sub: string } },
    @Param("companyId") companyId: string,
    @Body() dto: PostTaxSettlementDto,
  ) {
    return this.taxesService.postTaxSettlement(req.user.sub, companyId, dto);
  }
}
