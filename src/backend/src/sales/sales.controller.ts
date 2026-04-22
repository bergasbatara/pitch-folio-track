import { Body, Controller, Delete, Get, Param, Patch, Post, Req, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { PlanGuard } from "../common/plan/plan.guard";
import { PlanRequired } from "../common/plan/plan-required.decorator";
import { SalesService } from "./sales.service";
import { CreateSaleDto } from "./dto/create-sale.dto";
import { UpdateSaleDto } from "./dto/update-sale.dto";

@UseGuards(JwtAuthGuard, PlanGuard)
@PlanRequired("business")
@Controller("companies/:companyId/sales")
export class SalesController {
  constructor(private readonly salesService: SalesService) {}

  @Get()
  list(@Req() req: { user: { sub: string } }, @Param("companyId") companyId: string) {
    return this.salesService.listSales(req.user.sub, companyId);
  }

  @Get(":saleId")
  get(
    @Req() req: { user: { sub: string } },
    @Param("companyId") companyId: string,
    @Param("saleId") saleId: string,
  ) {
    return this.salesService.getSale(req.user.sub, companyId, saleId);
  }

  @Post()
  create(
    @Req() req: { user: { sub: string } },
    @Param("companyId") companyId: string,
    @Body() dto: CreateSaleDto,
  ) {
    return this.salesService.createSale(req.user.sub, companyId, dto);
  }

  @Patch(":saleId")
  update(
    @Req() req: { user: { sub: string } },
    @Param("companyId") companyId: string,
    @Param("saleId") saleId: string,
    @Body() dto: UpdateSaleDto,
  ) {
    return this.salesService.updateSale(req.user.sub, companyId, saleId, dto);
  }

  @Delete(":saleId")
  remove(
    @Req() req: { user: { sub: string } },
    @Param("companyId") companyId: string,
    @Param("saleId") saleId: string,
  ) {
    return this.salesService.deleteSale(req.user.sub, companyId, saleId);
  }
}
