import { expect, test } from '@playwright/test';
import {
  closeAuthedContext,
  createProduct,
  createPurchase,
  createSale,
  registerAndCompleteOnboarding,
  subscribeToPlan,
} from './support/app';

const today = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

test.describe('broader report propagation browser flows', () => {
  test('sales and purchases propagate into equity, HPP, and notes financial pages', async ({ page }) => {
    const authed = await registerAndCompleteOnboarding(page);
    await subscribeToPlan(authed.page, 'business');

    const productName = `Report Product ${Date.now()}`;
    const product = await createProduct(authed.page, {
      name: productName,
      code: `RP${Date.now().toString().slice(-4)}`,
      type: 'barang',
      unit: 'pcs',
      price: 10000,
      buyPrice: 6000,
      stock: 0,
    });

    const date = today();

    await createPurchase(authed.page, {
      date,
      itemName: productName,
      productId: product.id,
      productCode: product.code ?? undefined,
      supplier: 'PT Report Supplier',
      quantity: 10,
      unitCost: 6000,
      notes: 'Purchase for report propagation',
    });

    await createSale(authed.page, {
      soldAt: date,
      productId: product.id,
      productCode: product.code ?? undefined,
      quantity: 2,
      pricePerUnit: 10000,
    });

    await authed.page.goto('/ekuitas');
    await expect(
      authed.page.getByRole('heading', { name: /Laporan Perubahan Ekuitas/i }),
    ).toBeVisible();
    await expect(
      authed.page.locator('div').filter({ hasText: /Ringkasan Pendapatan/ }).filter({ hasText: /20\.000/ }).first(),
    ).toBeVisible();
    await expect(
      authed.page.locator('div').filter({ hasText: /Ringkasan Beban/ }).filter({ hasText: /60\.000/ }).first(),
    ).toBeVisible();
    await expect(
      authed.page.locator('div').filter({ hasText: /Tambah: Laba Bersih Periode Ini/ }).filter({ hasText: /40\.000/ }).first(),
    ).toBeVisible();

    await authed.page.goto('/hpp');
    await expect(
      authed.page.getByRole('heading', { name: /Harga Pokok Penjualan/i }),
    ).toBeVisible();
    const productRow = authed.page.getByRole('row').filter({ hasText: productName });
    await expect(productRow).toBeVisible();
    await expect(productRow.getByText('2', { exact: true })).toBeVisible();
    await expect(productRow.getByText(/20\.000/)).toBeVisible();

    await authed.page.goto('/catatan-keuangan');
    await expect(
      authed.page.getByRole('heading', { name: /Catatan atas Laporan Keuangan/i }),
    ).toBeVisible();
    await expect(
      authed.page.locator('div').filter({ hasText: /Total Penjualan/ }).filter({ hasText: /20\.000/ }).first(),
    ).toBeVisible();
    await expect(
      authed.page.locator('div').filter({ hasText: /Total Pembelian/ }).filter({ hasText: /60\.000/ }).first(),
    ).toBeVisible();

    await closeAuthedContext(authed.context);
  });
});
