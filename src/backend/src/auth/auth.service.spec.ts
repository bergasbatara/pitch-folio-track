import { ConflictException, UnauthorizedException } from "@nestjs/common";
import { AuthService } from "./auth.service";
import bcrypt from "bcrypt";

jest.mock("bcrypt", () => ({
  __esModule: true,
  default: {
    hash: jest.fn(),
    compare: jest.fn(),
  },
}));

describe("AuthService", () => {
  const bcryptMock = bcrypt as jest.Mocked<typeof bcrypt>;

  const makeService = () => {
    const prisma = {
      user: {
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
    };
    const jwtService = {
      signAsync: jest.fn(),
      verifyAsync: jest.fn(),
    };
    const configService = {
      get: jest.fn((key: string) => {
        const values: Record<string, string> = {
          JWT_ACCESS_SECRET: "access-secret",
          JWT_REFRESH_SECRET: "refresh-secret",
          JWT_ACCESS_TTL: "15m",
          JWT_REFRESH_TTL: "7d",
          AUTH_MAX_FAILED_ATTEMPTS: "5",
          AUTH_LOCKOUT_MINUTES: "15",
        };
        return values[key];
      }),
    };
    const auditService = {
      log: jest.fn(),
    };
    const mailService = {
      sendPasswordResetEmail: jest.fn(),
    };

    const service = new AuthService(
      prisma as any,
      jwtService as any,
      configService as any,
      auditService as any,
      mailService as any,
    );

    return { service, prisma, jwtService, configService, auditService, mailService };
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("rejects registration when email already exists", async () => {
    const { service, prisma } = makeService();
    prisma.user.findUnique.mockResolvedValue({ id: "u1" } as any);

    await expect(
      service.register({
        email: "user@test.com",
        password: "Password123!",
        name: "User",
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it("rejects login while the account is locked", async () => {
    const { service, prisma } = makeService();
    prisma.user.findUnique.mockResolvedValue({
      id: "u1",
      email: "user@test.com",
      password: "hashed",
      lockoutUntil: new Date(Date.now() + 10 * 60 * 1000),
    } as any);

    await expect(
      service.login({
        email: "user@test.com",
        password: "Password123!",
      }),
    ).rejects.toThrow(UnauthorizedException);

    expect(bcryptMock.compare).not.toHaveBeenCalled();
  });

  it("invalidates refresh token reuse when jti does not match", async () => {
    const { service, prisma, jwtService, auditService } = makeService();
    const header = Buffer.from(JSON.stringify({ alg: "HS256", kid: "legacy" })).toString("base64url");
    const payload = Buffer.from(JSON.stringify({ sub: "u1", email: "user@test.com", jti: "incoming-jti" })).toString("base64url");
    const refreshToken = `${header}.${payload}.sig`;

    jwtService.verifyAsync.mockResolvedValue({
      sub: "u1",
      email: "user@test.com",
      jti: "incoming-jti",
    });
    prisma.user.findUnique.mockResolvedValue({
      id: "u1",
      email: "user@test.com",
      refreshTokenHash: "stored-hash",
      refreshTokenJti: "different-jti",
    } as any);

    await expect(service.refresh(refreshToken)).rejects.toThrow(UnauthorizedException);

    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: "u1" },
      data: { refreshTokenHash: null, refreshTokenJti: null },
    });
    expect(auditService.log).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: "u1",
        action: "refresh_token_reuse",
      }),
    );
    expect(bcryptMock.compare).not.toHaveBeenCalled();
  });

  it("returns a development reset URL when mail is not configured", async () => {
    const { service, prisma, mailService } = makeService();
    prisma.user.findUnique.mockResolvedValue({
      id: "u1",
      email: "user@test.com",
    } as any);
    prisma.passwordResetToken = {
      deleteMany: jest.fn(),
      create: jest.fn(),
    };
    mailService.sendPasswordResetEmail.mockResolvedValue(false);

    const result = await service.forgotPassword({ email: "user@test.com" });

    expect(result.success).toBe(true);
    expect(result.resetUrl).toContain("/reset-password?token=");
    expect(mailService.sendPasswordResetEmail).toHaveBeenCalled();
  });
});
