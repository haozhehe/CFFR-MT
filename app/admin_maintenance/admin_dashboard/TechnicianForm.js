'use client';

import { useState } from 'react';

export default function TechnicianForm() {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    name: '',
    specialisation: '',
  });
  const [status, setStatus] = useState({ type: '', message: '' });
  const [loading, setLoading] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setStatus({ type: '', message: '' });

    try {
      const response = await fetch('/api/technicians', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok || data.error) {
        setStatus({
          type: 'error',
          message: data.error || 'Unable to create technician account.',
        });
        return;
      }

      setStatus({
        type: 'success',
        message: `Technician account created for ${formData.name || formData.username}.`,
      });

      setFormData({
        username: '',
        email: '',
        password: '',
        name: '',
        specialisation: '',
      });
    } catch (error) {
      setStatus({
        type: 'error',
        message: 'Unable to create technician account right now.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="admin-dashboard-section technician-create-section">
      <div className="admin-section-heading">
        <div>
          <h2>Create Technician Account</h2>
          <p>Add a new technician login.</p>
        </div>
      </div>

      <form className="technician-form" onSubmit={handleSubmit}>
        <div className="technician-form-grid">
          <label>
            <span>Full name</span>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </label>

          <label>
            <span>Username</span>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              required
            />
          </label>

          <label>
            <span>Email</span>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </label>

          <label>
            <span>Password</span>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
            />
          </label>

          <label className="technician-full-width">
            <span>Specialisation</span>
            <input
              type="text"
              name="specialisation"
              value={formData.specialisation}
              onChange={handleChange}
              placeholder="e.g. Electrical, Plumbing, HVAC"
            />
          </label>
        </div>

        {status.message && (
          <p className={status.type === 'error' ? 'admin-error-message' : 'admin-success-message'}>
            {status.message}
          </p>
        )}

        <button type="submit" className="technician-submit-button" disabled={loading}>
          {loading ? 'Creating...' : 'Create technician'}
        </button>
      </form>

      <style jsx>{`
        .technician-create-section {
          margin-top: 28px;
        }

        .technician-form {
          display: grid;
          gap: 18px;
        }

        .technician-form-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 18px;
        }

        .technician-form label {
          display: grid;
          gap: 8px;
          font-weight: 600;
          color: #1d2433;
        }

        .technician-form label span {
          font-size: 0.92rem;
        }

        .technician-form input {
          width: 100%;
          padding: 10px 12px;
          border: 1px solid #dfe6ef;
          border-radius: 8px;
          font-size: 0.95rem;
          background: #fff;
          color: #172033;
        }

        .technician-form input:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }

        .technician-full-width {
          grid-column: 1 / -1;
        }

        .technician-submit-button {
          justify-self: flex-start;
          padding: 10px 18px;
          border: none;
          border-radius: 8px;
          font-weight: 600;
          background: #1d4ed8;
          color: white;
          cursor: pointer;
        }

        .technician-submit-button:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .admin-success-message {
          margin: 0;
          padding: 10px 12px;
          border-radius: 8px;
          background: #ecfdf5;
          color: #065f46;
          border: 1px solid #a7f3d0;
        }

        @media (max-width: 700px) {
          .technician-form-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </section>
  );
}
