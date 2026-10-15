'use client';

import { useState } from 'react';
import Link from 'next/link';
import useWorkflow from './useWorkflow.js';
import { STATUS_LABELS, eventMessage, filterReports, formatDate } from './display.js';
import { PageHeader, LoadState, ReportDetails, ReportHeading } from './Shared.js';
import styles from './workflow.module.css';

export default function StudentPages({ mode }) {
  const state = useWorkflow('student');
  const { data, refresh } = state;
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [saving, setSaving] = useState(false);
  const [actionError, setActionError] = useState('');
  const tracking = mode === 'tracking';
  const reports = data?.reports || [];
  const events = data?.events || [];
  const notifications = events.filter((event) => event.kind !== 'snapshot');
  const unread = notifications.filter((event) => !event.read_at).length;
  const visibleReports = filterReports(reports, search, status);
  const visibleNotifications = notifications.filter((event) => !unreadOnly || !event.read_at);

  async function markNotificationRead(eventId) {
    setSaving(true);
    setActionError('');
    try {
      const response = await fetch('/api/workflow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-workflow-user': String(data.user.id) },
        body: JSON.stringify({ eventId }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Unable to update the notification.');
      await refresh();
    } catch (error) { setActionError(error.message); }
    finally { setSaving(false); }
  }

  return <div className={styles.page}>
    <PageHeader role="Student / Staff" title={tracking ? 'Fault report tracking' : 'Notifications'}
      subtitle={tracking ? 'Follow the progress of the faults you have reported.' : 'Assignment and progress updates for your fault reports.'}
      refresh={refresh} />
    <nav className={styles.tabs} aria-label="Your reports">
      <Link href="/student_staff/my_reports" aria-current={tracking ? 'page' : undefined}>Fault report tracking</Link>
      <Link href="/student_staff/notifications" aria-current={!tracking ? 'page' : undefined}>Notifications{data ? ` (${unread} unread)` : ''}</Link>
      <Link href="/student_staff/submit_fault">Submit a fault</Link>
    </nav>
    <LoadState {...state} />
    {data && <>
      {tracking ? <>
        <div className={styles.stats}>
          <div><strong>{reports.length}</strong><span>Total reports</span></div>
          <div><strong>{reports.filter((r) => !['resolved', 'closed'].includes(r.status)).length}</strong><span>Active reports</span></div>
          <div><strong>{reports.filter((r) => ['resolved', 'closed'].includes(r.status)).length}</strong><span>Resolved / closed</span></div>
        </div>
        <div className={styles.filters}>
          <label>Search reports<input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Report number, location or description" /></label>
          <label>Status<select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="all">All statuses</option>
            {Object.entries(STATUS_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select></label>
          <button className={styles.button} onClick={() => { setSearch(''); setStatus('all'); }}>Clear filters</button>
        </div>
        {visibleReports.length === 0 && <div className={styles.empty}><h2>{reports.length ? 'No matching reports' : 'No reports yet'}</h2>
          <p>{reports.length ? 'Try another search or clear your filters.' : 'Submit a fault to start tracking its progress.'}</p></div>}
        <div className={styles.list}>
          {visibleReports.map((report) => {
            const history = events.filter((event) => event.report_id === report.id).slice().reverse();
            return <article className={styles.card} key={report.id} id={`report-${report.id}`}>
              <ReportHeading report={report} />
              <ReportDetails report={report} />
              <ol className={styles.progress} aria-label={`Current status of report ${report.id}`}>
                {Object.entries(STATUS_LABELS).map(([value, label]) => <li key={value} aria-current={report.status === value ? 'step' : undefined}>{label}</li>)}
              </ol>
              <details className={styles.history}><summary>View report history</summary>
                <ol>
                  {!history.some((event) => event.kind === 'submitted') && <li><span>Your fault report was submitted.</span><small>{formatDate(report.created_at)}</small></li>}
                  {history.map((event) => <li key={event.id}><span>{eventMessage(event)}</span><small>{formatDate(event.created_at)}</small></li>)}
                </ol>
              </details>
            </article>;
          })}
        </div>
      </> : <>
        <div className={styles.notificationTools}>
          <label className={styles.checkbox}><input type="checkbox" checked={unreadOnly} onChange={(e) => setUnreadOnly(e.target.checked)} />Show unread only</label>
          <button className={styles.button} disabled={saving || unread === 0} onClick={() => markNotificationRead('all')}>Mark all as read</button>
        </div>
        {actionError && <p className={styles.error} role="alert">{actionError}</p>}
        {visibleNotifications.length === 0 && <div className={styles.empty}><h2>{unreadOnly ? 'No unread notifications' : 'No notifications yet'}</h2>
          <p>New assignments and status updates will appear here.</p></div>}
        <div className={styles.list}>
          {visibleNotifications.map((event) => <article className={`${styles.card} ${!event.read_at ? styles.unread : ''}`} key={event.id}>
            <div className={styles.cardHeading}><div><p className={styles.reference}>Report #{event.report_id}</p><h2>{event.location}</h2></div>
              {!event.read_at && <span className={styles.badge}>Unread</span>}</div>
            <p>{eventMessage(event)}</p><p className={styles.muted}>{formatDate(event.created_at)}</p>
            <div className={styles.actions}>
              <Link className={styles.link} href={`/student_staff/my_reports#report-${event.report_id}`}>Track this report</Link>
              {!event.read_at && <button className={styles.button} disabled={saving} onClick={() => markNotificationRead(event.id)}>Mark as read</button>}
            </div>
          </article>)}
        </div>
      </>}
    </>}
  </div>;
}
