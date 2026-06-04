import { expect, test } from '@playwright/test';
import { API_URL } from './support/app';

const uniqueEmail = () => `pw-reset-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@test.com`;

test.describe('password reset browser flow', () => {
  test('user can request a reset link, set a new password, and log in with it', async ({ page, request }) => {
    const email = uniqueEmail();
    const oldPassword = 'Password123!';
    const newPassword = 'NewPassword123!';

    const registerResponse = await request.post(`${API_URL}/auth/register`, {
      data: {
        email,
        password: oldPassword,
        name: 'Reset Flow User',
      },
    });
    expect(registerResponse.ok(), await registerResponse.text()).toBeTruthy();

    await page.goto('/forgot-password');
    await page.getByLabel(/Email/i).fill(email);
    await page.getByRole('button', { name: /Kirim Link Reset/i }).click();

    await expect(page).toHaveURL(/\/reset-password\?token=/);
    await expect(page.getByRole('heading', { name: /Reset Password/i })).toBeVisible();

    await page.getByLabel(/^Password Baru$/i).fill(newPassword);
    await page.getByLabel(/^Konfirmasi Password Baru$/i).fill(newPassword);
    await page.getByRole('button', { name: /Simpan Password Baru/i }).click();

    await expect(page).toHaveURL(/\/login$/);

    await page.getByLabel(/^Email$/i).fill(email);
    await page.getByLabel(/^Password$/i).fill(newPassword);
    await page.getByRole('button', { name: /^Masuk$/i }).click();

    await expect(page).not.toHaveURL(/\/login$/);

    const oldPasswordLogin = await request.post(`${API_URL}/auth/login`, {
      data: {
        email,
        password: oldPassword,
      },
    });
    expect(oldPasswordLogin.status()).toBe(401);

    const newPasswordLogin = await request.post(`${API_URL}/auth/login`, {
      data: {
        email,
        password: newPassword,
      },
    });
    expect(newPasswordLogin.ok(), await newPasswordLogin.text()).toBeTruthy();
  });
});
