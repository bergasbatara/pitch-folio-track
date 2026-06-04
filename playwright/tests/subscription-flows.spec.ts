import { expect, test } from '@playwright/test';
import {
  closeAuthedContext,
  expireCurrentSubscription,
  registerAndCompleteOnboarding,
  subscribeToPlan,
} from './support/app';

async function mockEwalletSuccessFlow(
  page: Parameters<typeof test>[0]['page'],
  method: 'qris' | 'gopay',
) {
  let statusChecks = 0;

  await page.route(`**/payments/charge/${method}`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(
        method === 'qris'
          ? {
              statusCode: '201',
              transactionStatus: 'pending',
              orderId: `PW-${method.toUpperCase()}-${Date.now()}`,
              qrString: '00020101021226670016COM.NOBUBANK.WWW01189360050300000879140214500000000000000303UMI51440014ID.CO.QRIS.WWW0215ID10243359051030303UMI5204549953033605802ID5910PW TESTING6007JAKARTA6105123456304ABCD',
            }
          : {
              statusCode: '201',
              transactionStatus: 'pending',
              orderId: `PW-${method.toUpperCase()}-${Date.now()}`,
              deeplinkUrl: 'gojek://gopay/pay?token=playwright-test',
              qrUrl: 'https://example.com/gopay-qr.png',
            },
      ),
    });
  });

  await page.route('**/payments/status/*', async (route) => {
    statusChecks += 1;
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        transactionStatus: statusChecks >= 1 ? 'settlement' : 'pending',
      }),
    });
  });
}

async function mockEwalletFailureFlow(
  page: Parameters<typeof test>[0]['page'],
  method: 'qris' | 'gopay',
  transactionStatus: 'expire' | 'cancel' | 'deny',
) {
  await page.route(`**/payments/charge/${method}`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(
        method === 'qris'
          ? {
              statusCode: '201',
              transactionStatus: 'pending',
              orderId: `PW-${method.toUpperCase()}-${Date.now()}`,
              qrString: '00020101021226670016COM.NOBUBANK.WWW01189360050300000879140214500000000000000303UMI51440014ID.CO.QRIS.WWW0215ID10243359051030303UMI5204549953033605802ID5910PW TESTING6007JAKARTA6105123456304ABCD',
            }
          : {
              statusCode: '201',
              transactionStatus: 'pending',
              orderId: `PW-${method.toUpperCase()}-${Date.now()}`,
              deeplinkUrl: 'gojek://gopay/pay?token=playwright-test',
              qrUrl: 'https://example.com/gopay-qr.png',
            },
      ),
    });
  });

  await page.route('**/payments/status/*', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        transactionStatus,
      }),
    });
  });
}

async function mockCard3dsSuccessFlow(page: Parameters<typeof test>[0]['page']) {
  let statusChecks = 0;

  await page.route('**/midtrans-new-3ds.min.js', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/javascript',
      body: `
        window.MidtransNew3ds = {
          getCardToken: function(_cardData, options) {
            setTimeout(function() {
              options.onSuccess({ token_id: 'pw-card-token', hash: 'pw-hash' });
            }, 0);
          },
          authenticate: function(_redirectUrl, options) {
            setTimeout(function() {
              options.onSuccess({ transaction_status: 'pending' });
            }, 0);
          }
        };
      `,
    });
  });

  await page.route('**/payments/charge', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        statusCode: '201',
        statusMessage: '3DS authentication required',
        transactionStatus: 'pending',
        redirectUrl: 'https://acs.test/3ds',
        orderId: `PW-CARD-${Date.now()}`,
      }),
    });
  });

  await page.route('**/payments/status/*', async (route) => {
    statusChecks += 1;
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        transactionStatus: statusChecks >= 1 ? 'capture' : 'pending',
        fraudStatus: 'accept',
      }),
    });
  });
}

