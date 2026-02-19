import { Body, Controller, Delete, Get, Param, Patch, Post, Req, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { CreateTaxCodeDto } from "./dto/create-tax-code.dto";
import { UpdateTaxCodeDto } from "./dto/update-tax-code.dto";
import { TaxesService } from "./taxes.service";

@UseGuards(JwtAuthGuard)
@Controller("companies/:companyId/tax-codes")
export class TaxesController {
  constructor(private readonly taxesService: TaxesService) {}

  @Get()
  list(@Req() req: { user: { sub: string } }, @Param("companyId") companyId: string) {
    return this.taxesService.listTaxCodes(req.user.sub, companyId);
  }

  @Post()
  create(
    @Req() req: { user: { sub: string } },
    @Param("companyId") companyId: string,
    @Body() dto: CreateTaxCodeDto,
  ) {
    return this.taxesService.createTaxCode(req.user.sub, companyId, dto);
  }

  @Patch(":taxCodeId")
  update(
    @Req() req: { user: { sub: string } },
    @Param("companyId") companyId: string,
    @Param("taxCodeId") taxCodeId: string,
    @Body() dto: UpdateTaxCodeDto,
  ) {
    return this.taxesService.updateTaxCode(req.user.sub, companyId, taxCodeId, dto);
  }

  @Delete(":taxCodeId")
  remove(
    @Req() req: { user: { sub: string } },
    @Param("companyId") companyId: string,
    @Param("taxCodeId") taxCodeId: string,
  ) {
    return this.taxesService.deleteTaxCode(req.user.sub, companyId, taxCodeId);
  }
}
