import { ForbiddenException } from "@nestjs/common";
import { AuditService } from "./audit.service";

describe("AuditService", () => {
  const makeService = () => {
    const prisma = {
      auditLog: {
        create: jest.fn(),
        findMany: jest.fn(),
        deleteMany: jest.fn(),
      },
      companyMember: {
        findUnique: jest.fn(),
      },
    };
    const service = new AuditService(prisma as any);
    return { service, prisma };
  };

  beforeEach(() => {
    process.env.AUDIT_LOG_RETENTION_DAYS = "0";
  });

  it("writes audit logs with metadata", async () => {
    const { service, prisma } = makeService();
    prisma.auditLog.create.mockResolvedValue({ id: "log-1" });

    await service.log({
      companyId: "company-1",
      userId: "user-1",
      action: "login",
      metadata: { source: "test" },
    });

    expect(prisma.auditLog.create).toHaveBeenCalled();
  });

  it("lists logs for members", async () => {
    const { service, prisma } = makeService();
    prisma.companyMember.findUnique.mockResolvedValue({ role: "member" });
    prisma.auditLog.findMany.mockResolvedValue([{ id: "log-1" }]);

    const result = await service.listLogs("user-1", "company-1", 100);
    expect(prisma.auditLog.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ take: 50 }),
    );
    expect(result).toEqual([{ id: "log-1" }]);
  });

  it("rejects log listing for non-members", async () => {
    const { service, prisma } = makeService();
    prisma.companyMember.findUnique.mockResolvedValue(null);

    await expect(service.listLogs("user-1", "company-1")).rejects.toBeInstanceOf(ForbiddenException);
  });
});
