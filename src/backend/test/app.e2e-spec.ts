import request from 'supertest';
import type { INestApplication } from '@nestjs/common';
import { createDefaultState, createE2EApp } from './e2e-app.factory';

describe('AppController (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const testApp = await createE2EApp(createDefaultState());
    app = testApp.app;
  });

  afterEach(async () => {
    await app?.close();
  });

  it('/ (GET)', () => {
    return request(app.getHttpAdapter().getInstance())
      .get('/')
      .expect(200)
      .expect('Hello World!');
  });
});
