import { Body, Controller, Get, Patch, Post, Req, Res, UseGuards, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Throttle } from "@nestjs/throttler";
import type { Response } from "express";
import { randomBytes } from "crypto";
import { AuthService } from "./auth.service";
import { RegisterDto } from "./dto/register.dto";
import { LoginDto } from "./dto/login.dto";
import { RefreshDto } from "./dto/refresh.dto";
import { UpdateProfileDto } from "./dto/update-profile.dto";
import { ChangePasswordDto } from "./dto/change-password.dto";
import { JwtAuthGuard } from "./jwt-auth.guard";

@Controller("auth")
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  @Post("register")
  @Throttle({ default: { limit: 5, ttl: 60 } })
  async register(@Body() dto: RegisterDto, @Res({ passthrough: true }) res: Response) {
    const result = await this.authService.register(dto);
    this.setAuthCookies(res, result.accessToken, result.refreshToken);
    return { user: result.user };
  }

  @Post("login")
  @Throttle({ default: { limit: 5, ttl: 60 } })
  async login(@Body() dto: LoginDto, @Res({ passthrough: true }) res: Response) {
    const result = await this.authService.login(dto);
    this.setAuthCookies(res, result.accessToken, result.refreshToken);
    return { user: result.user };
  }

  @Post("refresh")
  @Throttle({ default: { limit: 10, ttl: 60 } })
  async refresh(
    @Req() req: { cookies?: Record<string, string> },
    @Body() dto: RefreshDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const refreshToken = dto.refreshToken ?? req.cookies?.refresh_token;
    if (!refreshToken) {
      throw new UnauthorizedException("Missing refresh token");
    }
    const tokens = await this.authService.refresh(refreshToken);
    this.setAuthCookies(res, tokens.accessToken, tokens.refreshToken);
    return { success: true };
  }

  @UseGuards(JwtAuthGuard)
  @Post("logout")
  async logout(@Req() req: { user: { sub: string } }, @Res({ passthrough: true }) res: Response) {
    await this.authService.logout(req.user.sub);
    this.clearAuthCookies(res);
    return { success: true };
  }

  @Get("csrf")
  csrf(@Res({ passthrough: true }) res: Response) {
    const token = this.generateCsrfToken();
    this.setCsrfCookie(res, token);
    return { csrfToken: token };
  }

  @UseGuards(JwtAuthGuard)
  @Get("me")
  me(@Req() req: { user: { sub: string } }) {
    return this.authService.me(req.user.sub);
  }

  @UseGuards(JwtAuthGuard)
  @Patch("profile")
  updateProfile(@Req() req: { user: { sub: string } }, @Body() dto: UpdateProfileDto) {
    return this.authService.updateProfile(req.user.sub, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Patch("password")
  changePassword(@Req() req: { user: { sub: string } }, @Body() dto: ChangePasswordDto) {
    return this.authService.changePassword(req.user.sub, dto);
  }

  private setAuthCookies(res: Response, accessToken: string, refreshToken: string) {
    const accessTtl = this.configService.get<string>("JWT_ACCESS_TTL") ?? "15m";
    const refreshTtl = this.configService.get<string>("JWT_REFRESH_TTL") ?? "7d";
    const secure = (this.configService.get<string>("NODE_ENV") ?? "development") === "production";
    res.cookie("access_token", accessToken, {
      httpOnly: true,
      sameSite: "lax",
      secure,
      maxAge: this.parseTtl(accessTtl, 15 * 60 * 1000),
    });
    res.cookie("refresh_token", refreshToken, {
      httpOnly: true,
      sameSite: "lax",
      secure,
      maxAge: this.parseTtl(refreshTtl, 7 * 24 * 60 * 60 * 1000),
    });
    const csrfToken = this.generateCsrfToken();
    this.setCsrfCookie(res, csrfToken, secure);
  }

  private clearAuthCookies(res: Response) {
    res.cookie("access_token", "", { httpOnly: true, sameSite: "lax", maxAge: 0 });
    res.cookie("refresh_token", "", { httpOnly: true, sameSite: "lax", maxAge: 0 });
    res.cookie("csrf_token", "", { httpOnly: false, sameSite: "lax", maxAge: 0 });
  }

  private generateCsrfToken() {
    return randomBytes(32).toString("hex");
  }

  private setCsrfCookie(res: Response, token: string, secureOverride?: boolean) {
    const secure = secureOverride ?? (this.configService.get<string>("NODE_ENV") ?? "development") === "production";
    res.cookie("csrf_token", token, {
      httpOnly: false,
      sameSite: "lax",
      secure,
      maxAge: 24 * 60 * 60 * 1000,
    });
  }

  private parseTtl(input: string, fallbackMs: number) {
    const match = /^(\d+)([smhd])$/.exec(input.trim());
    if (!match) return fallbackMs;
    const value = Number(match[1]);
    const unit = match[2];
    switch (unit) {
      case "s":
        return value * 1000;
      case "m":
        return value * 60 * 1000;
      case "h":
        return value * 60 * 60 * 1000;
      case "d":
        return value * 24 * 60 * 60 * 1000;
      default:
        return fallbackMs;
    }
  }
}
