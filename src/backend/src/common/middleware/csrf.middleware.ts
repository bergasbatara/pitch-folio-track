import type { NextFunction, Request, Response } from "express";

const SAFE_METHODS = ["GET", "HEAD", "OPTIONS"];
const EXEMPT_PATHS = ["/auth/login", "/auth/register", "/auth/refresh", "/auth/csrf"];

export function csrfMiddleware(req: Request, res: Response, next: NextFunction) {
  if (process.env.CSRF_ENABLED === "false") {
    return next();
  }
  const method = String(req.method ?? "").toUpperCase();
  if (SAFE_METHODS.includes(method)) {
    return next();
  }
  if (EXEMPT_PATHS.some((path) => req.path?.startsWith(path))) {
    return next();
  }
  const cookieToken = req.cookies?.csrf_token;
  const headerToken =
    (req.headers["x-csrf-token"] as string | undefined) ??
    (req.headers["x-xsrf-token"] as string | undefined);
  if (!cookieToken || !headerToken || cookieToken !== headerToken) {
    return res.status(403).json({ message: "Invalid CSRF token" });
  }
  return next();
}
