import { Body, Controller, Delete, Get, Param, Patch, Post, Req, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { CreateSupplierDto } from "./dto/create-supplier.dto";
import { UpdateSupplierDto } from "./dto/update-supplier.dto";
import { SuppliersService } from "./suppliers.service";

@UseGuards(JwtAuthGuard)
@Controller("companies/:companyId/suppliers")
export class SuppliersController {
  constructor(private readonly suppliersService: SuppliersService) {}

  @Get()
  list(@Req() req: { user: { sub: string } }, @Param("companyId") companyId: string) {
    return this.suppliersService.listSuppliers(req.user.sub, companyId);
  }

  @Get(":supplierId")
  get(
    @Req() req: { user: { sub: string } },
    @Param("companyId") companyId: string,
    @Param("supplierId") supplierId: string,
  ) {
    return this.suppliersService.getSupplier(req.user.sub, companyId, supplierId);
  }

  @Post()
  create(
    @Req() req: { user: { sub: string } },
    @Param("companyId") companyId: string,
    @Body() dto: CreateSupplierDto,
  ) {
    return this.suppliersService.createSupplier(req.user.sub, companyId, dto);
  }

  @Patch(":supplierId")
  update(
    @Req() req: { user: { sub: string } },
    @Param("companyId") companyId: string,
    @Param("supplierId") supplierId: string,
    @Body() dto: UpdateSupplierDto,
  ) {
    return this.suppliersService.updateSupplier(req.user.sub, companyId, supplierId, dto);
  }

  @Delete(":supplierId")
  remove(
    @Req() req: { user: { sub: string } },
    @Param("companyId") companyId: string,
    @Param("supplierId") supplierId: string,
  ) {
    return this.suppliersService.deleteSupplier(req.user.sub, companyId, supplierId);
  }
}
