import { test, expect } from '@playwright/test';

test('AT01 - login page loads successfully', async ({ page }) => {
  await page.goto('http://localhost:3000/login/login');

  await expect(page).toHaveURL(/login/);

  await expect(
    page.getByRole('button', { name: 'Login' })
  ).toBeVisible();
});