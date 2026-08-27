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
          <h1>{isLoginRoute ? '' : 'FACILITY QA'}</h1>
          <p>{isLoginRoute ? '' : 'Campus Maintenance'}</p>
        </header>

        {!isLoginRoute && (
          <nav className="sidebar-nav" aria-label="Facility QA sections">
            <Link href="/">
              <span aria-hidden="true" />
              Temp
            </Link>

            <Link href="/">
              <span aria-hidden="true" />
              Temp
            </Link>

            <Link href="/">
              <span aria-hidden="true" />
              Temp
            </Link>

            <Link href="/">
              <span aria-hidden="true" />
              Temp
            </Link>
            {adminAccess && (
              <Link href="/">
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
