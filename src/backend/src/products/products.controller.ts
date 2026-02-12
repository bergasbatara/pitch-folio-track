import { Body, Controller, Delete, Get, Param, Patch, Post, Req, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { ProductsService } from "./products.service";
import { CreateProductDto } from "./dto/create-product.dto";
import { UpdateProductDto } from "./dto/update-product.dto";

@UseGuards(JwtAuthGuard)
@Controller("companies/:companyId/products")
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  list(@Req() req: { user: { sub: string } }, @Param("companyId") companyId: string) {
    return this.productsService.listProducts(req.user.sub, companyId);
  }

  @Get(":productId")
  get(
    @Req() req: { user: { sub: string } },
    @Param("companyId") companyId: string,
    @Param("productId") productId: string,
  ) {
    return this.productsService.getProduct(req.user.sub, companyId, productId);
  }

  @Post()
  create(
    @Req() req: { user: { sub: string } },
    @Param("companyId") companyId: string,
    @Body() dto: CreateProductDto,
  ) {
    return this.productsService.createProduct(req.user.sub, companyId, dto);
  }

  @Patch(":productId")
  update(
    @Req() req: { user: { sub: string } },
    @Param("companyId") companyId: string,
    @Param("productId") productId: string,
    @Body() dto: UpdateProductDto,
  ) {
    return this.productsService.updateProduct(req.user.sub, companyId, productId, dto);
  }

  @Delete(":productId")
  remove(
    @Req() req: { user: { sub: string } },
    @Param("companyId") companyId: string,
    @Param("productId") productId: string,
  ) {
    return this.productsService.deleteProduct(req.user.sub, companyId, productId);
  }
}
