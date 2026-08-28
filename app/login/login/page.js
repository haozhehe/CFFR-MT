'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    email: '',
    username: '',
    password: '',
  });

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const response = await fetch('/api/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(formData),
    });

    const result = await response.json();

    if (!response.ok || result.error) {
      setError(result.error || 'The details may be incorrect.');
      return;
    }

    setError('');
    window.localStorage.setItem('isLoggedIn', 'true');
    router.push('/student_staff/dashboard');
  };

  return (
    <div className="login-panel">
      <div className="login-title">Sign in</div>
      <p className="login-subtitle">Welcome back</p>

      <form className="login-form" onSubmit={handleSubmit}>

        <label>
          <span className="field-label">Username</span>
          <input
            type="text"
            name="username"
            value={formData.username}
            onChange={handleChange}
          />
        </label>

        <label>
          <span className="field-label">Email</span>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
          />
        </label>

        <label>
          <span className="field-label">Password</span>
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
          />
        </label>

        {error && <p className="login-error">{error}</p>}

        <button type="submit" className="login-button">
          Login
        </button>

        <div className="login-actions">
          <span className="login-helper-text">Don&apos;t have an account?</span>
          <Link href="/login/signup" className="login-link">
            Create one
          </Link>
        </div>
      </form>
    </div>
  );
}