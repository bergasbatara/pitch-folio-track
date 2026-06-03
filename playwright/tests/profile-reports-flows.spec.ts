import { expect, test } from '@playwright/test';
import { closeAuthedContext, registerAndCompleteOnboarding, subscribeToPlan } from './support/app';

test.describe('profile, settings, and reports browser flows', () => {
  test('user can update profile information and keep it after reload', async ({ page }) => {
    const authed = await registerAndCompleteOnboarding(page);
    const updatedName = `PW User ${Date.now().toString().slice(-4)}`;
    const updatedCompany = `PW Company ${Date.now().toString().slice(-4)}`;
    const updatedPhone = '08111111111';
    const updatedAddress = '456 Updated Street';
    const updatedTaxId = '01.234.567.8-901.000';

    await authed.page.goto('/profile');
    await authed.page.locator('#name').fill(updatedName);
    await authed.page.locator('#companyName').fill(updatedCompany);
    await authed.page.locator('#phone').fill(updatedPhone);
    await authed.page.locator('#address').fill(updatedAddress);
    await authed.page.locator('#taxId').fill(updatedTaxId);
    await authed.page.getByRole('button', { name: /Simpan Perubahan/i }).click();

    await expect(authed.page.locator('#name')).toHaveValue(updatedName);
    await expect(authed.page.locator('#companyName')).toHaveValue(updatedCompany);
    await expect(authed.page.locator('#phone')).toHaveValue(updatedPhone);
    await expect(authed.page.locator('#address')).toHaveValue(updatedAddress);
    await expect(authed.page.locator('#taxId')).toHaveValue(updatedTaxId);

    await authed.page.reload();

    await expect(authed.page.locator('#name')).toHaveValue(updatedName);
    await expect(authed.page.locator('#companyName')).toHaveValue(updatedCompany);
    await expect(authed.page.locator('#phone')).toHaveValue(updatedPhone);
    await expect(authed.page.locator('#address')).toHaveValue(updatedAddress);
    await expect(authed.page.locator('#taxId')).toHaveValue(updatedTaxId);

    await authed.page.goto('/settings');
    await expect(authed.page.getByRole('heading', { name: /Security Check/i })).toBeVisible();
    await expect(authed.page.getByText(/CSRF Token/i)).toBeVisible();

    await closeAuthedContext(authed.context);
  });

  test('business user sees journal data reflected in laba rugi and neraca', async ({ page }) => {
    const authed = await registerAndCompleteOnboarding(page);
    await subscribeToPlan(authed.page, 'business');
    const revenueMemo = `PW Revenue ${Date.now().toString().slice(-4)}`;
    const capitalMemo = `PW Capital ${Date.now().toString().slice(-4)}`;

    await authed.page.goto('/jurnal');
    await authed.page.getByRole('button', { name: /Tambah Jurnal/i }).click();

    let journalDialog = authed.page.getByRole('dialog', { name: /Tambah Jurnal/i });
    await journalDialog.getByPlaceholder(/Catatan \(opsional\)/i).fill(revenueMemo);
    let comboboxes = journalDialog.getByRole('combobox');
    await comboboxes.nth(0).click();
    await authed.page.getByRole('option', { name: /1001 - Kas/i }).click();
    await journalDialog.getByPlaceholder('0').nth(0).fill('250000');
    await comboboxes.nth(1).click();
    await authed.page.getByRole('option', { name: /4001 - Penjualan/i }).click();
    await journalDialog.getByPlaceholder('0').nth(3).fill('250000');
    await journalDialog.getByRole('button', { name: /^Simpan$/i }).click();
    await expect(authed.page.getByRole('row').filter({ hasText: revenueMemo })).toBeVisible();

    await authed.page.getByRole('button', { name: /Tambah Jurnal/i }).click();
    journalDialog = authed.page.getByRole('dialog', { name: /Tambah Jurnal/i });
    await journalDialog.getByPlaceholder(/Catatan \(opsional\)/i).fill(capitalMemo);
    comboboxes = journalDialog.getByRole('combobox');
    await comboboxes.nth(0).click();
    await authed.page.getByRole('option', { name: /1001 - Kas/i }).click();
    await journalDialog.getByPlaceholder('0').nth(0).fill('100000');
    await comboboxes.nth(1).click();
    await authed.page.getByRole('option', { name: /3001 - Modal/i }).click();
    await journalDialog.getByPlaceholder('0').nth(3).fill('100000');
    await journalDialog.getByRole('button', { name: /^Simpan$/i }).click();
    await expect(authed.page.getByRole('row').filter({ hasText: capitalMemo })).toBeVisible();

    await authed.page.goto('/laba-rugi');
    await expect(authed.page.getByText(/Laba Rugi Harian/i)).toBeVisible();
    const revenueCard = authed.page.locator('[class*="grid"] > div').filter({
      has: authed.page.getByText(/^Pendapatan$/i),
    }).first();
    await expect(revenueCard).toContainText(/4001 - Penjualan/i);
    await expect(revenueCard).toContainText(/Rp 250\.000/i);

    await authed.page.goto('/neraca');
    await expect(authed.page.getByRole('heading', { name: /Neraca/i })).toBeVisible();
    const assetsCard = authed.page.locator('[class*="grid"] > div').filter({
      has: authed.page.getByText(/^ASET$/i),
    }).first();
    const equityCard = authed.page.locator('[class*="grid"] > div').filter({
      has: authed.page.getByText(/^KEWAJIBAN & EKUITAS$/i),
    }).first();
    await expect(assetsCard).toContainText(/Kas/i);
    await expect(assetsCard).toContainText(/Rp\s*350\.000/i);
    await expect(assetsCard).toContainText(/Total Aset/i);
    await expect(equityCard).toContainText(/Modal Pemilik/i);
    await expect(equityCard).toContainText(/Rp\s*100\.000/i);
    await expect(equityCard).toContainText(/Saldo Laba/i);
    await expect(equityCard).toContainText(/Total Kewajiban & Ekuitas/i);
    await expect(equityCard).toContainText(/Rp\s*350\.000/i);

    await closeAuthedContext(authed.context);
  });
});
