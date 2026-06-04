import { expect, test } from '@playwright/test';
import {
  API_URL,
  closeAuthedContext,
  createJournalEntryByCode,
  registerAndCompleteOnboarding,
  subscribeToPlan,
  updateCurrentCompanyProfile,
} from './support/app';

test.describe('profile, settings, and reports browser flows', () => {
  test('profile page renders persisted company-backed information', async ({ page }) => {
    const authed = await registerAndCompleteOnboarding(page);
    const updatedCompany = `PW Company ${Date.now().toString().slice(-4)}`;
    const updatedPhone = '08111111111';
    const updatedAddress = '456 Updated Street';

    await updateCurrentCompanyProfile(authed.page, {
      name: updatedCompany,
      phone: updatedPhone,
      address: updatedAddress,
    });

    await authed.page.goto('/profile');
    await expect(authed.page.locator('#companyName')).toHaveValue(updatedCompany);
    await expect(authed.page.locator('#phone')).toHaveValue(updatedPhone);
    await expect(authed.page.locator('#address')).toHaveValue(updatedAddress);

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
    const reportDate = await authed.page.evaluate(() =>
      new Intl.DateTimeFormat('en-CA', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      }).format(new Date()),
    );

    await createJournalEntryByCode(authed.page, {
      date: reportDate,
      memo: revenueMemo,
      lines: [
        { accountCode: '1001', debit: 250000, credit: 0 },
        { accountCode: '4001', debit: 0, credit: 250000 },
      ],
    });
    await createJournalEntryByCode(authed.page, {
      date: reportDate,
      memo: capitalMemo,
      lines: [
        { accountCode: '1001', debit: 100000, credit: 0 },
        { accountCode: '3001', debit: 0, credit: 100000 },
      ],
    });

    const companyResponse = await authed.page.context().request.get(`${API_URL}/companies/current`);
    expect(companyResponse.ok(), await companyResponse.text()).toBeTruthy();
    const company = (await companyResponse.json()) as { id: string };

    await expect
      .poll(async () => {
        const reportResponse = await authed.page.context().request.get(
          `${API_URL}/companies/${company.id}/reports/daily?date=${reportDate}`,
        );
        expect(reportResponse.ok(), await reportResponse.text()).toBeTruthy();
        const report = (await reportResponse.json()) as {
          totals: { revenue: number };
        };
        return report.totals.revenue;
      })
      .toBe(250000);

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
