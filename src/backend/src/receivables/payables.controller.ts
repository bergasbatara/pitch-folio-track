import { Body, Controller, Delete, Get, Param, Patch, Post, Req, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { CreatePayableDto } from "./dto/create-payable.dto";
import { UpdatePayableDto } from "./dto/update-payable.dto";
import { PayablesService } from "./payables.service";

@UseGuards(JwtAuthGuard)
@Controller("companies/:companyId/payables")
export class PayablesController {
  constructor(private readonly payablesService: PayablesService) {}

  @Get()
  list(@Req() req: { user: { sub: string } }, @Param("companyId") companyId: string) {
    return this.payablesService.listPayables(req.user.sub, companyId);
  }

  @Get(":payableId")
  get(
    @Req() req: { user: { sub: string } },
    @Param("companyId") companyId: string,
    @Param("payableId") payableId: string,
  ) {
    return this.payablesService.getPayable(req.user.sub, companyId, payableId);
  }

  @Post()
  create(
    @Req() req: { user: { sub: string } },
    @Param("companyId") companyId: string,
    @Body() dto: CreatePayableDto,
  ) {
    return this.payablesService.createPayable(req.user.sub, companyId, dto);
  }

  @Patch(":payableId")
  update(
    @Req() req: { user: { sub: string } },
    @Param("companyId") companyId: string,
    @Param("payableId") payableId: string,
    @Body() dto: UpdatePayableDto,
  ) {
    return this.payablesService.updatePayable(req.user.sub, companyId, payableId, dto);
  }

  @Delete(":payableId")
  remove(
    @Req() req: { user: { sub: string } },
    @Param("companyId") companyId: string,
    @Param("payableId") payableId: string,
  ) {
    return this.payablesService.deletePayable(req.user.sub, companyId, payableId);
  }
}
