import { test, expect } from '@playwright/test';

async function loginAsRole(page, role) {
  await page.addInitScript((userRole) => {
    localStorage.setItem('isLoggedIn', 'true');

    localStorage.setItem(
      'currentUser',
      JSON.stringify({
        id: 99,
        username: `test_${userRole}`,
        email: `${userRole}@test.local`,
        role: userRole,
      })
    );
  }, role);
}

test(
  'AT02 - student sees Student Staff navigation only',
  async ({ page }) => {
    await loginAsRole(page, 'student');

    await page.goto(
      'http://localhost:3000/student_staff/dashboard'
    );

    await expect(
      page.getByRole('link', {
        name: 'Dashboard',
        exact: true,
      })
    ).toBeVisible();

    await expect(
      page.getByRole('link', {
        name: 'Fault reports',
        exact: true,
      })
    ).toBeVisible();

    await expect(
      page.getByRole('link', {
        name: 'Maintenance Queue',
        exact: true,
      })
    ).not.toBeVisible();

    await expect(
      page.getByRole('link', {
        name: 'Admin',
        exact: true,
      })
    ).not.toBeVisible();
  }
);

test(
  'AT03 - student cannot access Admin Dashboard',
  async ({ page }) => {
    await loginAsRole(page, 'student');

    await page.goto(
      'http://localhost:3000/admin_maintenance/admin_dashboard'
    );

    await expect(page).toHaveURL(
      /student_staff\/dashboard/
    );
  }
);

test(
  'AT04 - technician cannot access Admin Dashboard',
  async ({ page }) => {
    await loginAsRole(page, 'technician');

    await page.goto(
      'http://localhost:3000/admin_maintenance/admin_dashboard'
    );

    await expect(page).toHaveURL(
      /technician\/assigned/
    );
  }
);