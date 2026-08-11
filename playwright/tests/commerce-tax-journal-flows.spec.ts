import { expect, test } from '@playwright/test';
import {
  closeAuthedContext,
  createProduct,
  getBalanceReport,
  getRangeReport,
  listJournals,
  listPayables,
  listReceivables,
  listTaxCodes,
  registerAndCompleteOnboarding,
  subscribeToPlan,
} from './support/app';

type JournalLike = {
  id: string;
  source: string | null;
  sourceId: string | null;
  lines: Array<{
    account: { code: string; name: string };
    debit: number;
    credit: number;
  }>;
};

function todayInputValue() {
  const now = new Date();
  const year = now.getFullYear();
  const month = `${now.getMonth() + 1}`.padStart(2, '0');
  const day = `${now.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function expectBalanced(entry: JournalLike) {
  const totalDebit = entry.lines.reduce((sum, line) => sum + line.debit, 0);
  const totalCredit = entry.lines.reduce((sum, line) => sum + line.credit, 0);
  expect(totalDebit, `journal ${entry.id} should be balanced on debit side`).toBe(totalCredit);
}

function expectLine(
  entry: JournalLike,
  accountCode: string,
  expected: { debit: number; credit: number },
) {
  const line = entry.lines.find((item) => item.account.code === accountCode);
  expect(line, `missing account line ${accountCode} on journal ${entry.id}`).toBeTruthy();
  expect(line?.debit ?? -1, `unexpected debit for ${accountCode}`).toBe(expected.debit);
  expect(line?.credit ?? -1, `unexpected credit for ${accountCode}`).toBe(expected.credit);
}

test.describe('commerce tax journal live QA', () => {
  test('taxed receivable sale and taxed payable purchase propagate correctly into journals and reports', async ({ page }) => {
    test.slow();
    await page.setViewportSize({ width: 1440, height: 1600 });

    const authed = await registerAndCompleteOnboarding(page);
    await subscribeToPlan(authed.page, 'business');

    const suffix = Date.now().toString().slice(-6);
    const productCode = `TX-${suffix}`;
    const productName = `Tax QA Product ${suffix}`;
    const purchaseItemName = `Tax QA Purchase ${suffix}`;
    const today = todayInputValue();

    await createProduct(authed.page, {
      code: productCode,
      name: productName,
      price: 20000,
      buyPrice: 15000,
      stock: 50,
    });

    const taxCodes = await listTaxCodes(authed.page);
    const ppnTax = taxCodes.find((code) => code.code.toUpperCase() === 'PPN');
    expect(ppnTax, 'default PPN tax code should exist').toBeTruthy();

    await authed.page.goto('/sales');
    await authed.page.getByRole('button', { name: /Catat Penjualan/i }).first().click();
    const saleDialog = authed.page.getByRole('dialog', { name: /Catat Penjualan Baru/i });
    await saleDialog.getByLabel(/Kode Produk/i).fill(productCode);
    await saleDialog.getByLabel(/Jumlah Terjual/i).fill('5');
    await saleDialog.getByRole('combobox').nth(2).click();
    await authed.page.getByRole('option', { name: /PPN/i }).click();

    await expect(saleDialog).toContainText(/DPP/i);
    await expect(saleDialog).toContainText(/Rp100\.000/i);
    await expect(saleDialog).toContainText(/Rp11\.000/i);
    await expect(saleDialog).toContainText(/Rp111\.000/i);

    const saleResponsePromise = authed.page.waitForResponse((response) =>
      response.url().includes('/sales') && response.request().method() === 'POST',
    );
    await saleDialog.locator('form').evaluate((form: HTMLFormElement) => form.requestSubmit());
    const saleResponse = await saleResponsePromise;
    expect(saleResponse.ok(), await saleResponse.text()).toBeTruthy();

    const saleRow = authed.page.getByRole('row').filter({ hasText: productName });
    await expect(saleRow).toBeVisible();
    await expect(saleRow).toContainText(/PPN/i);
    await expect(saleRow).toContainText(/111\.000/);

    await authed.page.goto('/purchases');
    await authed.page.getByRole('button', { name: /Tambah Pembelian/i }).first().click();
    const purchaseDialog = authed.page.getByRole('dialog', { name: /Tambah Pembelian/i });
    await purchaseDialog.getByLabel(/Nama Barang/i).fill(purchaseItemName);
    await purchaseDialog.getByLabel(/Kode Produk/i).fill(productCode);
    await purchaseDialog.getByLabel(/Pemasok/i).fill('PT Tax QA Supplier');
    await purchaseDialog.getByLabel(/^Jumlah$/i).fill('4');
    await purchaseDialog.getByLabel(/Harga Satuan/i).fill('15000');
    await purchaseDialog.getByRole('combobox').nth(1).click();
    await authed.page.getByRole('option', { name: /PPN/i }).click();

    await expect(purchaseDialog).toContainText(/DPP/i);
    await expect(purchaseDialog).toContainText(/Rp60\.000/i);
    await expect(purchaseDialog).toContainText(/Rp6\.600/i);
    await expect(purchaseDialog).toContainText(/Rp66\.600/i);

    const purchaseResponsePromise = authed.page.waitForResponse((response) =>
      response.url().includes('/purchases') && response.request().method() === 'POST',
    );
    await purchaseDialog.locator('form').evaluate((form: HTMLFormElement) => form.requestSubmit());
    const purchaseResponse = await purchaseResponsePromise;
    expect(purchaseResponse.ok(), await purchaseResponse.text()).toBeTruthy();

    const purchaseRow = authed.page.getByRole('row').filter({ hasText: purchaseItemName });
    await expect(purchaseRow).toBeVisible();
    await expect(purchaseRow).toContainText(/PPN/i);
    await expect(purchaseRow).toContainText(/66\.600/);

    const receivables = await listReceivables(authed.page);
    expect(receivables).toHaveLength(1);
    const receivable = receivables[0];
    expect(receivable.amount).toBe(111000);
    expect(receivable.paidAmount).toBe(0);
    expect(receivable.status.toLowerCase()).toBe('open');

    const payables = await listPayables(authed.page);
    expect(payables).toHaveLength(1);
    const payable = payables[0];
    expect(payable.amount).toBe(66600);
    expect(payable.paidAmount).toBe(0);
    expect(payable.status.toLowerCase()).toBe('open');

    const journals = await listJournals(authed.page);
    const receivableJournal = journals.find(
      (entry) => entry.source === 'receivable' && entry.sourceId === receivable.id,
    );
    const payableJournal = journals.find(
      (entry) => entry.source === 'payable' && entry.sourceId === payable.id,
    );

    expect(receivableJournal, 'receivable sale journal should exist').toBeTruthy();
    expect(payableJournal, 'payable purchase journal should exist').toBeTruthy();

    expectBalanced(receivableJournal as JournalLike);
    expectLine(receivableJournal as JournalLike, '1101', { debit: 111000, credit: 0 });
    expectLine(receivableJournal as JournalLike, '4001', { debit: 0, credit: 100000 });
    expectLine(receivableJournal as JournalLike, '2101', { debit: 0, credit: 11000 });

    expectBalanced(payableJournal as JournalLike);
    expectLine(payableJournal as JournalLike, '5001', { debit: 60000, credit: 0 });
    expectLine(payableJournal as JournalLike, '1102', { debit: 6600, credit: 0 });
    expectLine(payableJournal as JournalLike, '2001', { debit: 0, credit: 66600 });

    const rangeReport = await getRangeReport(authed.page, today, today);
    expect(rangeReport.totals.revenue).toBe(100000);
    expect(rangeReport.totals.expense).toBe(60000);
    expect(rangeReport.totals.netProfit).toBe(40000);
    expect(rangeReport.totals.cashIn).toBe(0);
    expect(rangeReport.totals.cashOut).toBe(0);
    expect(rangeReport.totals.netCash).toBe(0);
    expect(rangeReport.totals.receivableChange).toBe(111000);
    expect(rangeReport.totals.payableChange).toBe(66600);

    const balanceReport = await getBalanceReport(authed.page, today);
    expect(balanceReport.categories.receivable).toBe(111000);
    expect(balanceReport.categories.prepaidTax).toBe(6600);
    expect(balanceReport.categories.payables).toBe(66600);
    expect(balanceReport.categories.otherCurrentLiabilities).toBe(11000);
    expect(balanceReport.categories.retainedEarnings).toBe(40000);
    expect(balanceReport.categories.totalAssets).toBe(117600);
    expect(balanceReport.categories.totalLiabilities).toBe(77600);
    expect(balanceReport.categories.totalEquity).toBe(40000);

    await closeAuthedContext(authed.context);
  });
});
