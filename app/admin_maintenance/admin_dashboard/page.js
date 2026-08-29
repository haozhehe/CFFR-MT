// MODIFIED: added a descriptive, accessible <caption> (visually hidden) to the reports table
import Database from 'better-sqlite3';
import path from 'node:path';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function getAdminDashboardData() {
  const databasePath = path.join(
    process.cwd(),
    'app',
    'database',
    'cffr.db'
  );

  const db = new Database(databasePath, {
    readonly: true,
  });

  try {
    const reportStats = db
      .prepare(`
        SELECT
          COUNT(*) AS total_reports,

          SUM(
            CASE
              WHEN status = 'open'
              THEN 1
              ELSE 0
            END
          ) AS open_reports,

          SUM(
            CASE
              WHEN status IN ('assigned', 'in_progress')
              THEN 1
              ELSE 0
            END
          ) AS active_reports,

          SUM(
            CASE
              WHEN status IN ('resolved', 'closed')
              THEN 1
              ELSE 0
            END
          ) AS resolved_reports
        FROM reports
      `)
      .get();

    const userStats = db
      .prepare(`
        SELECT
          COUNT(*) AS total_users,

          SUM(
            CASE
              WHEN role = 'student'
              THEN 1
              ELSE 0
            END
          ) AS students,

          SUM(
            CASE
              WHEN role = 'staff'
              THEN 1
              ELSE 0
            END
          ) AS staff,

          SUM(
            CASE
              WHEN role = 'technician'
              THEN 1
              ELSE 0
            END
          ) AS technicians,

          SUM(
            CASE
              WHEN role = 'admin'
              THEN 1
              ELSE 0
            END
          ) AS admins
        FROM users
      `)
      .get();

    const recentReports = db
      .prepare(`
        SELECT
          reports.id,
          reports.description,
          reports.location,
          reports.status,
          reports.created_at,
          users.username,
          technicians.name AS technician_name
        FROM reports
        INNER JOIN users
          ON reports.user_id = users.id
        LEFT JOIN technicians
          ON technicians.assigned_report = reports.id
        ORDER BY reports.created_at DESC
        LIMIT 8
      `)
      .all();

    return {
      reportStats: {
        total: Number(reportStats?.total_reports ?? 0),
        open: Number(reportStats?.open_reports ?? 0),
        active: Number(reportStats?.active_reports ?? 0),
        resolved: Number(reportStats?.resolved_reports ?? 0),
      },

      userStats: {
        total: Number(userStats?.total_users ?? 0),
        students: Number(userStats?.students ?? 0),
        staff: Number(userStats?.staff ?? 0),
        technicians: Number(userStats?.technicians ?? 0),
        admins: Number(userStats?.admins ?? 0),
      },

      recentReports,
      error: null,
    };
  } catch (error) {
    console.error('Admin dashboard database error:', error);

    return {
      reportStats: {
        total: 0,
        open: 0,
        active: 0,
        resolved: 0,
      },

      userStats: {
        total: 0,
        students: 0,
        staff: 0,
        technicians: 0,
        admins: 0,
      },

      recentReports: [],
      error: 'Unable to load dashboard information from the database.',
    };
  } finally {
    db.close();
  }
}

function formatStatus(status) {
  switch (status) {
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
      return status;
  }
}

