import Link from 'next/link';
import styles from './dashboard.module.css';

const recentReports = [
  {
    id: 'FR-1042',
    issue: 'Lights flickering above study desks',
    location: 'Library · L2-14',
    category: 'Electrical',
    priority: 'High',
    status: 'In Progress',
    updated: 'Today, 10:36 am',
  },
  {
    id: 'FR-1035',
    issue: 'Window blind detached from rail',
    location: 'Arts Block · AR2-09',
    category: 'Furniture',
    priority: 'Medium',
    status: 'Assigned',
    updated: 'Yesterday, 4:45 pm',
  },
  {
    id: 'FR-1029',
    issue: 'Projector image is distorted',
    location: 'Business School · B1-06',
    category: 'IT Equipment',
    priority: 'Medium',
    status: 'Open',
    updated: '26 Aug 2026',
  },
  {
    id: 'FR-1018',
    issue: 'Broken chair beside study booth',
    location: 'Student Centre · SC-12',
    category: 'Furniture',
    priority: 'Low',
    status: 'Resolved',
    updated: '19 Aug 2026',
  },
];

const updates = [
  {
    id: 1,
    title: 'Repair work has started',
    detail: 'FR-1042 was moved to In Progress by Aroha Rangi.',
    time: '35 minutes ago',
    unread: true,
  },
  {
    id: 2,
    title: 'Technician assigned',
    detail: 'Sophie Morgan was assigned to FR-1035.',
    time: 'Yesterday',
    unread: true,
  },
  {
    id: 3,
    title: 'Report resolved',
    detail: 'FR-1018 was completed and marked Resolved.',
    time: '19 Aug 2026',
    unread: false,
  },
];

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
const currentProgressStep = 2;

export default function StudentDashboardPage() {
  const openCount = recentReports.filter((report) => report.status === 'Open').length;
  const activeCount = recentReports.filter((report) =>
    ['Assigned', 'In Progress'].includes(report.status)
  ).length;
  const resolvedCount = recentReports.filter((report) => report.status === 'Resolved').length;
  const unreadCount = updates.filter((update) => update.unread).length;

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

      <section className={styles.summaryGrid} aria-label="Your report summary">
        <article className={styles.summaryCard}>
          <span className={`${styles.summaryIcon} ${styles.iconBlue}`} aria-hidden="true">#</span>
          <div>
            <p>Total reports</p>
            <strong>{recentReports.length}</strong>
            <span>Submitted by you</span>
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
              <caption className={styles.srOnly}>Your four most recent facility fault reports</caption>
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
                {recentReports.map((report) => (
                  <tr key={report.id}>
                    <td>
                      <span className={styles.reportId}>{report.id}</span>
                      <span className={styles.issueText}>{report.issue}</span>
                      <span className={styles.mobileLocation}>{report.location}</span>
                    </td>
                    <td>{report.location}</td>
                    <td>
                      <span className={`${styles.priorityBadge} ${priorityStyles[report.priority]}`}>
                        {report.priority}
                      </span>
                    </td>
                    <td>
                      <span className={`${styles.statusBadge} ${statusStyles[report.status]}`}>
                        {report.status}
                      </span>
                    </td>
                    <td>{report.updated}</td>
                  </tr>
                ))}
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
                  <small>Submit location, priority and issue details</small>
                </div>
                <span className={styles.actionArrow} aria-hidden="true">→</span>
              </Link>
              <Link href="/student_staff/notifications">
                <span className={styles.quickIcon} aria-hidden="true">!</span>
                <div>
                  <strong>Notifications</strong>
                  <small>{unreadCount} unread maintenance updates</small>
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
              <p className={styles.sectionLabel}>Latest report · FR-1042</p>
              <h2 id="progress-heading">Repair progress</h2>
            </div>
            <span className={`${styles.statusBadge} ${styles.statusInProgress}`}>In Progress</span>
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
            A technician is currently investigating the lighting fault in Library L2-14.
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
            {updates.map((update) => (
              <li key={update.id}>
                <span className={update.unread ? styles.unreadDot : styles.readDot} aria-hidden="true" />
                <div>
                  <strong>{update.title}</strong>
                  <p>{update.detail}</p>
                </div>
                <time>{update.time}</time>
              </li>
            ))}
          </ol>
        </section>
      </div>

      <p className={styles.prototypeNote}>
        Prototype dashboard: the sample reports demonstrate the intended student workflow and can later be connected to SQLite data.
      </p>
    </main>
  );
}

