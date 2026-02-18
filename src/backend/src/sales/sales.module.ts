<<<<<<< HEAD
import { Module } from "@nestjs/common";
import { SalesService } from "./sales.service";
import { SalesController } from "./sales.controller";

@Module({
=======
import { Module } from '@nestjs/common';
import { SalesService } from './sales.service';
import { SalesController } from './sales.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
>>>>>>> 0849f75 (Auth db error)
  providers: [SalesService],
  controllers: [SalesController],
})
export class SalesModule {}
