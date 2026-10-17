# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: tests\role-access.spec.js >> AT02 - student sees Student Staff navigation only
- Location: tests\role-access.spec.js:19:1

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByRole('link', { name: 'Submit a Fault' })
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" getByRole('link', { name: 'Submit a Fault' }) with timeout 5000ms
  - waiting for getByRole('link', { name: 'Submit a Fault' })

```

```yaml
- complementary "Main navigation":
  - heading "FACILITY QA" [level=1]
  - paragraph: Campus Maintenance
  - navigation "Portal sections":
    - link "Dashboard":
      - /url: /student_staff/dashboard
    - link "Fault reports":
      - /url: /student_staff/my_reports
- main:
  - main:
    - paragraph: Student / Staff portal
    - heading "Welcome back" [level=1]
    - paragraph: Track your facility reports and see the latest maintenance updates in one place.
    - link "Report a fault":
      - /url: /student_staff/submit_fault
    - region "Your report summary":
      - article:
        - paragraph: Total reports
        - strong: "0"
        - text: Submitted by you
      - article:
        - paragraph: Open
        - strong: "0"
        - text: Waiting for review
      - article:
        - paragraph: Active
        - strong: "0"
        - text: Assigned or in progress
      - article:
        - paragraph: Resolved
        - strong: "0"
        - text: Repair completed
    - region "Recent reports":
      - paragraph: Your submissions
      - heading "Recent reports" [level=2]
      - table "Your recent facility fault reports":
        - caption: Your recent facility fault reports
        - rowgroup:
          - row "Report Location Priority Status Last updated":
            - columnheader "Report"
            - columnheader "Location"
            - columnheader "Priority"
            - columnheader "Status"
            - columnheader "Last updated"
        - rowgroup:
          - row "No reports found.":
            - cell "No reports found."
    - complementary "Dashboard tools and updates":
      - region "Quick actions":
        - paragraph: Shortcuts
        - heading "Quick actions" [level=2]
        - navigation "Student dashboard shortcuts":
          - link "Report a new fault Submit location and issue details":
            - /url: /student_staff/submit_fault
            - strong: Report a new fault
            - text: Submit location and issue details
          - link "Notifications 0 recent maintenance updates":
            - /url: /student_staff/notifications
            - strong: Notifications
            - text: 0 recent maintenance updates
      - region "What should I report?":
        - heading "What should I report?" [level=2]
        - paragraph: Report damaged furniture, electrical issues, leaks, unsafe areas, or faulty classroom equipment.
    - region "Repair progress":
      - paragraph: Latest report
      - heading "Repair progress" [level=2]
      - text: Open
      - list:
        - listitem:
          - strong: Submitted
        - listitem:
          - strong: Reviewed
        - listitem:
          - strong: In Progress
        - listitem:
          - strong: Resolved
      - paragraph: No reports have been submitted yet.
    - region "Recent updates":
      - paragraph: Latest activity
      - heading "Recent updates" [level=2]
      - link "View notifications":
        - /url: /student_staff/notifications
      - list:
        - listitem:
          - strong: No updates yet
          - paragraph: Your report activity will appear here.
          - time: —
- alert
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | async function loginAsRole(page, role) {
  4  |   await page.addInitScript((userRole) => {
  5  |     localStorage.setItem('isLoggedIn', 'true');
  6  | 
  7  |     localStorage.setItem(
  8  |       'currentUser',
  9  |       JSON.stringify({
  10 |         id: 99,
  11 |         username: `test_${userRole}`,
  12 |         email: `${userRole}@test.local`,
  13 |         role: userRole,
  14 |       })
  15 |     );
  16 |   }, role);
  17 | }
  18 | 
  19 | test(
  20 |   'AT02 - student sees Student Staff navigation only',
  21 |   async ({ page }) => {
  22 |     await loginAsRole(page, 'student');
  23 | 
  24 |     await page.goto(
  25 |       'http://localhost:3000/student_staff/dashboard'
  26 |     );
  27 | 
  28 |     await expect(
  29 |       page.getByRole('link', { name: 'Dashboard' })
  30 |     ).toBeVisible();
  31 | 
  32 |     await expect(
  33 |       page.getByRole('link', { name: 'Submit a Fault' })
> 34 |     ).toBeVisible();
     |       ^ Error: expect(locator).toBeVisible() failed
  35 | 
  36 |     await expect(
  37 |       page.getByRole('link', { name: 'My Reports' })
  38 |     ).toBeVisible();
  39 | 
  40 |     await expect(
  41 |       page.getByRole('link', { name: 'Notifications' })
  42 |     ).toBeVisible();
  43 | 
  44 |     await expect(
  45 |       page.getByRole('link', {
  46 |         name: 'Maintenance Queue',
  47 |       })
  48 |     ).not.toBeVisible();
  49 |   }
  50 | );
  51 | 
  52 | test(
  53 |   'AT03 - student cannot access Admin Dashboard',
  54 |   async ({ page }) => {
  55 |     await loginAsRole(page, 'student');
  56 | 
  57 |     await page.goto(
  58 |       'http://localhost:3000/admin_maintenance/admin_dashboard'
  59 |     );
  60 | 
  61 |     await expect(page).toHaveURL(
  62 |       /student_staff\/dashboard/
  63 |     );
  64 |   }
  65 | );
  66 | 
  67 | test(
  68 |   'AT04 - technician cannot access Admin Dashboard',
  69 |   async ({ page }) => {
  70 |     await loginAsRole(page, 'technician');
  71 | 
  72 |     await page.goto(
  73 |       'http://localhost:3000/admin_maintenance/admin_dashboard'
  74 |     );
  75 | 
  76 |     await expect(page).toHaveURL(
  77 |       /technician\/assigned/
  78 |     );
  79 |   }
  80 | );
```