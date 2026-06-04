import { expect, test } from '@playwright/test';
import {
  closeAuthedContext,
  createAdditionalCompany,
  createProduct,
  createProductForCompany,
  getCurrentCompany,
  registerAndCompleteOnboarding,
  subscribeCompanyToPlan,
  subscribeToPlan,
} from './support/app';

test.describe('multi-company browser flows', () => {
  test('current company stays pinned to the first membership for plan gating and data', async ({ page }) => {
    const authed = await registerAndCompleteOnboarding(page);

    const primaryCompany = await getCurrentCompany(authed.page);
    await subscribeToPlan(authed.page, 'business');
    await createProduct(authed.page, {
      name: 'Primary Company Product',
      code: 'PRI001',
      type: 'barang',
      unit: 'pcs',
      price: 12000,
      buyPrice: 7000,
      stock: 5,
    });

    const secondaryCompany = await createAdditionalCompany(authed.page, {
      name: 'Playwright Second Company',
      address: '456 Second Street',
      phone: '08111111111',
      email: 'second@test.com',
      taxId: 'SECOND-NPWP',
      currency: 'IDR',
    });
    await subscribeCompanyToPlan(authed.page, secondaryCompany.id, 'professional');
    await createProductForCompany(authed.page, secondaryCompany.id, {
      name: 'Second Company Product',
      code: 'SEC001',
      type: 'barang',
      unit: 'pcs',
      price: 25000,
      buyPrice: 15000,
      stock: 8,
    });

    const stillCurrent = await getCurrentCompany(authed.page);
    expect(stillCurrent.id).toBe(primaryCompany.id);

    await authed.page.goto('/audit-draft');
    await expect(authed.page.getByRole('heading', { name: /Halaman Terkunci/i })).toBeVisible();

    await authed.page.goto('/profile');
    await expect(authed.page.getByLabel(/Nama Perusahaan/i)).toHaveValue('Playwright Test Company');
    await expect(authed.page.getByLabel(/Alamat/i)).toHaveValue('123 Test Street');

    await authed.page.goto('/products');
    await expect(authed.page.getByRole('heading', { name: /^Produk$/i })).toBeVisible();
    await expect(authed.page.getByText('Primary Company Product')).toBeVisible();
    await expect(authed.page.getByText('Second Company Product')).toHaveCount(0);

    await closeAuthedContext(authed.context);
  });
});
