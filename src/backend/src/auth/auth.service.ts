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
    const refreshSecret = this.getRefreshSecret();
    let payload: JwtPayload;
    try {
      payload = await this.jwtService.verifyAsync<JwtPayload>(refreshToken, {
        secret: refreshSecret,
      });
    } catch {
      throw new UnauthorizedException("Invalid refresh token");
    }
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
    });
    if (!user || !user.refreshTokenHash) {
      throw new UnauthorizedException("Invalid refresh token");
    }
    const matches = await bcrypt.compare(refreshToken, user.refreshTokenHash);
    if (!matches) {
      await this.prisma.user.update({
        where: { id: user.id },
        data: { refreshTokenHash: null },
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
      data: { refreshTokenHash: null },
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
        failedLoginAttempts: 0,
        lockoutUntil: null,
      },
    });
    return { success: true };
  }

  private async issueTokens(userId: string, email: string): Promise<AuthTokens> {
    const accessSecret = this.getAccessSecret();
    const refreshSecret = this.getRefreshSecret();
    const accessTtl = (this.configService.get<string>("JWT_ACCESS_TTL") ?? "15m") as StringValue;
    const refreshTtl = (this.configService.get<string>("JWT_REFRESH_TTL") ?? "7d") as StringValue;
    const payload: JwtPayload = { sub: userId, email };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: accessSecret,
        expiresIn: accessTtl,
      }),
      this.jwtService.signAsync(payload, {
        secret: refreshSecret,
        expiresIn: refreshTtl,
        jwtid: randomBytes(16).toString("hex"),
      }),
    ]);

    return { accessToken, refreshToken };
  }

  private async storeRefreshToken(userId: string, refreshToken: string) {
    const hash = await bcrypt.hash(refreshToken, 10);
    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshTokenHash: hash },
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

  private getAccessSecret() {
    const secret = this.configService.get<string>("JWT_ACCESS_SECRET");
    if (!secret) {
      throw new Error("JWT_ACCESS_SECRET is not set");
    }
    return secret;
  }

  private getRefreshSecret() {
    const secret = this.configService.get<string>("JWT_REFRESH_SECRET");
    if (!secret) {
      throw new Error("JWT_REFRESH_SECRET is not set");
    }
    return secret;
  }

  private sanitizeUser(user: User) {
    const { password, refreshTokenHash, failedLoginAttempts, lockoutUntil, ...safe } = user;
    return safe;
  }
}
