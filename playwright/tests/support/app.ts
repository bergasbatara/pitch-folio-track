import { expect, type BrowserContext, type Page } from '@playwright/test';

export const API_URL = 'http://localhost:3000';

const uniqueEmail = () => `pw-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@test.com`;

export async function registerAndCompleteOnboarding(page: Page) {
  const email = uniqueEmail();
  const password = 'Password123!';

  const response = await page.context().request.post(`${API_URL}/auth/register`, {
    data: {
      email,
      password,
      name: 'Playwright User',
    },
  });
  expect(response.ok(), await response.text()).toBeTruthy();

  const browser = page.context().browser();
  if (!browser) {
    throw new Error('Expected a browser-backed Playwright context');
  }

  const storageState = await page.context().request.storageState();
  const context = await browser.newContext({ storageState });
  const authedPage = await context.newPage();
  const meResponse = await context.request.get(`${API_URL}/auth/me`);
  expect(meResponse.ok(), await meResponse.text()).toBeTruthy();

  await authedPage.goto('/onboarding/welcome');
  await expect(authedPage).toHaveURL(/\/onboarding\/welcome$/);
  await authedPage.getByRole('button', { name: /Atur Profil Perusahaan/i }).click();
  await expect(authedPage).toHaveURL(/\/onboarding\/company-setup$/);

  await authedPage.getByLabel(/Nama Perusahaan/i).fill('Playwright Test Company');
  await authedPage.getByLabel(/Alamat Bisnis/i).fill('123 Test Street');
  await authedPage.getByLabel(/Nomor Telepon/i).fill('08123456789');
  await authedPage.getByLabel(/Email Bisnis/i).fill(email);
  await authedPage.getByRole('button', { name: /Selesaikan Pengaturan/i }).click();

  await expect(authedPage).toHaveURL(/\/$/);

  return { email, password, page: authedPage, context };
}

export async function subscribeToPlan(
  page: Page,
  planId: 'business' | 'professional' | 'premium',
) {
  const csrfResponse = await page.context().request.get(`${API_URL}/auth/csrf`);
  expect(csrfResponse.ok(), await csrfResponse.text()).toBeTruthy();

  const companyResponse = await page.context().request.get(`${API_URL}/companies/current`);
  expect(companyResponse.ok(), await companyResponse.text()).toBeTruthy();
  const company = (await companyResponse.json()) as { id: string };

  const cookies = await page.context().cookies(API_URL);
  const csrfToken = cookies.find((cookie) => cookie.name === 'csrf_token')?.value;

  const response = await page.context().request.post(
    `${API_URL}/companies/${company.id}/subscription`,
    {
      data: { planId },
      headers: csrfToken ? { 'x-csrf-token': csrfToken } : undefined,
    },
  );

  expect(response.ok(), await response.text()).toBeTruthy();
}

export async function closeAuthedContext(context: BrowserContext) {
  await context.close();
}
