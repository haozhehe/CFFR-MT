'use client';

import { useState } from 'react';
import Link from 'next/link';
import useWorkflow from './useWorkflow.js';
import { filterReports, formatDate, STATUS_LABELS } from './display.js';
import { PageHeader, LoadState, ReportDetails, ReportHeading } from './Shared.js';
import styles from './workflow.module.css';

export default function JobBoard({ completed = false }) {
  const state = useWorkflow('technician');
  const { data, refresh } = state;
  const [search, setSearch] = useState('');
  const jobs = data ? (completed ? data.completed : data.assigned) : [];
  const visibleJobs = filterReports(jobs, search);
  const notificationsLink = data ? `/technician/notifications?userId=${data.user.id}` : '/technician/notifications';

  return <div className={styles.page}>
    <PageHeader role="Technician" title={completed ? 'Completed jobs' : 'Assigned jobs'}
      subtitle={completed ? 'A record of the maintenance jobs you have finished.' : 'View your current jobs and open notifications to update their progress.'}
      refresh={refresh} />
    <nav className={styles.tabs} aria-label="Technician jobs">
      <Link href="/technician/assigned" aria-current={!completed ? 'page' : undefined}>Assigned jobs{data ? ` (${data.assigned.length})` : ''}</Link>
      <Link href="/technician/completed" aria-current={completed ? 'page' : undefined}>Completed jobs{data ? ` (${data.completed.length})` : ''}</Link>
      <Link href={notificationsLink}>Notifications</Link>
    </nav>
    <LoadState {...state} />
    {data && <>
      {!data.technician && <p className={styles.error} role="alert">Your technician profile has not been set up. Please contact maintenance.</p>}
      <div className={styles.filters}><label>Search jobs<input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Report number, location or description" /></label>
        <button className={styles.button} onClick={() => setSearch('')}>Clear search</button></div>
      {visibleJobs.length === 0 && <div className={styles.empty}>
        <h2>{search ? 'No matching jobs' : completed ? 'No completed jobs yet' : 'No assigned jobs'}</h2>
        <p>{search ? 'Try a different search.' : completed ? 'Jobs you finish will appear here.' : 'Jobs will appear here when maintenance assigns them to you.'}</p>
      </div>}
      <div className={styles.list}>
        {visibleJobs.map((job) => <article className={styles.card} key={job.job_id || job.id}>
          <ReportHeading report={job} status={completed ? job.completed_status : job.status} />
          <ReportDetails report={job} />
          <dl className={styles.details}>
            <div><dt>Assigned</dt><dd>{formatDate(job.assigned_at)}</dd></div>
            {completed && <div><dt>Completed</dt><dd>{formatDate(job.completed_at)}</dd></div>}
          </dl>
          {completed && job.status !== job.completed_status && <p className={styles.muted}>Current report status: {STATUS_LABELS[job.status] || job.status}</p>}
          {!completed && <Link className={styles.primaryLink} href={notificationsLink}>Open job in notifications</Link>}
        </article>)}
      </div>
    </>}
  </div>;
}
