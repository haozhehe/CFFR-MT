# Verification of added pages

Checked on 16 October 2026 (Pacific/Auckland).

| Check | Result |
| --- | --- |
| Original file hashes | 36 of 36 unchanged, including package.json and cffr.db |
| Database and logic tests | 17 passed, 0 failed |
| Production HTTP and API checks | 22 passed, 0 failed |
| Production build | Passed with `npm run build -- --webpack` |
| Interactive browser and visual checks | Not completed: local browser launch and cross-process localhost access were blocked |

## What was verified

The tests verify that the migration preserves original rows, can run repeatedly,
and does not invent historical completion records. They cover report events,
assignment, reassignment, completion after the original assignment link is cleared,
reopening, transaction rollback, read-state ownership, sessions and search helpers.

The HTTP checks ran against the final production build in a disposable project
copy. They checked login through the original URL, session cookies, rejection
of unauthenticated requests and forged account selection, cross-user notification
protection, read-state persistence, student/staff data ownership, technician job
history and maintenance-role rejection by the added API. All four added page
URLs and the two existing maintenance URLs returned HTTP 200.

The assignment/resolution integration check used the same SQL operations as the
existing maintenance and technician code. It did not click those forms in a browser.
Successful HTTP page responses do not establish interactive usability or role
redirect behaviour in the browser.

No test accounts, reports, installed dependencies or runtime-modified databases
are included in the delivered project. All tests used in-memory databases or a
separate disposable project copy.

## Environment limits

The supplied Next.js 16.3.1, React 19.2.8 and better-sqlite3 13.0.3 versions were
used. Default Turbopack compilation hit Windows path-permission errors; Webpack
completed the production build. Windows npm's native build attempt failed, but
the packaged SQLite Windows binary worked after installation with scripts disabled.

Headless Edge did not launch successfully, and the in-app browser could not
reach the isolated server. Therefore, screenshots, interactive browser tests,
keyboard accessibility and cross-browser acceptance results are not claimed.

## Remaining local checks

Sign in as student, staff and technician. Check the existing sidebar links,
tracking search/status controls, notification read/unread controls and a complete
assignment-to-resolution flow. Confirm that wrong-role navigation returns to the
appropriate home page. Check keyboard operation, narrow screens and existing
dashboard/submission behaviour. These remain manual checks, not recorded passes.

These results cover the new files only; they are not a final Assessment 2
release decision or a claim that the original project's security issues are fixed.