function formatDate(dateValue) {
  if (!dateValue) {
    return '-';
  }

  const date = new Date(`${dateValue} UTC`);

  if (Number.isNaN(date.getTime())) {
    return dateValue;
  }

  return date.toLocaleDateString('en-NZ', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export default function AdminDashboard() {
  const {
    reportStats,
    userStats,
    recentReports,
    error,
  } = getAdminDashboardData();

  return (
    <div className="admin-dashboard">
      <div className="admin-dashboard-header">
        <div>
          <h1>Admin Dashboard</h1>

          <p>
            Monitor facility reports, maintenance progress,
            users and system activity.
          </p>
        </div>
      </div>

      {error && (
        <div className="admin-error-message">
          {error}
        </div>
      )}

      <section className="admin-stat-grid">
        <div className="admin-stat-card">
          <p>Total Reports</p>

          <h2>{reportStats.total}</h2>

          <span>All submitted fault reports</span>
        </div>

        <div className="admin-stat-card">
          <p>Open Reports</p>

          <h2>{reportStats.open}</h2>

          <span>Waiting for review or assignment</span>
        </div>

        <div className="admin-stat-card">
          <p>Active Reports</p>

          <h2>{reportStats.active}</h2>

          <span>Assigned or currently in progress</span>
        </div>

        <div className="admin-stat-card">
          <p>Resolved / Closed</p>

          <h2>{reportStats.resolved}</h2>

          <span>Completed facility reports</span>
        </div>
      </section>

      <section className="admin-dashboard-section">
        <div className="admin-section-heading">
          <div>
            <h2>Recent Fault Reports</h2>

            <p>
              Most recently submitted facility reports.
            </p>
          </div>
        </div>

        <div className="admin-table-container">
          {recentReports.length === 0 ? (
            <div className="admin-empty-state">
              No fault reports have been submitted yet.
            </div>
          ) : (
            <table className="admin-report-table" aria-label="Recent facility fault reports">
              {/* MODIFIED: accessible <caption> added for screen readers; visually hidden via .sr-only CSS */}
              <caption className="sr-only">
                Most recently submitted facility reports with status and technician assignment.
              </caption>

              <thead>
                <tr>
                  <th>Report</th>
                  <th>Submitted By</th>
                  <th>Location</th>
                  <th>Description</th>
                  <th>Status</th>
                  <th>Technician</th>
                  <th>Created</th>
                </tr>
              </thead>

              <tbody>
                {recentReports.map((report) => (
                  <tr key={report.id}>
                    <td className="admin-report-id">
                      #{report.id}
                    </td>

                    <td>{report.username}</td>

                    <td>{report.location}</td>

                    <td className="admin-description-cell">
                      {report.description}
                    </td>

                    <td>
                      <span
                        className={`admin-status-badge status-${report.status}`}
                      >
                        {formatStatus(report.status)}
                      </span>
                    </td>

                    <td>
                      {report.technician_name || 'Unassigned'}
                    </td>

                    <td>
                      {formatDate(report.created_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>

      <section className="admin-bottom-grid">
        <div className="admin-dashboard-section">
          <h2>User Overview</h2>

          <p className="admin-section-description">
            Registered users by system role.
          </p>

          <div className="admin-overview-row">
            <span>Total Users</span>
            <strong>{userStats.total}</strong>
          </div>

          <div className="admin-overview-row">
            <span>Students</span>
            <strong>{userStats.students}</strong>
          </div>

          <div className="admin-overview-row">
            <span>Staff</span>
            <strong>{userStats.staff}</strong>
          </div>

          <div className="admin-overview-row">
            <span>Technicians</span>
            <strong>{userStats.technicians}</strong>
          </div>

          <div className="admin-overview-row">
            <span>Administrators</span>
            <strong>{userStats.admins}</strong>
          </div>
        </div>

        <div className="admin-dashboard-section">
          <h2>Report Overview</h2>

          <p className="admin-section-description">
            Current maintenance report distribution.
          </p>

          <div className="admin-overview-row">
            <span>Open</span>
            <strong>{reportStats.open}</strong>
          </div>

          <div className="admin-overview-row">
            <span>Assigned / In Progress</span>
            <strong>{reportStats.active}</strong>
          </div>

          <div className="admin-overview-row">
            <span>Resolved / Closed</span>
            <strong>{reportStats.resolved}</strong>
          </div>

          <div className="admin-overview-row">
            <span>Total Reports</span>
            <strong>{reportStats.total}</strong>
          </div>
        </div>
      </section>
    </div>
  );
}