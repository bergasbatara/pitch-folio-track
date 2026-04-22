import { Body, Controller, Delete, Get, Param, Patch, Post, Req, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { PlanGuard } from "../common/plan/plan.guard";
import { PlanRequired } from "../common/plan/plan-required.decorator";
import { CreateReceivableDto } from "./dto/create-receivable.dto";
import { UpdateReceivableDto } from "./dto/update-receivable.dto";
import { ReceivablesService } from "./receivables.service";

@UseGuards(JwtAuthGuard, PlanGuard)
@PlanRequired("business")
@Controller("companies/:companyId/receivables")
export class ReceivablesController {
  constructor(private readonly receivablesService: ReceivablesService) {}

  @Get()
  list(@Req() req: { user: { sub: string } }, @Param("companyId") companyId: string) {
    return this.receivablesService.listReceivables(req.user.sub, companyId);
  }

  @Get(":receivableId")
  get(
    @Req() req: { user: { sub: string } },
    @Param("companyId") companyId: string,
    @Param("receivableId") receivableId: string,
  ) {
    return this.receivablesService.getReceivable(req.user.sub, companyId, receivableId);
  }

  @Post()
  create(
    @Req() req: { user: { sub: string } },
    @Param("companyId") companyId: string,
    @Body() dto: CreateReceivableDto,
  ) {
    return this.receivablesService.createReceivable(req.user.sub, companyId, dto);
  }

  @Patch(":receivableId")
  update(
    @Req() req: { user: { sub: string } },
    @Param("companyId") companyId: string,
    @Param("receivableId") receivableId: string,
    @Body() dto: UpdateReceivableDto,
  ) {
    return this.receivablesService.updateReceivable(req.user.sub, companyId, receivableId, dto);
  }

  @Delete(":receivableId")
  remove(
    @Req() req: { user: { sub: string } },
    @Param("companyId") companyId: string,
    @Param("receivableId") receivableId: string,
  ) {
    return this.receivablesService.deleteReceivable(req.user.sub, companyId, receivableId);
  }
}
