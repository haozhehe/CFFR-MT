'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styles from './navigation.module.css';

export default function PortalNavigation({ role, children }) {
  const pathname = usePathname();
  const [sidebar, setSidebar] = useState(null);
  const [userId, setUserId] = useState(null);
  const technician = role === 'technician';
  const dashboard = pathname === '/student_staff/dashboard';

  useEffect(() => {
    // Add the grouped menu to the existing sidebar without changing NavShell.js.
    setSidebar(document.querySelector('.app-shell > .sidebar'));
    try {
      const user = JSON.parse(localStorage.getItem('currentUser') || 'null');
      setUserId(user?.id || null);
    } catch {
      setUserId(null);
    }
  }, [pathname]);

  const notificationsUrl = userId
    ? `/technician/notifications?userId=${encodeURIComponent(userId)}`
    : '/technician/notifications';

  const tabs = technician ? [
    { label: 'Notifications', href: notificationsUrl },
    { label: 'Assigned jobs', href: '/technician/assigned' },
    { label: 'Completed jobs', href: '/technician/completed' },
  ] : [
    { label: 'Fault report tracking', href: '/student_staff/my_reports' },
    { label: 'Notifications', href: '/student_staff/notifications' },
    { label: 'Submit a fault', href: '/student_staff/submit_fault' },
  ];

  const sections = technician ? [
    { label: 'Technician portal', href: '/technician/assigned', active: true },
  ] : [
    { label: 'Dashboard', href: '/student_staff/dashboard', active: dashboard },
    { label: 'Fault reports', href: '/student_staff/my_reports', active: !dashboard },
  ];

  return <div className={styles.portal}>
    {sidebar && createPortal(
      <nav className={`sidebar-nav ${styles.sidebarMenu}`} aria-label="Portal sections">
        {sections.map((section) => <Link key={section.href} href={section.href}
          aria-current={section.active ? (pathname === section.href ? 'page' : 'location') : undefined}>
          <span aria-hidden="true" />{section.label}
        </Link>)}
      </nav>, sidebar
    )}

    {!dashboard && <div className={styles.topSection}>
      <nav className={styles.tabs} aria-label={technician ? 'Technician portal pages' : 'Fault report pages'}>
        {tabs.map((tab) => <Link key={tab.href} href={tab.href}
          aria-current={pathname === tab.href.split('?')[0] ? 'page' : undefined}>
          {tab.label}
        </Link>)}
      </nav>
    </div>}

    <div className={styles.content}>{children}</div>
  </div>;
}
