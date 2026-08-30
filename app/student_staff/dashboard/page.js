'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import styles from './dashboard.module.css';

const statusStyles = {
  Open: styles.statusOpen,
  Assigned: styles.statusAssigned,
  'In Progress': styles.statusInProgress,
  Resolved: styles.statusResolved,
};

const priorityStyles = {
  High: styles.priorityHigh,
  Medium: styles.priorityMedium,
  Low: styles.priorityLow,
};

const progressSteps = ['Submitted', 'Reviewed', 'In Progress', 'Resolved'];

function formatStatus(value) {
  switch (value) {
    case 'open':
      return 'Open';
    case 'assigned':
      return 'Assigned';
    case 'in_progress':
      return 'In Progress';
    case 'resolved':
      return 'Resolved';
    case 'closed':
      return 'Closed';
    default:
      return value || 'Open';
  }
}

function formatDate(value) {
  if (!value) return 'Recently';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('en-NZ', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

export default function StudentDashboardPage() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const savedUser = localStorage.getItem('currentUser');
    if (!savedUser) {
      setError('You are not logged in.');
      setLoading(false);
      return;
    }

    setCurrentUser(JSON.parse(savedUser));
  }, []);

  useEffect(() => {
    if (!currentUser) return;

    let isMounted = true;

    async function loadReports() {
      try {
        const response = await fetch(
          `/api/reports?userId=${currentUser.id}&role=${currentUser.role}`
        );
        const data = await response.json();

        if (!isMounted) return;

        if (!response.ok || data.error) {
          setError(data.error || 'Unable to load reports.');
          setReports([]);
          return;
        }

        setReports(Array.isArray(data.reports) ? data.reports : []);
        setError('');
      } catch (fetchError) {
        if (!isMounted) return;
        setError('Unable to load reports from the database.');
        setReports([]);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadReports();

    return () => {
      isMounted = false;
    };
  }, [currentUser]);

  const recentReports = [...reports].sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
  );

  const openCount = recentReports.filter(
    (report) => (report.status || 'open').toLowerCase() === 'open'
  ).length;

  const activeCount = recentReports.filter((report) =>
    ['assigned', 'in_progress'].includes((report.status || 'open').toLowerCase())
  ).length;

  const resolvedCount = recentReports.filter((report) =>
    ['resolved', 'closed'].includes((report.status || 'open').toLowerCase())
  ).length;

  const recentActivity = recentReports.slice(0, 3).map((report, index) => ({
    id: report.id,
    title: `${formatStatus(report.status)} report update`,
    detail: report.description,
    time: formatDate(report.createdAt),
    unread: index === 0,
  }));

  const currentProgressStep = recentReports.some((report) =>
    ['in_progress', 'resolved', 'closed'].includes((report.status || 'open').toLowerCase())
  )
    ? 2
    : 1;

  return (
    <main className={styles.dashboard}>
      <header className={styles.welcomeHeader}>
        <div>
          <p className={styles.eyebrow}>Student / Staff portal</p>
          <h1>Welcome back</h1>
          <p className={styles.welcomeText}>
            Track your facility reports and see the latest maintenance updates in one place.
          </p>
        </div>
        <Link className={styles.primaryAction} href="/student_staff/submit_fault">
          <span aria-hidden="true">+</span>
          Report a fault
        </Link>
      </header>

      {error && <div className="error-message" role="alert">{error}</div>}

      {!loading && !error && (
        <>
          <section className={styles.summaryGrid} aria-label="Your report summary">
            <article className={styles.summaryCard}>
              <span className={`${styles.summaryIcon} ${styles.iconBlue}`} aria-hidden="true">#</span>
              <div>
                <p>Total reports</p>
                <strong>{recentReports.length}</strong>
                <span>{currentUser?.role === 'student' ? 'Submitted by you' : 'All active reports'}</span>
              </div>
            </article>
            <article className={styles.summaryCard}>
              <span className={`${styles.summaryIcon} ${styles.iconAmber}`} aria-hidden="true">○</span>
              <div>
                <p>Open</p>
                <strong>{openCount}</strong>
                <span>Waiting for review</span>
              </div>
            </article>
            <article className={styles.summaryCard}>
              <span className={`${styles.summaryIcon} ${styles.iconPurple}`} aria-hidden="true">↻</span>
              <div>
                <p>Active</p>
                <strong>{activeCount}</strong>
                <span>Assigned or in progress</span>
              </div>
            </article>
            <article className={styles.summaryCard}>
              <span className={`${styles.summaryIcon} ${styles.iconGreen}`} aria-hidden="true">✓</span>
              <div>
                <p>Resolved</p>
                <strong>{resolvedCount}</strong>
                <span>Repair completed</span>
              </div>
            </article>
          </section>

          <div className={styles.dashboardGrid}>
            <section className={styles.panel} aria-labelledby="recent-reports-heading">
              <div className={styles.panelHeader}>
                <div>
                  <p className={styles.sectionLabel}>Your submissions</p>
                  <h2 id="recent-reports-heading">Recent reports</h2>
                </div>
              </div>

              <div className={styles.tableWrapper}>
                <table className={styles.reportTable}>
                  <caption className={styles.srOnly}>Your recent facility fault reports</caption>
                  <thead>
                    <tr>
                      <th scope="col">Report</th>
                      <th scope="col">Location</th>
                      <th scope="col">Priority</th>
                      <th scope="col">Status</th>
                      <th scope="col">Last updated</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentReports.length === 0 ? (
                      <tr>
                        <td colSpan="5" className={styles.emptyStateCell}>No reports found.</td>
                      </tr>
                    ) : (
                      recentReports.map((report) => (
                        <tr key={report.id}>
                          <td>
                            <span className={styles.reportId}>FR-{report.id}</span>
                            <span className={styles.issueText}>{report.description}</span>
                            <span className={styles.mobileLocation}>{report.location}</span>
                          </td>
                          <td>{report.location}</td>
                          <td>
                            <span className={`${styles.priorityBadge} ${priorityStyles.Medium}`}>
                              Medium
                            </span>
                          </td>
                          <td>
                            <span className={`${styles.statusBadge} ${statusStyles[formatStatus(report.status)]}`}>
                              {formatStatus(report.status)}
                            </span>
                          </td>
                          <td>{formatDate(report.createdAt)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </section>

            <aside className={styles.sideColumn} aria-label="Dashboard tools and updates">
              <section className={styles.panel} aria-labelledby="quick-actions-heading">
                <div className={styles.panelHeader}>
                  <div>
                    <p className={styles.sectionLabel}>Shortcuts</p>
                    <h2 id="quick-actions-heading">Quick actions</h2>
                  </div>
                </div>
                <nav className={styles.quickActions} aria-label="Student dashboard shortcuts">
                  <Link href="/student_staff/submit_fault">
                    <span className={styles.quickIcon} aria-hidden="true">+</span>
                    <div>
                      <strong>Report a new fault</strong>
                      <small>Submit location and issue details</small>
                    </div>
                    <span className={styles.actionArrow} aria-hidden="true">→</span>
                  </Link>
                  <Link href="/student_staff/notifications">
                    <span className={styles.quickIcon} aria-hidden="true">!</span>
                    <div>
                      <strong>Notifications</strong>
                      <small>{recentReports.length} recent maintenance updates</small>
                    </div>
                    <span className={styles.actionArrow} aria-hidden="true">→</span>
                  </Link>
                </nav>
              </section>

              <section className={styles.helpCard} aria-labelledby="help-heading">
                <span className={styles.helpIcon} aria-hidden="true">?</span>
                <div>
                  <h2 id="help-heading">What should I report?</h2>
                  <p>Report damaged furniture, electrical issues, leaks, unsafe areas, or faulty classroom equipment.</p>
                </div>
              </section>
            </aside>
          </div>

          <div className={styles.lowerGrid}>
            <section className={styles.panel} aria-labelledby="progress-heading">
              <div className={styles.panelHeader}>
                <div>
                  <p className={styles.sectionLabel}>Latest report</p>
                  <h2 id="progress-heading">Repair progress</h2>
                </div>
                <span className={`${styles.statusBadge} ${styles.statusInProgress}`}>
                  {recentReports[0] ? formatStatus(recentReports[0].status) : 'Open'}
                </span>
              </div>
              <ol className={styles.progressList}>
                {progressSteps.map((step, index) => {
                  const isComplete = index < currentProgressStep;
                  const isCurrent = index === currentProgressStep;
                  return (
                    <li
                      key={step}
                      className={isCurrent ? styles.currentStep : isComplete ? styles.completeStep : styles.futureStep}
                    >
                      <span aria-hidden="true">{isComplete ? '✓' : index + 1}</span>
                      <strong>{step}</strong>
                    </li>
                  );
                })}
              </ol>
              <p className={styles.progressNote}>
                {recentReports[0]
                  ? `Current status for FR-${recentReports[0].id}: ${formatStatus(recentReports[0].status)}.`
                  : 'No reports have been submitted yet.'}
              </p>
            </section>

            <section className={styles.panel} aria-labelledby="updates-heading">
              <div className={styles.panelHeader}>
                <div>
                  <p className={styles.sectionLabel}>Latest activity</p>
                  <h2 id="updates-heading">Recent updates</h2>
                </div>
                <Link className={styles.textLink} href="/student_staff/notifications">
                  View notifications
                  <span aria-hidden="true">→</span>
                </Link>
              </div>
              <ol className={styles.updatesList}>
                {recentActivity.length === 0 ? (
                  <li>
                    <span className={styles.readDot} aria-hidden="true" />
                    <div>
                      <strong>No updates yet</strong>
                      <p>Your report activity will appear here.</p>
                    </div>
                    <time>—</time>
                  </li>
                ) : (
                  recentActivity.map((update) => (
                    <li key={update.id}>
                      <span className={update.unread ? styles.unreadDot : styles.readDot} aria-hidden="true" />
                      <div>
                        <strong>{update.title}</strong>
                        <p>{update.detail}</p>
                      </div>
                      <time>{update.time}</time>
                    </li>
                  ))
                )}
              </ol>
            </section>
          </div>
        </>
      )}
    </main>
  );
}

