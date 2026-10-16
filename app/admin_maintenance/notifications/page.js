'use client';

import { useEffect, useState } from 'react';
import { ReportAttachment } from '../../_workflow/Shared.js';

function formatStatus(status) {
  switch (status) {
    case 'in_progress':
      return 'In Progress';
    case 'resolved':
      return 'Resolved';
    case 'closed':
      return 'Closed';
    default:
      return status
        ? status.charAt(0).toUpperCase() + status.slice(1)
        : 'Open';
  }
}

function formatDate(value) {
  if (!value) return 'Recently submitted';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat('en-NZ', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}

export default function AdminNotificationsPage() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true;

    async function loadNotifications() {
      const savedUser = window.localStorage.getItem('currentUser');

      if (!savedUser) {
        if (isMounted) {
          setError('You are not logged in.');
          setLoading(false);
        }
        return;
      }

      let currentUser;
      try {
        currentUser = JSON.parse(savedUser);
      } catch {
        if (isMounted) {
          setError('Unable to read your account information. Please sign in again.');
          setLoading(false);
        }
        return;
      }

      try {
        const response = await fetch(
          `/api/reports?userId=${encodeURIComponent(currentUser.id)}&role=admin`
        );
        const data = await response.json();

        if (!isMounted) return;

        if (!response.ok || data.error) {
          setError(data.error || 'Unable to load notifications.');
          setReports([]);
          return;
        }

        setReports(Array.isArray(data.reports) ? data.reports : []);
      } catch {
        if (isMounted) {
          setError('Unable to load notifications from the database.');
          setReports([]);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadNotifications();

    return () => {
      isMounted = false;
    };
  }, []);

  const notifications = [...reports].sort(
    (first, second) => new Date(second.createdAt) - new Date(first.createdAt)
  );

  return (
    <main className="student-notifications-page">
      <header className="student-notifications-header">
        <p className="student-notifications-eyebrow">Administrator portal</p>
        <h1>Notifications</h1>
        <p>Updates for all facility reports.</p>
      </header>

      {error && <div className="error-message" role="alert">{error}</div>}

      {loading ? (
        <p className="student-notifications-state" role="status">Loading notifications...</p>
      ) : !error && notifications.length === 0 ? (
        <section className="student-notifications-empty">
          <h2>No notifications yet</h2>
          <p>Updates will appear here when facility reports are submitted.</p>
        </section>
      ) : (
        <section className="student-notifications-list" aria-label="All report notifications">
          {notifications.map((report) => (
            <article className="student-notification-card" key={report.id}>
              <div className="student-notification-topline">
                <div>
                  <span className="student-notification-reference">
                    Report #{report.id}
                  </span>
                  <h2>{report.location}</h2>
                </div>
                <span className={`student-notification-status status-${report.status || 'open'}`}>
                  {formatStatus(report.status)}
                </span>
              </div>

              <p className="student-notification-description">{report.description}</p>
              <ReportAttachment imagePath={report.imagePath} />
              <time className="student-notification-date" dateTime={report.createdAt || undefined}>
                Submitted {formatDate(report.createdAt)}
              </time>
            </article>
          ))}
        </section>
      )}
    </main>
  );
}
