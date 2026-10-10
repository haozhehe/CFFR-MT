'use client';

import Link from 'next/link';
import {
  useEffect,
  useState,
} from 'react';
import { usePathname } from 'next/navigation';

const navigationByRole = {
  student: [
    {
      label: 'Dashboard',
      href: '/student_staff/dashboard',
    },
    {
      label: 'Submit a Fault',
      href: '/student_staff/submit_fault',
    },
    {
      label: 'My Reports',
      href: '/student_staff/my_reports',
    },
    {
      label: 'Notifications',
      href: '/student_staff/notifications',
    },
  ],

  staff: [
    {
      label: 'Dashboard',
      href: '/student_staff/dashboard',
    },
    {
      label: 'Submit a Fault',
      href: '/student_staff/submit_fault',
    },
    {
      label: 'My Reports',
      href: '/student_staff/my_reports',
    },
    {
      label: 'Notifications',
      href: '/student_staff/notifications',
    },
  ],

  technician: [
    {
      label: 'Assigned Jobs',
      href: '/technician/assigned',
    },
    {
      label: 'Completed Jobs',
      href: '/technician/completed',
    },
    {
      label: 'Notifications',
      href: '/technician/notifications',
    },
  ],

  admin: [
    {
      label: 'Dashboard',
      href: '/admin_maintenance/admin_dashboard',
    },
    {
      label: 'Maintenance Queue',
      href: '/admin_maintenance/maintenance_queue',
    },
  ],
};

export default function NavShell({
  children,
}) {
  const pathname = usePathname();

  const [currentUser, setCurrentUser] =
    useState(null);

  const isLoginRoute =
    pathname === '/login' ||
    pathname?.startsWith('/login');

  useEffect(() => {
    if (isLoginRoute) {
      setCurrentUser(null);
      return;
    }

    const savedUser =
      window.localStorage.getItem('currentUser');

    if (!savedUser) {
      setCurrentUser(null);
      return;
    }

    try {
      const parsedUser =
        JSON.parse(savedUser);

      setCurrentUser(parsedUser);
    } catch (error) {
      console.error(
        'Unable to load current user:',
        error
      );

      setCurrentUser(null);
    }
  }, [pathname, isLoginRoute]);

  const navigationItems =
    navigationByRole[currentUser?.role] || [];

  const isActiveRoute = (href) => {
    return (
      pathname === href ||
      pathname?.startsWith(`${href}/`)
    );
  };

  return (
    <div className="app-shell">
      <aside
        className={
          isLoginRoute
            ? 'sidebar login-sidebar'
            : 'sidebar'
        }
        aria-label={
          isLoginRoute
            ? 'Login sidebar'
            : 'Main navigation'
        }
      >
        <header className="sidebar-header">
          <h1>
            FACILITY QA
          </h1>

          <p>
            Campus Maintenance
          </p>
        </header>

        {!isLoginRoute && (
          <nav
            className="sidebar-nav"
            aria-label="Facility QA sections"
          >
            {navigationItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={
                  isActiveRoute(item.href)
                    ? 'active-nav-link'
                    : ''
                }
              >
                <span aria-hidden="true" />

                {item.label}
              </Link>
            ))}
          </nav>
        )}
      </aside>

      <main
        className={
          isLoginRoute
            ? 'page-content login-page-content'
            : 'page-content'
        }
      >
        {children}
      </main>
    </div>
  );
}