'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

const ROLE_HOME = {
  student: '/student_staff/dashboard',
  staff: '/student_staff/dashboard',
  technician: '/technician/assigned',
  admin: '/admin_maintenance/admin_dashboard',
};

export default function AuthGuard({
  children,
  allowedRoles = [],
}) {
  const router = useRouter();

  const [accessAllowed, setAccessAllowed] = useState(false);
  const [checkingAccess, setCheckingAccess] = useState(true);

  useEffect(() => {
    const loggedIn =
      window.localStorage.getItem('isLoggedIn') === 'true';

    const savedUser =
      window.localStorage.getItem('currentUser');

    if (!loggedIn || !savedUser) {
      setAccessAllowed(false);
      setCheckingAccess(false);

      router.replace('/login/login');
      return;
    }

    let currentUser;

    try {
      currentUser = JSON.parse(savedUser);
    } catch (error) {
      console.error(
        'Unable to read current user:',
        error
      );

      window.localStorage.removeItem('isLoggedIn');
      window.localStorage.removeItem('currentUser');

      setAccessAllowed(false);
      setCheckingAccess(false);

      router.replace('/login/login');
      return;
    }

    const userRole = currentUser?.role;

    if (!userRole) {
      window.localStorage.removeItem('isLoggedIn');
      window.localStorage.removeItem('currentUser');

      setAccessAllowed(false);
      setCheckingAccess(false);

      router.replace('/login/login');
      return;
    }

    // check role access 
    if (
      allowedRoles.length > 0 &&
      !allowedRoles.includes(userRole)
    ) {
      setAccessAllowed(false);
      setCheckingAccess(false);

      const destination =
        ROLE_HOME[userRole] || '/login/login';

      router.replace(destination);
      return;
    }

    setAccessAllowed(true);
    setCheckingAccess(false);
  }, [allowedRoles, router]);

  if (checkingAccess || !accessAllowed) {
    return null;
  }

  return children;
}