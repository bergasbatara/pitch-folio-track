import { expect, test } from '@playwright/test';
import { closeAuthedContext, registerAndCompleteOnboarding, subscribeToPlan } from './support/app';

async function createProductViaUi() {
  return {
    code: `PW-${Date.now().toString().slice(-6)}`,
    name: `Playwright Product ${Date.now().toString().slice(-4)}`,
  };
}

test.describe('commerce browser flows', () => {
  test('business user can create a product and record a sale', async ({ page }) => {
    const authed = await registerAndCompleteOnboarding(page);
    await subscribeToPlan(authed.page, 'business');

    const product = await createProductViaUi();

    await authed.page.goto('/products');
    await authed.page.getByRole('button', { name: /Tambah Produk/i }).first().click();
    const productDialog = authed.page.getByRole('dialog', { name: /Tambah Produk/i });
    await productDialog.getByLabel(/Kode Produk/i).fill(product.code);
    await productDialog.getByLabel(/Nama Produk/i).fill(product.name);
    await productDialog.getByLabel(/Harga Beli/i).fill('12000');
    await productDialog.getByLabel(/Harga Jual/i).fill('18000');
    await productDialog.getByLabel(/Stok Awal/i).fill('25');
    await productDialog.getByRole('button', { name: /^Tambah Produk$/i }).click();

    await expect(authed.page.getByText(product.name)).toBeVisible();

    await authed.page.goto('/sales');
    await authed.page.getByRole('button', { name: /Catat Penjualan/i }).first().click();
    const saleDialog = authed.page.getByRole('dialog', { name: /Catat Penjualan Baru/i });
    await saleDialog.getByLabel(/Kode Produk/i).fill(product.code);
    await saleDialog.getByLabel(/Jumlah Terjual/i).fill('3');
    await saleDialog.getByRole('button', { name: /^Catat Penjualan$/i }).click();

    const saleRow = authed.page.getByRole('row').filter({ hasText: product.name });
    await expect(saleRow).toBeVisible();
    await expect(saleRow.getByRole('cell', { name: /Rp54\.000/i })).toBeVisible();

    await closeAuthedContext(authed.context);
  });

  test('business user can create a purchase and see it in the purchases table', async ({ page }) => {
    const authed = await registerAndCompleteOnboarding(page);
    await subscribeToPlan(authed.page, 'business');

    const itemName = `Playwright Purchase ${Date.now().toString().slice(-4)}`;

    await authed.page.goto('/purchases');
    await authed.page.getByRole('button', { name: /Tambah Pembelian/i }).first().click();
    const purchaseDialog = authed.page.getByRole('dialog', { name: /Tambah Pembelian/i });
    await purchaseDialog.getByLabel(/Nama Barang/i).fill(itemName);
    await purchaseDialog.getByLabel(/Pemasok/i).fill('PT Playwright Supplier');
    await purchaseDialog.getByLabel(/^Jumlah$/i).fill('10');
    await purchaseDialog.getByLabel(/Harga Satuan/i).fill('15000');
    await purchaseDialog.getByRole('button', { name: /^Tambah Pembelian$/i }).click();

    const purchaseRow = authed.page.getByRole('row').filter({ hasText: itemName });
    await expect(purchaseRow).toBeVisible();
    await expect(purchaseRow.getByRole('cell', { name: /PT Playwright Supplier/i })).toBeVisible();
    await expect(purchaseRow).toContainText(/150\.000/);

    await closeAuthedContext(authed.context);
  });
});
