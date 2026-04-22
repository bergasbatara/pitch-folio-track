import { Controller, Get, Param, Query, Req, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { PlanGuard } from "../common/plan/plan.guard";
import { PlanRequired } from "../common/plan/plan-required.decorator";
import { ReportsService } from "./reports.service";

@UseGuards(JwtAuthGuard, PlanGuard)
@PlanRequired("business")
@Controller("companies/:companyId/reports")
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get("daily")
  getDaily(
    @Req() req: { user: { sub: string } },
    @Param("companyId") companyId: string,
    @Query("date") date?: string,
  ) {
    return this.reportsService.getDailyStatement(req.user.sub, companyId, date);
  }

  @Get("range")
  getRange(
    @Req() req: { user: { sub: string } },
    @Param("companyId") companyId: string,
    @Query("from") from: string,
    @Query("to") to: string,
  ) {
    return this.reportsService.getRangeStatement(req.user.sub, companyId, from, to);
  }

  @Get("notes")
  getNotes(
    @Req() req: { user: { sub: string } },
    @Param("companyId") companyId: string,
    @Query("from") from: string,
    @Query("to") to: string,
  ) {
    return this.reportsService.getNotesSummary(req.user.sub, companyId, from, to);
  }

  @Get("balance")
  getBalance(
    @Req() req: { user: { sub: string } },
    @Param("companyId") companyId: string,
    @Query("asOf") asOf?: string,
  ) {
    return this.reportsService.getBalanceSnapshot(req.user.sub, companyId, asOf);
  }
}
