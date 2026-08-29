'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const adminAccess = false;

export default function NavShell({ children }) {
  const pathname = usePathname();
  const isLoginRoute = pathname === '/login' || (pathname?.startsWith('/login') ?? false);

  return (
    <div className="app-shell">
      <aside className={isLoginRoute ? 'sidebar login-sidebar' : 'sidebar'} aria-label={isLoginRoute ? 'Login sidebar' : 'Main navigation'}>
        <header className="sidebar-header">
          <h1>{isLoginRoute ? 'FACILITY QA' : 'FACILITY QA'}</h1>
          <p>{isLoginRoute ? 'Campus Maintenance' : 'Campus Maintenance'}</p>
        </header>

        {!isLoginRoute && (
          <nav className="sidebar-nav" aria-label="Facility QA sections">
            <Link
              href="/student_staff/dashboard"
              className={
                pathname === '/student_staff/dashboard'
                  ? 'active-nav-link'
                  : ''
              }
            >
              <span aria-hidden="true" />
              Dashboard
            </Link>

            <Link
              href="/student_staff/submit_fault"
              className={
                pathname === '/student_staff/submit_fault'
                  ? 'active-nav-link'
                  : ''
              }
            >
              <span aria-hidden="true" />
              Report a Fault
            </Link>

            <Link
              href="/student_staff/report_details"
              className={
                pathname === '/student_staff/report_details'
                  ? 'active-nav-link'
                  : ''
              }
            >
              <span aria-hidden="true" />
              My Reports
            </Link>

            <Link
              href="/student_staff/notifications"
              className={
                pathname === '/student_staff/notifications'
                  ? 'active-nav-link'
                  : ''
              }
            >
              <span aria-hidden="true" />
              Notifications
            </Link>

            <Link
              href="/admin_maintenance/maintenance_queue"
              className={
                pathname === '/admin_maintenance/maintenance_queue'
                  ? 'active-nav-link'
                  : ''
              }
            >
              <span aria-hidden="true" />
              Maintenance Queue
            </Link>

            <Link
              href="/admin_maintenance/admin_dashboard"
              className={
                pathname === '/admin_maintenance/admin_dashboard'
                  ? 'active-nav-link'
                  : ''
              }
            >
              <span aria-hidden="true" />
              Admin
            </Link>

            {adminAccess && (
              <Link href="/admin_maintenance/admin_dashboard">
                <span aria-hidden="true" />
                Admin
              </Link>
            )}
          </nav>
        )}
      </aside>

      <main className={isLoginRoute ? 'page-content login-page-content' : 'page-content'}>{children}</main>
    </div>
  );
}
