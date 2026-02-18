import { Body, Controller, Delete, Get, Param, Patch, Post, Req, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { CreatePurchaseDto } from "./dto/create-purchase.dto";
import { UpdatePurchaseDto } from "./dto/update-purchase.dto";
import { PurchasesService } from "./purchases.service";

@UseGuards(JwtAuthGuard)
@Controller("companies/:companyId/purchases")
export class PurchasesController {
  constructor(private readonly purchasesService: PurchasesService) {}

  @Get()
  list(@Req() req: { user: { sub: string } }, @Param("companyId") companyId: string) {
    return this.purchasesService.listPurchases(req.user.sub, companyId);
  }

  @Get(":purchaseId")
  get(
    @Req() req: { user: { sub: string } },
    @Param("companyId") companyId: string,
    @Param("purchaseId") purchaseId: string,
  ) {
    return this.purchasesService.getPurchase(req.user.sub, companyId, purchaseId);
  }

  @Post()
  create(
    @Req() req: { user: { sub: string } },
    @Param("companyId") companyId: string,
    @Body() dto: CreatePurchaseDto,
  ) {
    return this.purchasesService.createPurchase(req.user.sub, companyId, dto);
  }

  @Patch(":purchaseId")
  update(
    @Req() req: { user: { sub: string } },
    @Param("companyId") companyId: string,
    @Param("purchaseId") purchaseId: string,
    @Body() dto: UpdatePurchaseDto,
  ) {
    return this.purchasesService.updatePurchase(req.user.sub, companyId, purchaseId, dto);
  }

  @Delete(":purchaseId")
  remove(
    @Req() req: { user: { sub: string } },
    @Param("companyId") companyId: string,
    @Param("purchaseId") purchaseId: string,
  ) {
    return this.purchasesService.deletePurchase(req.user.sub, companyId, purchaseId);
  }
}
