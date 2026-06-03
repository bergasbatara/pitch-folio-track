import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createDefaultState, createE2EApp, type E2EState } from './e2e-app.factory';

const getCsrfToken = (cookies: string[]): string => {
  const csrfCookie = cookies.find((cookie) => cookie.startsWith('csrf_token='));
  if (!csrfCookie) {
    throw new Error('Missing csrf_token cookie');
  }
  return decodeURIComponent(csrfCookie.split(';')[0].split('=').slice(1).join('='));
};

const toCookieHeader = (cookies: string[]): string =>
  cookies.map((cookie) => cookie.split(';')[0]).join('; ');

describe('User flows (e2e)', () => {
  let app: INestApplication;
  let state: E2EState;

  beforeEach(async () => {
    state = createDefaultState();
    const testApp = await createE2EApp(state);
    app = testApp.app;
  });

  afterEach(async () => {
    await app?.close();
  });

  it('logs in, persists cookies, and loads the current user/company', async () => {
    const client = request(app.getHttpAdapter().getInstance());

    const loginResponse = await client
      .post('/auth/login')
      .send({ email: 'user@test.com', password: 'Password123!' })
      .expect(201);

    expect(loginResponse.body.user.email).toBe('user@test.com');
    expect(loginResponse.headers['set-cookie']).toEqual(
      expect.arrayContaining([
        expect.stringContaining('access_token='),
        expect.stringContaining('refresh_token='),
        expect.stringContaining('csrf_token='),
      ]),
    );
    const cookieHeader = toCookieHeader(loginResponse.headers['set-cookie']);

    const meResponse = await client.get('/auth/me').set('Cookie', cookieHeader).expect(200);
    expect(meResponse.body).toEqual(
      expect.objectContaining({ email: 'user@test.com', name: 'Test User' }),
    );

    const companyResponse = await client
      .get('/companies/current')
      .set('Cookie', cookieHeader)
      .expect(200);
    expect(companyResponse.body).toEqual(
      expect.objectContaining({ id: state.companyId, name: state.companyName }),
    );
  });

  it('rejects protected product creation without a matching CSRF token', async () => {
    const client = request(app.getHttpAdapter().getInstance());

    const loginResponse = await client
      .post('/auth/login')
      .send({ email: 'user@test.com', password: 'Password123!' })
      .expect(201);
    const cookieHeader = toCookieHeader(loginResponse.headers['set-cookie']);

    const response = await client
      .post(`/companies/${state.companyId}/products`)
      .set('Cookie', cookieHeader)
      .send({ name: 'Vitamin C', price: 10000, stock: 10 })
      .expect(403);

    expect(response.body.message).toBe('Invalid CSRF token');
  });

  it('allows a QRIS renewal charge when auth, plan, and CSRF are valid', async () => {
    const client = request(app.getHttpAdapter().getInstance());

    const loginResponse = await client
      .post('/auth/login')
      .send({ email: 'user@test.com', password: 'Password123!' })
      .expect(201);
    const cookieHeader = toCookieHeader(loginResponse.headers['set-cookie']);
    const csrfToken = getCsrfToken(loginResponse.headers['set-cookie']);

    const response = await client
      .post(`/companies/${state.companyId}/payments/charge/qris`)
      .set('Cookie', cookieHeader)
      .set('x-csrf-token', csrfToken)
      .send({ orderId: 'SUB-company-1-professional-1', grossAmount: 499000, planId: 'professional' })
      .expect(201);

    expect(response.body).toEqual(
      expect.objectContaining({
        statusCode: '201',
        transactionStatus: 'pending',
        orderId: 'SUB-company-1-professional-1',
      }),
    );
  });

  it('enforces the professional plan requirement for audit logs', async () => {
    const client = request(app.getHttpAdapter().getInstance());

    const loginResponse = await client
      .post('/auth/login')
      .send({ email: 'user@test.com', password: 'Password123!' })
      .expect(201);
    const cookieHeader = toCookieHeader(loginResponse.headers['set-cookie']);

    await client
      .get(`/companies/${state.companyId}/audit-logs?limit=5`)
      .set('Cookie', cookieHeader)
      .expect(200);

    state.subscriptionPlanId = 'business';
    const deniedResponse = await client
      .get(`/companies/${state.companyId}/audit-logs?limit=5`)
      .set('Cookie', cookieHeader)
      .expect(403);
    expect(deniedResponse.body.message).toContain('Plan required: professional');
  });
});
