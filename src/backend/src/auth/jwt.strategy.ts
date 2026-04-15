import { Injectable } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { ConfigService } from "@nestjs/config";
import { JwtPayload } from "./auth.types";
import { getJwtKid, parseJwtKeys } from "./jwt-keys";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(configService: ConfigService) {
    const accessKeys = parseJwtKeys(
      configService.get<string>("JWT_ACCESS_KEYS"),
      configService.get<string>("JWT_ACCESS_SECRET"),
      "JWT_ACCESS_KEYS",
    );
    const cookieExtractor = (req: { cookies?: Record<string, string> }) => {
      return req?.cookies?.access_token ?? null;
    };
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        cookieExtractor,
        ExtractJwt.fromAuthHeaderAsBearerToken(),
      ]),
      ignoreExpiration: false,
      secretOrKeyProvider: (_req: unknown, rawJwtToken: string, done: (err: unknown, secret?: string) => void) => {
        const kid = getJwtKid(rawJwtToken);
        const secret = (kid && accessKeys.secretsByKid[kid]) ? accessKeys.secretsByKid[kid] : accessKeys.currentSecret;
        done(null, secret);
      },
    });
  }

  validate(payload: JwtPayload) {
    return payload;
  }
}
