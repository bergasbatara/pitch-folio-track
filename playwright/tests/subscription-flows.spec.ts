import { expect, test } from '@playwright/test';
import { closeAuthedContext, registerAndCompleteOnboarding, subscribeToPlan } from './support/app';

test.describe('subscription and plan browser flows', () => {
  test('new user can register, complete onboarding, and access the subscription page', async ({ page }) => {
    const authed = await registerAndCompleteOnboarding(page);

    await authed.page.goto('/langganan');

    await expect(authed.page.getByRole('heading', { name: /Pilih Paket Langganan/i })).toBeVisible();
    await expect(authed.page.getByRole('heading', { name: /^Business$/i })).toBeVisible();
    await expect(authed.page.getByRole('heading', { name: /^Professional$/i })).toBeVisible();
    await closeAuthedContext(authed.context);
  });

  test('professional-only route is locked on business and opens after upgrade', async ({ page }) => {
    const authed = await registerAndCompleteOnboarding(page);
    await subscribeToPlan(authed.page, 'business');

    await authed.page.goto('/audit-draft');
    await expect(authed.page.getByRole('heading', { name: /Halaman Terkunci/i })).toBeVisible();

    await subscribeToPlan(authed.page, 'professional');
    await authed.page.goto('/audit-draft');

    await expect(
      authed.page.getByRole('heading', { name: /Drafting Laporan Keuangan untuk Audit/i }),
    ).toBeVisible();
    await closeAuthedContext(authed.context);
  });

  test('active professional subscription can start the renewal flow from the subscription page', async ({ page }) => {
    const authed = await registerAndCompleteOnboarding(page);
    await subscribeToPlan(authed.page, 'professional');

    await authed.page.goto('/langganan');

    await expect(authed.page.getByText(/Anda saat ini berlangganan paket/i)).toBeVisible();
    await authed.page.getByRole('button', { name: /Perpanjang Paket$/i }).click();

    await expect(authed.page).toHaveURL(/\/pembayaran\?plan=professional$/);
    await expect(
      authed.page.getByRole('heading', { name: /^Pembayaran$/i }),
    ).toBeVisible();
    await expect(authed.page.getByText('Professional')).toBeVisible();
    await closeAuthedContext(authed.context);
  });
});
