import { NestFactory } from "@nestjs/core";
import { ValidationPipe } from "@nestjs/common";
import { AppModule } from "./app.module";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import { TrimPipe } from "./common/pipes/trim.pipe";
import { csrfMiddleware } from "./common/middleware/csrf.middleware";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.getHttpAdapter().getInstance().disable("etag");
  const rawOrigins = process.env.FRONTEND_URL ?? "http://localhost:8080";
  const allowedOrigins = rawOrigins.split(",").map((o) => o.trim()).filter(Boolean);
  const isProd = (process.env.NODE_ENV ?? "development") === "production";
  const allowNoOrigin =
    (process.env.CORS_ALLOW_NO_ORIGIN ?? (isProd ? "false" : "true")) === "true";
  app.enableCors({
    origin: (origin, callback) => {
      if (!origin) {
        return allowNoOrigin ? callback(null, true) : callback(new Error("Not allowed by CORS"));
      }
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
    methods: ["GET", "HEAD", "PUT", "PATCH", "POST", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-CSRF-Token", "X-XSRF-Token"],
    exposedHeaders: ["X-RateLimit-Limit", "X-RateLimit-Remaining", "X-RateLimit-Reset"],
  });
  app.use(
    helmet({
      contentSecurityPolicy: false,
      crossOriginEmbedderPolicy: false,
      crossOriginResourcePolicy: { policy: "cross-origin" },
      hsts: isProd
        ? {
            maxAge: 15552000,
            includeSubDomains: true,
            preload: false,
          }
        : false,
    }),
  );
  app.use(cookieParser());
  app.use(csrfMiddleware);
  app.useGlobalPipes(
    new TrimPipe(),
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
