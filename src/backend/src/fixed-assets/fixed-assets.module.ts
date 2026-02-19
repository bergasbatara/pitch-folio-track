import { Module } from "@nestjs/common";
import { FixedAssetsController } from "./fixed-assets.controller";
import { FixedAssetsService } from "./fixed-assets.service";

@Module({
  providers: [FixedAssetsService],
  controllers: [FixedAssetsController],
})
export class FixedAssetsModule {}