async function mockCardFailureFlow(page: Parameters<typeof test>[0]['page']) {
  await page.route('**/midtrans-new-3ds.min.js', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/javascript',
      body: `
        window.MidtransNew3ds = {
          getCardToken: function(_cardData, options) {
            setTimeout(function() {
              options.onFailure({ status_code: '402', status_message: 'Card declined' });
            }, 0);
          },
          authenticate: function(_redirectUrl, options) {
            setTimeout(function() {
              options.onFailure({ transaction_status: 'deny' });
            }, 0);
          }
        };
      `,
    });
  });
}

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

  test('expired professional subscription is blocked, can start renewal, and regains access after renewal', async ({ page }) => {
    const authed = await registerAndCompleteOnboarding(page);
    await subscribeToPlan(authed.page, 'professional');
    await expireCurrentSubscription(authed.page);

    await authed.page.goto('/audit-draft');
    await expect(authed.page.getByRole('heading', { name: /Halaman Terkunci/i })).toBeVisible();

    await authed.page.goto('/langganan');
    await expect(authed.page.getByRole('heading', { name: /Pilih Paket Langganan/i })).toBeVisible();
    await authed.page.getByRole('button', { name: /Perpanjang Paket Ini/i }).click();

    await expect(authed.page).toHaveURL(/\/pembayaran\?plan=professional$/);
    await expect(authed.page.getByRole('heading', { name: /^Pembayaran$/i })).toBeVisible();

    await subscribeToPlan(authed.page, 'professional');
    await authed.page.goto('/audit-draft');

    await expect(
      authed.page.getByRole('heading', { name: /Drafting Laporan Keuangan untuk Audit/i }),
    ).toBeVisible();
    await closeAuthedContext(authed.context);
  });

  test('QRIS payment flow generates QR and returns to subscription page on settlement', async ({ page }) => {
    const authed = await registerAndCompleteOnboarding(page);
    await mockEwalletSuccessFlow(authed.page, 'qris');

    await authed.page.goto('/pembayaran?plan=professional');
    await authed.page.getByRole('tab', { name: /QRIS/i }).click();
    await authed.page.getByRole('button', { name: /Generate QR Code/i }).click();

    await expect(authed.page.getByText(/Menunggu pembayaran/i)).toBeVisible();
    await expect(authed.page).toHaveURL(/\/langganan$/);
    await expect(authed.page.getByRole('heading', { name: /Pilih Paket Langganan/i })).toBeVisible();
    await closeAuthedContext(authed.context);
  });

  test('GoPay payment flow opens deeplink state and returns to subscription page on settlement', async ({ page }) => {
    const authed = await registerAndCompleteOnboarding(page);
    await mockEwalletSuccessFlow(authed.page, 'gopay');

    await authed.page.goto('/pembayaran?plan=professional');
    await authed.page.getByRole('tab', { name: /GoPay/i }).click();
    await authed.page.getByRole('button', { name: /Bayar dengan GoPay/i }).click();

    await expect(authed.page.getByRole('link', { name: /Buka aplikasi GoJek/i })).toBeVisible();
    await expect(authed.page.getByText(/Menunggu pembayaran/i)).toBeVisible();
    await expect(authed.page).toHaveURL(/\/langganan$/);
    await expect(authed.page.getByRole('heading', { name: /Pilih Paket Langganan/i })).toBeVisible();
    await closeAuthedContext(authed.context);
  });

  test('card payment flow completes 3DS2 authentication and returns to subscription page on capture', async ({ page }) => {
    const authed = await registerAndCompleteOnboarding(page);
    await mockCard3dsSuccessFlow(authed.page);

    await authed.page.goto('/pembayaran?plan=professional');
    await authed.page.getByLabel(/Nomor Kartu/i).fill('4916 9940 6425 2017');
    await authed.page.getByLabel(/Nama Pemegang Kartu/i).fill('Playwright User');
    await authed.page.getByLabel(/Masa Berlaku/i).fill('01/30');
    await authed.page.getByLabel(/^CVV$/i).fill('123');
    await authed.page.getByRole('button', { name: /Bayar Rp 499\.000/i }).click();

    await expect(authed.page).toHaveURL(/\/langganan$/);
    await expect(authed.page.getByRole('heading', { name: /Pilih Paket Langganan/i })).toBeVisible();
    await closeAuthedContext(authed.context);
  });

  test('QRIS payment flow surfaces expire status and stays on the payment page', async ({ page }) => {
    const authed = await registerAndCompleteOnboarding(page);
    await mockEwalletFailureFlow(authed.page, 'qris', 'expire');

    await authed.page.goto('/pembayaran?plan=professional');
    await authed.page.getByRole('tab', { name: /QRIS/i }).click();
    await authed.page.getByRole('button', { name: /Generate QR Code/i }).click();

    await expect(authed.page.getByText(/Menunggu pembayaran/i)).toBeVisible();
    await expect(authed.page.getByText('Pembayaran Gagal', { exact: true })).toBeVisible();
    await expect(authed.page.getByText('Status: expire', { exact: true })).toBeVisible();
    await expect(authed.page).toHaveURL(/\/pembayaran\?plan=professional$/);
    await expect(authed.page.getByRole('button', { name: /Generate QR Baru/i })).toBeVisible();
    await closeAuthedContext(authed.context);
  });

  test('GoPay payment flow surfaces cancel status and stays on the payment page', async ({ page }) => {
    const authed = await registerAndCompleteOnboarding(page);
    await mockEwalletFailureFlow(authed.page, 'gopay', 'cancel');

    await authed.page.goto('/pembayaran?plan=professional');
    await authed.page.getByRole('tab', { name: /GoPay/i }).click();
    await authed.page.getByRole('button', { name: /Bayar dengan GoPay/i }).click();

    await expect(authed.page.getByRole('link', { name: /Buka aplikasi GoJek/i })).toBeVisible();
    await expect(authed.page.getByText(/Menunggu pembayaran/i)).toBeVisible();
    await expect(authed.page.getByText('Pembayaran Gagal', { exact: true })).toBeVisible();
    await expect(authed.page.getByText('Status: cancel', { exact: true })).toBeVisible();
    await expect(authed.page).toHaveURL(/\/pembayaran\?plan=professional$/);
    await expect(authed.page.getByRole('button', { name: /Coba lagi/i })).toBeVisible();
    await closeAuthedContext(authed.context);
  });

  test('card payment flow surfaces tokenization failure and stays on the payment page', async ({ page }) => {
    const authed = await registerAndCompleteOnboarding(page);
    await mockCardFailureFlow(authed.page);

    await authed.page.goto('/pembayaran?plan=professional');
    await authed.page.getByLabel(/Nomor Kartu/i).fill('4916 9940 6425 2017');
    await authed.page.getByLabel(/Nama Pemegang Kartu/i).fill('Playwright User');
    await authed.page.getByLabel(/Masa Berlaku/i).fill('01/30');
    await authed.page.getByLabel(/^CVV$/i).fill('123');
    await authed.page.getByRole('button', { name: /Bayar Rp 499\.000/i }).click();

    await expect(authed.page.getByText('Pembayaran Gagal', { exact: true })).toBeVisible();
    await expect(authed.page.getByText('Card declined')).toBeVisible();
    await expect(authed.page).toHaveURL(/\/pembayaran\?plan=professional$/);
    await expect(
      authed.page.getByRole('heading', { name: /^Pembayaran$/i }),
    ).toBeVisible();
    await closeAuthedContext(authed.context);
  });
});
