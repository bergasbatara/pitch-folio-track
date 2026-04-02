import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from "@nestjs/common";
import { Observable, tap } from "rxjs";
import { AuditService } from "./audit.service";

const SENSITIVE_KEYS = ["password", "refreshToken", "accessToken", "token"];

const redact = (value: unknown): unknown => {
  if (Array.isArray(value)) {
    return value.map(redact);
  }
  if (value && typeof value === "object") {
    const obj = value as Record<string, unknown>;
    const next: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(obj)) {
      if (SENSITIVE_KEYS.some((s) => key.toLowerCase().includes(s.toLowerCase()))) {
        next[key] = "[REDACTED]";
      } else {
        next[key] = redact(val);
      }
    }
    return next;
  }
  return value;
};

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(private readonly auditService: AuditService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req = context.switchToHttp().getRequest();
    const method = String(req.method ?? "").toUpperCase();
    const shouldLog = ["POST", "PUT", "PATCH", "DELETE"].includes(method);

    if (!shouldLog) {
      return next.handle();
    }

    const userId = req.user?.sub ?? null;
    const companyId = req.params?.companyId ?? null;
    const route = req.originalUrl ?? req.url ?? null;
    const ip = req.ip ?? req.connection?.remoteAddress ?? null;
    const userAgent = req.headers?.["user-agent"] ?? null;

    const metadata = {
      params: redact(req.params),
      query: redact(req.query),
      body: redact(req.body),
    } as Record<string, unknown>;

    const action = `${method} ${route ?? ""}`.trim();
    const entity = req.params?.companyId ? route?.split("/")[3] ?? null : route?.split("/")[1] ?? null;
    const entityId = req.params?.id ?? req.params?.[`${entity ?? ""}Id`] ?? null;

    return next.handle().pipe(
      tap({
        next: () => {
          this.auditService
            .log({
              companyId,
              userId,
              action,
              entity,
              entityId,
              route,
              ip,
              userAgent,
              metadata,
            })
            .catch(() => undefined);
        },
      }),
    );
  }
}
