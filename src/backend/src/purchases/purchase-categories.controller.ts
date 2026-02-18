import { Body, Controller, Delete, Get, Param, Patch, Post, Req, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { CreatePurchaseCategoryDto } from "./dto/create-purchase-category.dto";
import { UpdatePurchaseCategoryDto } from "./dto/update-purchase-category.dto";
import { PurchaseCategoriesService } from "./purchase-categories.service";

@UseGuards(JwtAuthGuard)
@Controller("companies/:companyId/purchase-categories")
export class PurchaseCategoriesController {
  constructor(private readonly categoriesService: PurchaseCategoriesService) {}

  @Get()
  list(@Req() req: { user: { sub: string } }, @Param("companyId") companyId: string) {
    return this.categoriesService.listCategories(req.user.sub, companyId);
  }

  @Post()
  create(
    @Req() req: { user: { sub: string } },
    @Param("companyId") companyId: string,
    @Body() dto: CreatePurchaseCategoryDto,
  ) {
    return this.categoriesService.createCategory(req.user.sub, companyId, dto);
  }

  @Patch(":categoryId")
  update(
    @Req() req: { user: { sub: string } },
    @Param("companyId") companyId: string,
    @Param("categoryId") categoryId: string,
    @Body() dto: UpdatePurchaseCategoryDto,
  ) {
    return this.categoriesService.updateCategory(req.user.sub, companyId, categoryId, dto);
  }

  @Delete(":categoryId")
  remove(
    @Req() req: { user: { sub: string } },
    @Param("companyId") companyId: string,
    @Param("categoryId") categoryId: string,
  ) {
    return this.categoriesService.deleteCategory(req.user.sub, companyId, categoryId);
  }
}
