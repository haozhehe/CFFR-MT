'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AuthGuard({ children }) {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const loggedIn = window.localStorage.getItem('isLoggedIn') === 'true';
    const savedUser = window.localStorage.getItem('currentUser');
    const hasUser = savedUser && savedUser !== 'undefined';
    const authenticated = loggedIn && hasUser;

    setIsLoggedIn(authenticated);

    if (!authenticated) {
      router.replace('/login/login');
    }
  }, [router]);

  if (!isLoggedIn) {
    return null;
  }

  return children;
}