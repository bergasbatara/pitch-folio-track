import { Body, Controller, Delete, Get, Param, Patch, Post, Req, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { PlanGuard } from "../common/plan/plan.guard";
import { PlanRequired } from "../common/plan/plan-required.decorator";
import { CreateOpeningBalanceItemDto } from "./dto/create-opening-balance-item.dto";
import { UpdateOpeningBalanceItemDto } from "./dto/update-opening-balance-item.dto";
import { OpeningBalanceItemsService } from "./opening-balance-items.service";

@UseGuards(JwtAuthGuard, PlanGuard)
@PlanRequired("business")
@Controller("companies/:companyId/opening-balance-items")
export class OpeningBalanceItemsController {
  constructor(private readonly service: OpeningBalanceItemsService) {}

  @Get()
  list(@Req() req: { user: { sub: string } }, @Param("companyId") companyId: string) {
    return this.service.list(req.user.sub, companyId);
  }

  @Post()
  create(
    @Req() req: { user: { sub: string } },
    @Param("companyId") companyId: string,
    @Body() dto: CreateOpeningBalanceItemDto,
  ) {
    return this.service.create(req.user.sub, companyId, dto);
  }

  @Patch(":itemId")
  update(
    @Req() req: { user: { sub: string } },
    @Param("companyId") companyId: string,
    @Param("itemId") itemId: string,
    @Body() dto: UpdateOpeningBalanceItemDto,
  ) {
    return this.service.update(req.user.sub, companyId, itemId, dto);
  }

  @Delete(":itemId")
  remove(
    @Req() req: { user: { sub: string } },
    @Param("companyId") companyId: string,
    @Param("itemId") itemId: string,
  ) {
    return this.service.remove(req.user.sub, companyId, itemId);
  }
}

