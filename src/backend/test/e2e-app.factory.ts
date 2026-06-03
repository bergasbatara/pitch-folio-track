import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import cookieParser from 'cookie-parser';
import { json, urlencoded } from 'express';
import { AppModule } from '../src/app.module';
import { AuthService } from '../src/auth/auth.service';
import { CompaniesService } from '../src/companies/companies.service';
import { SubscriptionsService } from '../src/subscriptions/subscriptions.service';
import { PaymentsService } from '../src/payments/payments.service';
import { AuditService } from '../src/audit/audit.service';
import { ProductsService } from '../src/products/products.service';
import { PrismaService } from '../src/prisma/prisma.service';
import { csrfMiddleware } from '../src/common/middleware/csrf.middleware';
import { TrimPipe } from '../src/common/pipes/trim.pipe';

export interface E2EState {
  userId: string;
  email: string;
  name: string;
  companyId: string;
  companyName: string;
  subscriptionPlanId: 'business' | 'professional' | 'premium';
  subscriptionStatus: 'active' | 'cancelled' | 'expired';
  subscriptionEndsAt: Date | null;
  auditLogs: Array<Record<string, unknown>>;
}

export const createDefaultState = (): E2EState => ({
  userId: 'user-1',
  email: 'user@test.com',
  name: 'Test User',
  companyId: 'company-1',
  companyName: 'Acme Financial',
  subscriptionPlanId: 'professional',
  subscriptionStatus: 'active',
  subscriptionEndsAt: new Date('2099-01-01T00:00:00.000Z'),
  auditLogs: [{ id: 'audit-1', action: 'POST /companies/company-1/products' }],
});

const ensureEnv = () => {
  process.env.NODE_ENV = 'test';
  process.env.FRONTEND_URL ??= 'http://localhost:8080';
  process.env.JWT_ACCESS_SECRET ??= 'test_access_secret_that_is_long_enough_123';
  process.env.JWT_REFRESH_SECRET ??= 'test_refresh_secret_that_is_long_enough_123';
  process.env.JWT_ACCESS_TTL ??= '15m';
  process.env.JWT_REFRESH_TTL ??= '7d';
  process.env.CSRF_ENABLED ??= 'true';
};

const buildSubscriptionResponse = (state: E2EState) => ({
  id: 'subscription-1',
  companyId: state.companyId,
  planId: state.subscriptionPlanId,
  status: state.subscriptionStatus,
  startsAt: '2026-01-01T00:00:00.000Z',
  endsAt: state.subscriptionEndsAt?.toISOString() ?? null,
});

