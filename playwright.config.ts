import { defineConfig, devices } from '@playwright/test';

const FRONTEND_PORT = 8080;
const API_PORT = 3000;
const FRONTEND_URL = `http://localhost:${FRONTEND_PORT}`;
const API_URL = `http://localhost:${API_PORT}`;

export default defineConfig({
  testDir: './playwright/tests',
  timeout: 60_000,
  expect: {
    timeout: 10_000,
  },
  fullyParallel: false,
  retries: 0,
  reporter: 'list',
  use: {
    baseURL: FRONTEND_URL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  webServer: [
    {
      command: 'npm run start',
      cwd: 'src/backend',
      url: `${API_URL}/auth/csrf`,
      timeout: 120_000,
      reuseExistingServer: true,
      env: {
        ...process.env,
        PORT: String(API_PORT),
        FRONTEND_URL,
      },
    },
    {
      command: `npm run dev -- --host localhost --port ${FRONTEND_PORT}`,
      cwd: '.',
      url: `${FRONTEND_URL}/login`,
      timeout: 120_000,
      reuseExistingServer: true,
      env: {
        ...process.env,
        VITE_API_URL: API_URL,
      },
    },
  ],
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
