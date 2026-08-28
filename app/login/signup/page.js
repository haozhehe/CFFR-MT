'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function SignupPage() {
  const router = useRouter();
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!formData.username || !formData.email || !formData.password) {
      setError('Please complete all fields.');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    const response = await fetch('/api/signup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: formData.username,
        email: formData.email,
        password: formData.password,
      }),
    });

    const result = await response.json();

    if (!response.ok || result.error) {
      setError(result.error || 'Unable to create your account.');
      return;
    }

    setError('');
    router.push('/login/login');
  };

  return (
    <div className="login-panel">
      <div className="login-title">Create account</div>
      <p className="login-subtitle">Join the Campus Facility Fault Reporting System</p>

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

        <label>
          <span className="field-label">Confirm password</span>
          <input
            type="password"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
          />
        </label>

        {error && <p className="login-error">{error}</p>}

        <button type="submit" className="login-button">
          Sign up
        </button>

        <div className="login-actions">
          <span className="login-helper-text">Already have an account?</span>
          <Link href="/login/login" className="login-link">
            Sign in
          </Link>
        </div>
      </form>
    </div>
  );
}