import { ForbiddenException, Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { Prisma } from "@prisma/client";

type AuditInput = {
  companyId?: string | null;
  userId?: string | null;
  action: string;
  entity?: string | null;
  entityId?: string | null;
  route?: string | null;
  ip?: string | null;
  userAgent?: string | null;
  metadata?: Record<string, unknown> | null;
};

@Injectable()
export class AuditService {
  private readonly retentionDays: number;
  constructor(private readonly prisma: PrismaService) {
    const raw = process.env.AUDIT_LOG_RETENTION_DAYS;
    const parsed = Number(raw);
    this.retentionDays = Number.isFinite(parsed) && parsed > 0 ? parsed : 90;
    if (this.retentionDays > 0) {
      const dayMs = 24 * 60 * 60 * 1000;
      setInterval(() => {
        this.pruneOldLogs().catch(() => undefined);
      }, dayMs).unref?.();
      this.pruneOldLogs().catch(() => undefined);
    }
  }

  async log(entry: AuditInput) {
    return this.prisma.auditLog.create({
      data: {
        companyId: entry.companyId ?? null,
        userId: entry.userId ?? null,
        action: entry.action,
        entity: entry.entity ?? null,
        entityId: entry.entityId ?? null,
        route: entry.route ?? null,
        ip: entry.ip ?? null,
        userAgent: entry.userAgent ?? null,
        metadata:
          entry.metadata === null
            ? Prisma.JsonNull
            : (entry.metadata as Prisma.InputJsonValue),
      },
    });
  }

  async listLogs(userId: string, companyId: string, limit = 10) {
    await this.assertMember(userId, companyId);
    return this.prisma.auditLog.findMany({
      where: { companyId },
      orderBy: { createdAt: "desc" },
      take: Math.min(Math.max(limit, 1), 50),
    });
  }

  private async assertMember(userId: string, companyId: string) {
    const membership = await this.prisma.companyMember.findUnique({
      where: { userId_companyId: { userId, companyId } },
    });
    if (!membership) {
      throw new ForbiddenException("Not a member of this company");
    }
  }

  private async pruneOldLogs() {
    if (this.retentionDays <= 0) return;
    const cutoff = new Date(Date.now() - this.retentionDays * 24 * 60 * 60 * 1000);
    await this.prisma.auditLog.deleteMany({
      where: { createdAt: { lt: cutoff } },
    });
  }
}
