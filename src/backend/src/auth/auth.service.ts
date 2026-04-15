import { Injectable, UnauthorizedException, ConflictException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
import bcrypt from "bcrypt";
import type { StringValue } from "ms";
import { PrismaService } from "../prisma/prisma.service";
import { RegisterDto } from "./dto/register.dto";
import { LoginDto } from "./dto/login.dto";
import { RefreshDto } from "./dto/refresh.dto";
import { UpdateProfileDto } from "./dto/update-profile.dto";
import { ChangePasswordDto } from "./dto/change-password.dto";
import { AuthTokens, JwtPayload } from "./auth.types";
import type { User } from "@prisma/client";
import { AuditService } from "../audit/audit.service";
import { randomBytes } from "crypto";
import { getJwtKid, parseJwtKeys } from "./jwt-keys";

function unsafeDecodeJwtPayload(token: string): Record<string, unknown> | null {
  // We intentionally decode without verifying to extract non-sensitive claims like `jti`.
  // Verification happens separately via JwtService.verifyAsync.
  try {
    const parts = token.split(".");
    if (parts.length < 2) return null;
    const payload = Buffer.from(parts[1], "base64url").toString("utf8");
    const parsed = JSON.parse(payload) as unknown;
    if (!parsed || typeof parsed !== "object") return null;
    return parsed as Record<string, unknown>;
  } catch {
    return null;
  }
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly auditService: AuditService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (existing) {
      throw new ConflictException("Email already registered");
    }
    const passwordHash = await bcrypt.hash(dto.password, 10);
    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        password: passwordHash,
        name: dto.name,
      },
    });
    const tokens = await this.issueTokens(user.id, user.email);
    await this.storeRefreshToken(user.id, tokens.refreshToken);
    return {
      user: this.sanitizeUser(user),
      ...tokens,
    };
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (!user) {
      throw new UnauthorizedException("Invalid credentials");
    }
    const now = Date.now();
    if (user.lockoutUntil && user.lockoutUntil.getTime() > now) {
      const remainingMs = user.lockoutUntil.getTime() - now;
      const remainingMinutes = Math.ceil(remainingMs / (60 * 1000));
      throw new UnauthorizedException(`Account locked. Try again in ${remainingMinutes} minutes.`);
    }
    if (user.lockoutUntil && user.lockoutUntil.getTime() <= now) {
      await this.clearLockout(user.id);
    }
    const valid = await bcrypt.compare(dto.password, user.password);
    if (!valid) {
      await this.recordFailedLogin(user);
      throw new UnauthorizedException("Invalid credentials");
    }
    await this.clearLockout(user.id);
    const tokens = await this.issueTokens(user.id, user.email);
    await this.storeRefreshToken(user.id, tokens.refreshToken);
    return {
      user: this.sanitizeUser(user),
      ...tokens,
    };
  }

  async refresh(refreshToken: string) {
    let payload: JwtPayload;
    const decoded = unsafeDecodeJwtPayload(refreshToken);
    try {
      const refreshKeys = parseJwtKeys(
        this.configService.get<string>("JWT_REFRESH_KEYS"),
        this.configService.get<string>("JWT_REFRESH_SECRET"),
        "JWT_REFRESH_KEYS",
      );
      const kid = getJwtKid(refreshToken);
      const secretsToTry = kid
        ? [refreshKeys.secretsByKid[kid], refreshKeys.currentSecret].filter(Boolean)
        : refreshKeys.allSecrets;
      let verified: JwtPayload | null = null;
      for (const secret of secretsToTry) {
        try {
          verified = await this.jwtService.verifyAsync<JwtPayload>(refreshToken, { secret });
          break;
        } catch {
          // try next secret
        }
      }
      if (!verified) {
        throw new UnauthorizedException("Invalid refresh token");
      }
      payload = verified;
    } catch {
      throw new UnauthorizedException("Invalid refresh token");
    }
    const tokenJti =
      (decoded && typeof decoded.jti === "string" ? decoded.jti : null) ??
      // Fallback: some libs may only expose `jti` on the verified payload.
      (typeof (payload as any)?.jti === "string" ? ((payload as any).jti as string) : null);
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
    });
    if (!user || !user.refreshTokenHash) {
      throw new UnauthorizedException("Invalid refresh token");
    }
    // If we have a stored jti, enforce exact token match to prevent "old token still works" cases.
    if (user.refreshTokenJti && user.refreshTokenJti !== tokenJti) {
      await this.prisma.user.update({
        where: { id: user.id },
        data: { refreshTokenHash: null, refreshTokenJti: null },
      });
      await this.auditService.log({
        userId: user.id,
        action: "refresh_token_reuse",
        entity: "auth",
        entityId: user.id,
        route: "/auth/refresh",
        metadata: { reason: "refresh jti mismatch" },
      });
      throw new UnauthorizedException("Invalid refresh token");
    }
    const matches = await bcrypt.compare(refreshToken, user.refreshTokenHash);
    if (!matches) {
      await this.prisma.user.update({
        where: { id: user.id },
        data: { refreshTokenHash: null, refreshTokenJti: null },
      });
      await this.auditService.log({
        userId: user.id,
        action: "refresh_token_reuse",
        entity: "auth",
        entityId: user.id,
        route: "/auth/refresh",
        metadata: { reason: "refresh token mismatch" },
      });
      throw new UnauthorizedException("Invalid refresh token");
    }
    const tokens = await this.issueTokens(user.id, user.email);
    await this.storeRefreshToken(user.id, tokens.refreshToken);
    return tokens;
  }

  async logout(userId: string) {
    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshTokenHash: null, refreshTokenJti: null },
    });
    return { success: true };
  }

  async me(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user) {
      throw new UnauthorizedException("User not found");
    }
    return this.sanitizeUser(user);
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: {
        name: dto.name,
        avatar: dto.avatar,
        address: dto.address,
        phone: dto.phone,
        companyName: dto.companyName,
      },
    });
    return this.sanitizeUser(user);
  }

  async changePassword(userId: string, dto: ChangePasswordDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user) {
      throw new UnauthorizedException("User not found");
    }
    const valid = await bcrypt.compare(dto.currentPassword, user.password);
    if (!valid) {
      throw new UnauthorizedException("Invalid credentials");
    }
    const passwordHash = await bcrypt.hash(dto.newPassword, 10);
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        password: passwordHash,
        refreshTokenHash: null,
        refreshTokenJti: null,
        failedLoginAttempts: 0,
        lockoutUntil: null,
      },
    });
    return { success: true };
  }

  private async issueTokens(userId: string, email: string): Promise<AuthTokens> {
    const accessKeys = parseJwtKeys(
      this.configService.get<string>("JWT_ACCESS_KEYS"),
      this.configService.get<string>("JWT_ACCESS_SECRET"),
      "JWT_ACCESS_KEYS",
    );
    const refreshKeys = parseJwtKeys(
      this.configService.get<string>("JWT_REFRESH_KEYS"),
      this.configService.get<string>("JWT_REFRESH_SECRET"),
      "JWT_REFRESH_KEYS",
    );
    const accessTtl = (this.configService.get<string>("JWT_ACCESS_TTL") ?? "15m") as StringValue;
    const refreshTtl = (this.configService.get<string>("JWT_REFRESH_TTL") ?? "7d") as StringValue;
    const payload: JwtPayload = { sub: userId, email };
    // Ensure refresh tokens always change even if issued within the same second.
    const refreshPayload = { ...payload, jti: randomBytes(16).toString("hex") };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: accessKeys.currentSecret,
        expiresIn: accessTtl,
        header: { kid: accessKeys.currentKid, alg: "HS256" },
      }),
      this.jwtService.signAsync(refreshPayload as any, {
        secret: refreshKeys.currentSecret,
        expiresIn: refreshTtl,
        header: { kid: refreshKeys.currentKid, alg: "HS256" },
      }),
    ]);

    return { accessToken, refreshToken };
  }

  private async storeRefreshToken(userId: string, refreshToken: string) {
    const hash = await bcrypt.hash(refreshToken, 10);
    const decoded = unsafeDecodeJwtPayload(refreshToken);
    const jti = decoded && typeof decoded.jti === "string" ? decoded.jti : null;
    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshTokenHash: hash, refreshTokenJti: jti },
    });
  }

  private getMaxFailedAttempts() {
    const raw = this.configService.get<string>("AUTH_MAX_FAILED_ATTEMPTS");
    const parsed = Number(raw);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 5;
  }

  private getLockoutMinutes() {
    const raw = this.configService.get<string>("AUTH_LOCKOUT_MINUTES");
    const parsed = Number(raw);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 15;
  }

  private async recordFailedLogin(user: User) {
    const nextAttempts = (user.failedLoginAttempts ?? 0) + 1;
    const maxAttempts = this.getMaxFailedAttempts();
    const lockoutMinutes = this.getLockoutMinutes();
    const lockoutUntil =
      nextAttempts >= maxAttempts ? new Date(Date.now() + lockoutMinutes * 60 * 1000) : null;
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        failedLoginAttempts: nextAttempts,
        lockoutUntil,
      },
    });
  }

  private async clearLockout(userId: string) {
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        failedLoginAttempts: 0,
        lockoutUntil: null,
      },
    });
  }

  private sanitizeUser(user: User) {
    const { password, refreshTokenHash, failedLoginAttempts, lockoutUntil, ...safe } = user;
    return safe;
  }
}
