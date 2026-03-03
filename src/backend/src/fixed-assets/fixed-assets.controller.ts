import { Body, Controller, Delete, Get, Param, Patch, Post, Req, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { CreateFixedAssetDto } from "./dto/create-fixed-asset.dto";
import { UpdateFixedAssetDto } from "./dto/update-fixed-asset.dto";
import { PostDepreciationDto } from "./dto/post-depreciation.dto";
import { FixedAssetsService } from "./fixed-assets.service";

@UseGuards(JwtAuthGuard)
@Controller("companies/:companyId/fixed-assets")
export class FixedAssetsController {
  constructor(private readonly fixedAssetsService: FixedAssetsService) {}

  @Get()
  list(@Req() req: { user: { sub: string } }, @Param("companyId") companyId: string) {
    return this.fixedAssetsService.listAssets(req.user.sub, companyId);
  }

  @Get(":assetId")
  get(
    @Req() req: { user: { sub: string } },
    @Param("companyId") companyId: string,
    @Param("assetId") assetId: string,
  ) {
    return this.fixedAssetsService.getAsset(req.user.sub, companyId, assetId);
  }

  @Post()
  create(
    @Req() req: { user: { sub: string } },
    @Param("companyId") companyId: string,
    @Body() dto: CreateFixedAssetDto,
  ) {
    return this.fixedAssetsService.createAsset(req.user.sub, companyId, dto);
  }

  @Patch(":assetId")
  update(
    @Req() req: { user: { sub: string } },
    @Param("companyId") companyId: string,
    @Param("assetId") assetId: string,
    @Body() dto: UpdateFixedAssetDto,
  ) {
    return this.fixedAssetsService.updateAsset(req.user.sub, companyId, assetId, dto);
  }

  @Delete(":assetId")
  remove(
    @Req() req: { user: { sub: string } },
    @Param("companyId") companyId: string,
    @Param("assetId") assetId: string,
  ) {
    return this.fixedAssetsService.deleteAsset(req.user.sub, companyId, assetId);
  }

  @Post(":assetId/depreciation")
  postDepreciation(
    @Req() req: { user: { sub: string } },
    @Param("companyId") companyId: string,
    @Param("assetId") assetId: string,
    @Body() dto: PostDepreciationDto,
  ) {
    return this.fixedAssetsService.postDepreciation(req.user.sub, companyId, assetId, dto.date);
  }
}
