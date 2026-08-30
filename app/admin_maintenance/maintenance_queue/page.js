import Database from 'better-sqlite3';
import path from 'node:path';
import { revalidatePath } from 'next/cache';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const DATABASE_PATH = path.join(
  process.cwd(),
  'app',
  'database',
  'cffr.db'
);

const VALID_STATUSES = [
  'open',
  'assigned',
  'in_progress',
  'resolved',
  'closed',
];

function openDatabase(options = {}) {
  return new Database(DATABASE_PATH, options);
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

function getMaintenanceQueue(search, status) {
  const db = openDatabase({
    readonly: true,
  });

  try {
    let sql = `
      SELECT
        reports.id,
        reports.description,
        reports.location,
        reports.image_path,
        reports.status,
        reports.created_at,

        users.id AS user_id,
        users.username,
        users.email,
        users.role AS submitter_role,

        technicians.id AS technician_id,
        technicians.name AS technician_name,
        technicians.specialisation

      FROM reports

      INNER JOIN users
        ON reports.user_id = users.id

      LEFT JOIN technicians
        ON technicians.assigned_report = reports.id

      WHERE 1 = 1
    `;

    const params = [];

    if (status && VALID_STATUSES.includes(status)) {
      sql += `
        AND reports.status = ?
      `;

      params.push(status);
    }

    if (search) {
      sql += `
        AND (
          CAST(reports.id AS TEXT) LIKE ?
          OR reports.description LIKE ?
          OR reports.location LIKE ?
          OR users.username LIKE ?
          OR users.email LIKE ?
        )
      `;

      const searchTerm = `%${search}%`;

      params.push(
        searchTerm,
        searchTerm,
        searchTerm,
        searchTerm,
        searchTerm
      );
    }

    sql += `
      ORDER BY
        CASE reports.status
          WHEN 'open' THEN 1
          WHEN 'assigned' THEN 2
          WHEN 'in_progress' THEN 3
          WHEN 'resolved' THEN 4
          WHEN 'closed' THEN 5
          ELSE 6
        END,
        reports.created_at DESC
    `;

    return db.prepare(sql).all(...params);
  } finally {
    db.close();
  }
}

function getTechnicians() {
  const db = openDatabase({
    readonly: true,
  });

  try {
    return db
      .prepare(`
        SELECT
          technicians.id,
          technicians.name,
          technicians.specialisation,
          technicians.assigned_report,
          users.username,
          users.email

        FROM technicians

        INNER JOIN users
          ON technicians.user_id = users.id

        ORDER BY technicians.name ASC
      `)
      .all();
  } finally {
    db.close();
  }
}

function getQueueStats() {
  const db = openDatabase({
    readonly: true,
  });

  try {
    const stats = db
      .prepare(`
        SELECT
          COUNT(*) AS total,

          SUM(
            CASE
              WHEN status = 'open'
              THEN 1
              ELSE 0
            END
          ) AS open,

          SUM(
            CASE
              WHEN status = 'assigned'
              THEN 1
              ELSE 0
            END
          ) AS assigned,

          SUM(
            CASE
              WHEN status = 'in_progress'
              THEN 1
              ELSE 0
            END
          ) AS in_progress

        FROM reports
      `)
      .get();

    return {
      total: Number(stats?.total ?? 0),
      open: Number(stats?.open ?? 0),
      assigned: Number(stats?.assigned ?? 0),
      inProgress: Number(stats?.in_progress ?? 0),
    };
  } finally {
    db.close();
  }
}

async function assignTechnician(formData) {
  'use server';

  const reportId = Number(formData.get('reportId'));
  const technicianId = Number(formData.get('technicianId'));

  if (
    !Number.isInteger(reportId) ||
    reportId <= 0 ||
    !Number.isInteger(technicianId) ||
    technicianId <= 0
  ) {
    return;
  }

  const db = openDatabase();

  try {
    const assign = db.transaction(() => {
      const report = db
        .prepare(`
          SELECT
            id,
            status
          FROM reports
          WHERE id = ?
        `)
        .get(reportId);

      if (!report) {
        throw new Error('Report not found.');
      }

      const technician = db
        .prepare(`
          SELECT
            id,
            assigned_report
          FROM technicians
          WHERE id = ?
        `)
        .get(technicianId);

      if (!technician) {
        throw new Error('Technician not found.');
      }

      /*
       * Current database design only allows one
       * assigned_report value per technician.
       *
       * To avoid silently removing an existing job,
       * technicians with another assignment cannot
       * be assigned a new report here.
       */
      if (
        technician.assigned_report !== null &&
        Number(technician.assigned_report) !== reportId
      ) {
        throw new Error(
          'This technician already has an assigned report.'
        );
      }

      /*
       * Remove another technician from this report
       * if the report is being reassigned.
       */
      db.prepare(`
        UPDATE technicians
        SET assigned_report = NULL
        WHERE assigned_report = ?
          AND id != ?
      `).run(reportId, technicianId);

      db.prepare(`
        UPDATE technicians
        SET assigned_report = ?
        WHERE id = ?
      `).run(reportId, technicianId);

      /*
       * Assigning a technician changes an open report
       * to assigned. Existing progress/resolution
       * states are not moved backwards automatically.
       */
      if (report.status === 'open') {
        db.prepare(`
          UPDATE reports
          SET status = 'assigned'
          WHERE id = ?
        `).run(reportId);
      }
    });

    assign();
  } catch (error) {
    console.error(
      'Unable to assign technician:',
      error
    );
  } finally {
    db.close();
  }

  revalidatePath(
    '/admin_maintenance/maintenance_queue'
  );

  revalidatePath(
    '/admin_maintenance/admin_dashboard'
  );
}

async function updateReportStatus(formData) {
  'use server';

  const reportId = Number(formData.get('reportId'));
  const newStatus = formData.get('status');

  if (
    !Number.isInteger(reportId) ||
    reportId <= 0 ||
    !VALID_STATUSES.includes(newStatus)
  ) {
    return;
  }

  const db = openDatabase();

  try {
    const update = db
      .prepare(`
        UPDATE reports
        SET status = ?
        WHERE id = ?
      `)
      .run(newStatus, reportId);

    if (update.changes === 0) {
      console.error(
        `Report ${reportId} was not found.`
      );
    }

    /*
     * Once a report is resolved or closed,
     * remove it from the technician's active
     * assignment field.
     */
    if (
      newStatus === 'resolved' ||
      newStatus === 'closed'
    ) {
      db.prepare(`
        UPDATE technicians
        SET assigned_report = NULL
        WHERE assigned_report = ?
      `).run(reportId);
    }
  } catch (error) {
    console.error(
      'Unable to update report status:',
      error
    );
  } finally {
    db.close();
  }

  revalidatePath(
    '/admin_maintenance/maintenance_queue'
  );

  revalidatePath(
    '/admin_maintenance/admin_dashboard'
  );
}

export default async function MaintenanceQueue({
  searchParams,
}) {
  const params = await searchParams;

  const search =
    typeof params?.search === 'string'
      ? params.search.trim()
      : '';

  const status =
    typeof params?.status === 'string'
      ? params.status
      : '';

  let reports = [];
  let technicians = [];
  let stats = {
    total: 0,
    open: 0,
    assigned: 0,
    inProgress: 0,
  };

  let error = null;

  try {
    reports = getMaintenanceQueue(
      search,
      status
    );

    technicians = getTechnicians();

    stats = getQueueStats();
  } catch (databaseError) {
    console.error(
      'Maintenance queue database error:',
      databaseError
    );

    error =
      'Unable to load maintenance queue information from the database.';
  }

  return (
    <div className="admin-dashboard maintenance-queue">
      <div className="admin-dashboard-header">
        <div>
          <h1>Maintenance Queue</h1>

          <p>
            Review facility reports, assign technicians
            and manage maintenance progress.
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

          <h2>{stats.total}</h2>

          <span>All submitted reports</span>
        </div>

        <div className="admin-stat-card">
          <p>Open</p>

          <h2>{stats.open}</h2>

          <span>Waiting for review</span>
        </div>

        <div className="admin-stat-card">
          <p>Assigned</p>

          <h2>{stats.assigned}</h2>

          <span>Technician assigned</span>
        </div>

        <div className="admin-stat-card">
          <p>In Progress</p>

          <h2>{stats.inProgress}</h2>

          <span>Currently being worked on</span>
        </div>
      </section>

      <section className="admin-dashboard-section">
        <div className="admin-section-heading">
          <div>
            <h2>Fault Reports</h2>

            <p>
              Search and filter submitted maintenance reports.
            </p>
          </div>
        </div>

        <form
          method="GET"
          className="maintenance-filter-bar"
        >
          <div className="maintenance-search-group">
            <label htmlFor="maintenance-search">
              Search
            </label>

            <input
              id="maintenance-search"
              name="search"
              type="search"
              defaultValue={search}
              placeholder="Report ID, location, user or description"
            />
          </div>

          <div className="maintenance-filter-group">
            <label htmlFor="maintenance-status">
              Status
            </label>

            <select
              id="maintenance-status"
              name="status"
              defaultValue={status}
            >
              <option value="">
                All statuses
              </option>

              <option value="open">
                Open
              </option>

              <option value="assigned">
                Assigned
              </option>

              <option value="in_progress">
                In Progress
              </option>

              <option value="resolved">
                Resolved
              </option>

              <option value="closed">
                Closed
              </option>
            </select>
          </div>

          <button
            type="submit"
            className="maintenance-primary-button"
          >
            Apply Filters
          </button>

          <a
            href="/admin_maintenance/maintenance_queue"
            className="maintenance-secondary-button"
          >
            Clear
          </a>
        </form>

        <div className="maintenance-results-summary">
          Showing {reports.length}{' '}
          {reports.length === 1
            ? 'report'
            : 'reports'}
        </div>

        <div className="admin-table-container">
          {reports.length === 0 ? (
            <div className="admin-empty-state">
              No reports match the selected filters.
            </div>
          ) : (
            <table className="admin-report-table">
              <caption className="sr-only">
                Maintenance fault reports including
                submitting user, location, status and
                technician assignment.
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
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {reports.map((report) => {
                  const assignedTechnician =
                    technicians.find(
                      (technician) =>
                        technician.id ===
                        report.technician_id
                    );

                  return (
                    <tr key={report.id}>
                      <td className="admin-report-id">
                        #{report.id}
                      </td>

                      <td>
                        <div className="maintenance-user-cell">
                          <strong>
                            {report.username}
                          </strong>

                          <span>
                            {report.email}
                          </span>
                        </div>
                      </td>

                      <td>
                        {report.location}
                      </td>

                      <td className="admin-description-cell">
                        {report.description}
                      </td>

                      <td>
                        <span
                          className={`admin-status-badge status-${report.status}`}
                        >
                          {formatStatus(
                            report.status
                          )}
                        </span>
                      </td>

                      <td>
                        {assignedTechnician ? (
                          <div className="maintenance-technician-cell">
                            <strong>
                              {
                                assignedTechnician.name
                              }
                            </strong>

                            <span>
                              {assignedTechnician.specialisation ||
                                'General maintenance'}
                            </span>
                          </div>
                        ) : (
                          <span className="maintenance-unassigned">
                            Unassigned
                          </span>
                        )}
                      </td>

                      <td>
                        {formatDate(
                          report.created_at
                        )}
                      </td>

                      <td>
                        <div className="maintenance-actions">
                          <form
                            action={
                              assignTechnician
                            }
                            className="maintenance-inline-form"
                          >
                            <input
                              type="hidden"
                              name="reportId"
                              value={report.id}
                            />

                            <label
                              htmlFor={`technician-${report.id}`}
                              className="sr-only"
                            >
                              Assign technician to
                              report {report.id}
                            </label>

                            <select
                              id={`technician-${report.id}`}
                              name="technicianId"
                              defaultValue={
                                report.technician_id ||
                                ''
                              }
                              required
                            >
                              <option
                                value=""
                                disabled
                              >
                                Select technician
                              </option>

                              {technicians.map(
                                (technician) => {
                                  const busy =
                                    technician.assigned_report !==
                                      null &&
                                    Number(
                                      technician.assigned_report
                                    ) !==
                                      report.id;

                                  return (
                                    <option
                                      key={
                                        technician.id
                                      }
                                      value={
                                        technician.id
                                      }
                                      disabled={busy}
                                    >
                                      {
                                        technician.name
                                      }
                                      {technician.specialisation
                                        ? ` - ${technician.specialisation}`
                                        : ''}
                                      {busy
                                        ? ' (Assigned)'
                                        : ''}
                                    </option>
                                  );
                                }
                              )}
                            </select>

                            <button
                              type="submit"
                              className="maintenance-small-button"
                            >
                              Assign
                            </button>
                          </form>

                          <form
                            action={
                              updateReportStatus
                            }
                            className="maintenance-inline-form"
                          >
                            <input
                              type="hidden"
                              name="reportId"
                              value={report.id}
                            />

                            <label
                              htmlFor={`status-${report.id}`}
                              className="sr-only"
                            >
                              Update status for
                              report {report.id}
                            </label>

                            <select
                              id={`status-${report.id}`}
                              name="status"
                              defaultValue={
                                report.status
                              }
                            >
                              {VALID_STATUSES.map(
                                (
                                  statusOption
                                ) => (
                                  <option
                                    key={
                                      statusOption
                                    }
                                    value={
                                      statusOption
                                    }
                                  >
                                    {formatStatus(
                                      statusOption
                                    )}
                                  </option>
                                )
                              )}
                            </select>

                            <button
                              type="submit"
                              className="maintenance-small-button"
                            >
                              Update
                            </button>
                          </form>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </section>
    </div>
  );
}