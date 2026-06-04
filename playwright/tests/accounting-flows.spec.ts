import { expect, test } from '@playwright/test';
import { closeAuthedContext, registerAndCompleteOnboarding, subscribeToPlan } from './support/app';

test.describe('auth and accounting browser flows', () => {
  test('user can log out and log back in with the same account', async ({ page }) => {
    const authed = await registerAndCompleteOnboarding(page);
    const { email, password } = authed;

    await authed.page.getByRole('button', { name: /Keluar/i }).click();
    await expect(authed.page).toHaveURL(/\/login$/);

    await authed.page.getByLabel(/^Email$/i).fill(email);
    await authed.page.getByLabel(/^Password$/i).fill(password);
    await authed.page.getByRole('button', { name: /^Masuk$/i }).click();

    await expect(authed.page).toHaveURL(/\/$/);
    await expect(authed.page.getByRole('link', { name: /Dasbor/i })).toBeVisible();

    await authed.page.reload();
    await expect(authed.page.getByRole('link', { name: /Dasbor/i })).toBeVisible();

    await closeAuthedContext(authed.context);
  });

  test('business user can add an opening balance item and a balanced journal entry', async ({ page }) => {
    const authed = await registerAndCompleteOnboarding(page);
    await subscribeToPlan(authed.page, 'business');

    const openingMemo = `Playwright Opening ${Date.now().toString().slice(-4)}`;
    const journalMemo = `Playwright Jurnal ${Date.now().toString().slice(-4)}`;

    await authed.page.goto('/liabilitas-ekuitas');
    await authed.page.getByRole('button', { name: /^Tambah$/i }).first().click();
    const openingDialog = authed.page.getByRole('dialog', { name: /Tambah Liabilitas \/ Ekuitas/i });
    await openingDialog.getByRole('combobox').first().click();
    await authed.page.getByRole('option', { name: /Liabilitas/i }).click();
    await openingDialog.getByRole('combobox').nth(1).click();
    await authed.page.getByRole('option', { name: /2001 - Hutang Usaha/i }).click();
    await openingDialog.getByRole('textbox').nth(1).fill('90000000');
    await openingDialog.getByRole('textbox', { name: 'Opsional' }).fill(openingMemo);
    await openingDialog.getByRole('button', { name: /^Tambah$/i }).click();

    const openingRow = authed.page.getByRole('row').filter({ hasText: openingMemo });
    await expect(openingRow).toBeVisible();
    await expect(openingRow).toContainText(/90\.000\.000/);

    await authed.page.goto('/jurnal');
    await authed.page.getByRole('button', { name: /Tambah Jurnal/i }).click();
    const journalDialog = authed.page.getByRole('dialog', { name: /Tambah Jurnal/i });
    await journalDialog.getByPlaceholder(/Catatan \(opsional\)/i).fill(journalMemo);

    const comboboxes = journalDialog.getByRole('combobox');
    await comboboxes.nth(0).click();
    await authed.page.getByRole('option', { name: /1001 - Kas/i }).click();
    await journalDialog.getByPlaceholder('0').nth(0).fill('100000');

    await comboboxes.nth(1).click();
    await authed.page.getByRole('option', { name: /3001 - Modal/i }).click();
    await journalDialog.getByPlaceholder('0').nth(3).fill('100000');

    await journalDialog.getByRole('button', { name: /^Simpan$/i }).click();

    const journalRow = authed.page.getByRole('row').filter({ hasText: journalMemo });
    await expect(journalRow).toBeVisible();
    await expect(journalRow).toContainText(/100\.000/);

    await closeAuthedContext(authed.context);
  });
});
