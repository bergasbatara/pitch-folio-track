import { Controller, Get, Param, Query, Req, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { AuditService } from "./audit.service";

@UseGuards(JwtAuthGuard)
@Controller("companies/:companyId/audit-logs")
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get()
  list(
    @Req() req: { user: { sub: string } },
    @Param("companyId") companyId: string,
    @Query("limit") limit?: string,
  ) {
    const parsed = Number(limit);
    const safeLimit = Number.isFinite(parsed) ? parsed : 10;
    return this.auditService.listLogs(req.user.sub, companyId, safeLimit);
  }
}
