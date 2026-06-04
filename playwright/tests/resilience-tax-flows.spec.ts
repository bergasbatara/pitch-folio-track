import { expect, test } from '@playwright/test';
import {
  closeAuthedContext,
  forceLogoutCurrentSession,
  registerAndCompleteOnboarding,
  subscribeToPlan,
} from './support/app';

test.describe('session resilience and tax browser flows', () => {
  test('forced backend logout redirects the user back to login on reload', async ({ page }) => {
    const authed = await registerAndCompleteOnboarding(page);

    await authed.page.goto('/profile');
    await expect(authed.page.getByRole('heading', { name: /Profil Pengguna/i })).toBeVisible();

    await forceLogoutCurrentSession(authed.page);
    await authed.page.reload();

    await expect(authed.page).toHaveURL(/\/login$/);
    await expect(authed.page.getByRole('heading', { name: /Selamat Datang/i })).toBeVisible();
    await closeAuthedContext(authed.context);
  });

  test('business user can post a tax settlement and see it in journals and cash flow', async ({ page }) => {
    const authed = await registerAndCompleteOnboarding(page);
    await subscribeToPlan(authed.page, 'business');

    await authed.page.goto('/pajak');
    await expect(authed.page.getByRole('heading', { name: /^Pajak$/i })).toBeVisible();

    await authed.page.getByPlaceholder('500000').fill('500000');
    await authed.page.getByRole('combobox').click();
    await authed.page.getByRole('option', { name: /PPN - PPN/i }).click();
    await authed.page.getByPlaceholder('Pembayaran PPN Februari').fill('Pembayaran pajak Playwright');
    const settlementResponsePromise = authed.page.waitForResponse((response) =>
      response.url().includes('/taxes/settlement') && response.request().method() === 'POST',
    );
    await authed.page.getByRole('button', { name: /Posting Jurnal Pajak/i }).click();
    const settlementResponse = await settlementResponsePromise;
    expect(settlementResponse.ok()).toBeTruthy();

    await authed.page.goto('/jurnal');
    await expect(authed.page.getByRole('heading', { name: /^Jurnal Umum$/i })).toBeVisible();
    await expect(authed.page.getByText(/Pembayaran pajak Playwright/i)).toBeVisible();
    await expect(authed.page.getByText(/tax_settlement/i)).toBeVisible();

    await authed.page.goto('/arus-kas');
    await expect(authed.page.getByRole('heading', { name: /Laporan Arus Kas/i })).toBeVisible();
    await expect(
      authed.page.locator('div').filter({ hasText: /Perubahan Kas/ }).filter({ hasText: /500\.000/ }).first(),
    ).toBeVisible();

    await closeAuthedContext(authed.context);
  });
});
