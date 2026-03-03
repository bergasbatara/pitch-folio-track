import { Module } from "@nestjs/common";
import { JournalsController } from "./journals.controller";
import { JournalsService } from "./journals.service";

@Module({
  providers: [JournalsService],
  controllers: [JournalsController],
})
export class JournalsModule {}
