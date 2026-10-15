'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

export default function useWorkflow(roleGroup) {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [signInRequired, setSignInRequired] = useState(false);
  const requestNumber = useRef(0);

  const refresh = useCallback(async () => {
    const number = ++requestNumber.current;
    try {
      const account = JSON.parse(localStorage.getItem('currentUser') || 'null');
      if (!account?.id) throw new Error('Please sign in to continue.');
      const response = await fetch('/api/workflow', {
        cache: 'no-store', headers: { 'x-workflow-user': String(account.id) },
      });
      const result = await response.json();
      if (number !== requestNumber.current) return;
      setSignInRequired(response.status === 401);
      if (!response.ok) throw new Error(result.error || 'Unable to load your information.');
      const correctRole = roleGroup === 'technician'
        ? result.user.role === 'technician' : ['student', 'staff'].includes(result.user.role);
      if (!correctRole) throw new Error('This page is not available for your role.');
      setData(result);
      setError('');
    } catch (problem) {
      if (number === requestNumber.current) {
        setData(null);
        setError(problem.message || 'Unable to load your information. Please try again.');
      }
    } finally {
      if (number === requestNumber.current) setLoading(false);
    }
  }, [roleGroup]);

  useEffect(() => {
    refresh();
    const timer = setInterval(() => { if (!document.hidden) refresh(); }, 15000);
    window.addEventListener('focus', refresh);
    return () => {
      ++requestNumber.current;
      clearInterval(timer);
      window.removeEventListener('focus', refresh);
    };
  }, [refresh]);

  return { data, error, loading, signInRequired, refresh };
}