export async function createE2EApp(state: E2EState): Promise<{
  app: INestApplication;
  mocks: {
    authService: Record<string, jest.Mock>;
    companiesService: Record<string, jest.Mock>;
    subscriptionsService: Record<string, jest.Mock>;
    paymentsService: Record<string, jest.Mock>;
    auditService: Record<string, jest.Mock>;
    productsService: Record<string, jest.Mock>;
    prismaService: { subscription: { findUnique: jest.Mock } };
  };
}> {
  ensureEnv();

  let jwtService: JwtService;

  const authService = {
    register: jest.fn(async (dto: { email: string; name: string }) => {
      const accessToken = await jwtService.signAsync({ sub: state.userId, email: dto.email });
      const refreshToken = await jwtService.signAsync(
        { sub: state.userId, email: dto.email, jti: 'refresh-jti-register' },
        { secret: process.env.JWT_REFRESH_SECRET },
      );
      return {
        user: { id: state.userId, email: dto.email, name: dto.name },
        accessToken,
        refreshToken,
      };
    }),
    login: jest.fn(async (dto: { email: string }) => {
      const accessToken = await jwtService.signAsync({ sub: state.userId, email: dto.email });
      const refreshToken = await jwtService.signAsync(
        { sub: state.userId, email: dto.email, jti: 'refresh-jti-login' },
        { secret: process.env.JWT_REFRESH_SECRET },
      );
      return {
        user: { id: state.userId, email: dto.email, name: state.name },
        accessToken,
        refreshToken,
      };
    }),
    refresh: jest.fn(async () => ({
      accessToken: await jwtService.signAsync({ sub: state.userId, email: state.email }),
      refreshToken: await jwtService.signAsync(
        { sub: state.userId, email: state.email, jti: 'refresh-jti-refresh' },
        { secret: process.env.JWT_REFRESH_SECRET },
      ),
    })),
    logout: jest.fn(async () => ({ success: true })),
    me: jest.fn(async () => ({ id: state.userId, email: state.email, name: state.name })),
    updateProfile: jest.fn(),
    changePassword: jest.fn(),
  };

  const companiesService = {
    createCompany: jest.fn(),
    listCompanies: jest.fn(async () => [
      { id: state.companyId, name: state.companyName, members: [{ userId: state.userId }] },
    ]),
    getCurrentCompany: jest.fn(async () => ({ id: state.companyId, name: state.companyName })),
    getCompany: jest.fn(async () => ({ id: state.companyId, name: state.companyName })),
    updateCompany: jest.fn(),
    listMembers: jest.fn(),
    addMember: jest.fn(),
    removeMember: jest.fn(),
  };

  const subscriptionsService = {
    getCurrent: jest.fn(async () => buildSubscriptionResponse(state)),
    subscribe: jest.fn(async (_userId: string, _companyId: string, dto: { planId: E2EState['subscriptionPlanId'] }) => {
      state.subscriptionPlanId = dto.planId;
      state.subscriptionStatus = 'active';
      state.subscriptionEndsAt = new Date('2099-02-01T00:00:00.000Z');
      return buildSubscriptionResponse(state);
    }),
    update: jest.fn(async () => buildSubscriptionResponse(state)),
  };

  const paymentsService = {
    chargeCard: jest.fn(),
    chargeQris: jest.fn(async (_userId: string, _companyId: string, dto: { orderId: string; grossAmount: number }) => ({
      statusCode: '201',
      transactionStatus: 'pending',
      orderId: dto.orderId,
      qrString: 'qris-payload',
      grossAmount: dto.grossAmount,
    })),
    chargeGopay: jest.fn(),
    getPaymentStatus: jest.fn(async () => ({ transactionStatus: 'settlement' })),
  };

  const auditService = {
    log: jest.fn(async () => undefined),
    listLogs: jest.fn(async () => state.auditLogs),
  };

  const productsService = {
    listProducts: jest.fn(async () => []),
    getProduct: jest.fn(),
    createProduct: jest.fn(async (_userId: string, _companyId: string, dto: Record<string, unknown>) => ({
      id: 'product-1',
      ...dto,
    })),
    updateProduct: jest.fn(),
    deleteProduct: jest.fn(),
  };

  const prismaService = {
    subscription: {
      findUnique: jest.fn(async () => ({
        status: state.subscriptionStatus,
        endsAt: state.subscriptionEndsAt,
        planId: state.subscriptionPlanId,
      })),
    },
  };

  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  })
    .overrideProvider(AuthService)
    .useValue(authService)
    .overrideProvider(CompaniesService)
    .useValue(companiesService)
    .overrideProvider(SubscriptionsService)
    .useValue(subscriptionsService)
    .overrideProvider(PaymentsService)
    .useValue(paymentsService)
    .overrideProvider(AuditService)
    .useValue(auditService)
    .overrideProvider(ProductsService)
    .useValue(productsService)
    .overrideProvider(PrismaService)
    .useValue(prismaService)
    .compile();

  jwtService = moduleFixture.get(JwtService);

  const app = moduleFixture.createNestApplication();
  app.use(json({ limit: '1mb' }));
  app.use(urlencoded({ extended: true, limit: '1mb' }));
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
  await app.init();

  return {
    app,
    mocks: {
      authService,
      companiesService,
      subscriptionsService,
      paymentsService,
      auditService,
      productsService,
      prismaService,
    },
  };
}
