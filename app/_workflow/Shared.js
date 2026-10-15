import Link from 'next/link';
import { STATUS_LABELS, formatDate } from './display.js';
import styles from './workflow.module.css';

export function PageHeader({ title, subtitle, role, refresh }) {
  return <header className={styles.header}>
    <div><p className={styles.eyebrow}>{role} portal</p><h1>{title}</h1><p>{subtitle}</p></div>
    <button className={styles.button} onClick={refresh}>Refresh</button>
  </header>;
}

export function LoadState({ loading, error, signInRequired, refresh }) {
  if (loading) return <p role="status" className={styles.empty}>Loading your information...</p>;
  if (!error) return null;
  return <div role="alert" className={styles.error}>
    <p>{error}</p>
    {signInRequired ? <Link className={styles.link} href="/login/login" onClick={() => {
      localStorage.removeItem('currentUser'); localStorage.removeItem('isLoggedIn');
    }}>Sign in again</Link> : <button className={styles.button} onClick={refresh}>Try again</button>}
  </div>;
}

export function Status({ status }) {
  return <span className={`${styles.badge} ${styles[status] || ''}`}>{STATUS_LABELS[status] || status}</span>;
}

export function ReportDetails({ report }) {
  const photo = typeof report.image_path === 'string' && /^\/uploads\/[a-zA-Z0-9._-]+\.(png|jpe?g)$/i.test(report.image_path);
  return <>
    <p className={styles.description}>{report.description}</p>
    <dl className={styles.details}>
      <div><dt>Submitted</dt><dd>{formatDate(report.created_at)}</dd></div>
      {report.submitted_by && <div><dt>Reported by</dt><dd>{report.submitted_by}</dd></div>}
      {report.technician_name && <div><dt>Technician</dt><dd>{report.technician_name}</dd></div>}
    </dl>
    {photo && <a className={styles.link} href={report.image_path} target="_blank" rel="noreferrer">View attached photo</a>}
  </>;
}

export function ReportHeading({ report, status = report.status }) {
  return <div className={styles.cardHeading}>
    <div><p className={styles.reference}>Report #{report.id}</p><h2>{report.location}</h2></div>
    <Status status={status} />
  </div>;
}
