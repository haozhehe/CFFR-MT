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

/*
 * Technicians can only move an assigned task through
 * these workflow states.
 *
 * "open" is for reports that have not been assigned.
 * "closed" can remain an admin/maintenance action.
 */
const TECHNICIAN_STATUSES = [
  'assigned',
  'in_progress',
  'resolved',
];

function openDatabase(options = {}) {
  return new Database(DATABASE_PATH, options);
}

function formatStatus(status) {
  switch (status) {
    case 'assigned':
      return 'Assigned';

    case 'in_progress':
      return 'In Progress';

    case 'resolved':
      return 'Resolved';

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

/*
 * For the current prototype we use technicianId from
 * the URL so the page can be tested without assuming
 * how your authentication system stores the logged-in user.
 *
 * Example:
 * /technician/notifications?technicianId=1
 *
 * If no technicianId is provided, the first technician
 * in the database is used.
 */
function getTechnician(technicianId) {
  const db = openDatabase({
    readonly: true,
  });

  try {
    let technician;

    if (technicianId) {
      technician = db
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

          WHERE technicians.id = ?
        `)
        .get(technicianId);
    } else {
      technician = db
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

          ORDER BY technicians.id ASC

          LIMIT 1
        `)
        .get();
    }

    return technician || null;
  } finally {
    db.close();
  }
}

function getAssignedTask(technicianId) {
  const db = openDatabase({
    readonly: true,
  });

  try {
    return (
      db
        .prepare(`
          SELECT
            reports.id,
            reports.description,
            reports.location,
            reports.image_path,
            reports.status,
            reports.created_at,

            users.username AS submitted_by,
            users.email AS submitter_email

          FROM technicians

          INNER JOIN reports
            ON technicians.assigned_report = reports.id

          INNER JOIN users
            ON reports.user_id = users.id

          WHERE technicians.id = ?
        `)
        .get(technicianId) || null
    );
  } finally {
    db.close();
  }
}

async function updateTaskStatus(formData) {
  'use server';

  const reportId = Number(
    formData.get('reportId')
  );

  const technicianId = Number(
    formData.get('technicianId')
  );

  const newStatus = formData.get('status');

  if (
    !Number.isInteger(reportId) ||
    reportId <= 0 ||
    !Number.isInteger(technicianId) ||
    technicianId <= 0 ||
    !TECHNICIAN_STATUSES.includes(newStatus)
  ) {
    return;
  }

  const db = openDatabase();

  try {
    const updateStatus = db.transaction(() => {
      /*
       * Verify that this report is actually assigned
       * to the technician before allowing an update.
       */
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
        throw new Error(
          'Technician not found.'
        );
      }

      if (
        Number(technician.assigned_report) !==
        reportId
      ) {
        throw new Error(
          'This report is not assigned to this technician.'
        );
      }

      db.prepare(`
        UPDATE reports

        SET status = ?

        WHERE id = ?
      `).run(
        newStatus,
        reportId
      );

      /*
       * Once resolved, remove the task from the
       * technician's active assignment.
       */
      if (newStatus === 'resolved') {
        db.prepare(`
          UPDATE technicians

          SET assigned_report = NULL

          WHERE id = ?
            AND assigned_report = ?
        `).run(
          technicianId,
          reportId
        );
      }
    });

    updateStatus();
  } catch (error) {
    console.error(
      'Unable to update technician task:',
      error
    );
  } finally {
    db.close();
  }

  revalidatePath(
    '/technician/notifications'
  );

  revalidatePath(
    '/technician/assigned'
  );

  revalidatePath(
    '/technician/completed'
  );

  revalidatePath(
    '/admin_maintenance/admin_dashboard'
  );

  revalidatePath(
    '/admin_maintenance/maintenance_queue'
  );
}

export default async function TechnicianNotifications({
  searchParams,
}) {
  const params = await searchParams;

  const requestedTechnicianId =
    typeof params?.technicianId === 'string'
      ? Number(params.technicianId)
      : null;

  let technician = null;
  let assignedTask = null;
  let error = null;

  try {
    technician = getTechnician(
      Number.isInteger(requestedTechnicianId)
        ? requestedTechnicianId
        : null
    );

    if (technician) {
      assignedTask = getAssignedTask(
        technician.id
      );
    }
  } catch (databaseError) {
    console.error(
      'Technician notifications database error:',
      databaseError
    );

    error =
      'Unable to load technician notifications from the database.';
  }

  return (
    <div className="technician-notifications-page">
      <div className="technician-page-header">
        <div>
          <h1>Notifications</h1>

          <p>
            View newly assigned maintenance tasks
            and update their progress.
          </p>
        </div>
      </div>

      {error && (
        <div className="admin-error-message">
          {error}
        </div>
      )}

      {!technician && !error && (
        <section className="technician-empty-card">
          <h2>No Technician Found</h2>

          <p>
            There are currently no technician
            accounts available in the database.
          </p>
        </section>
      )}

      {technician && (
        <>
          <section className="technician-profile-card">
            <div>
              <span className="technician-profile-label">
                Technician
              </span>

              <h2>
                {technician.name}
              </h2>

              <p>
                {technician.specialisation ||
                  'General Maintenance'}
              </p>
            </div>

            <div className="technician-profile-account">
              <span>
                {technician.username}
              </span>

              <span>
                {technician.email}
              </span>
            </div>
          </section>

          <section className="technician-notification-section">
            <div className="technician-section-heading">
              <div>
                <h2>
                  New Assigned Task
                </h2>

                <p>
                  Maintenance tasks currently
                  assigned to you.
                </p>
              </div>

              {assignedTask && (
                <span className="technician-notification-count">
                  1 New
                </span>
              )}
            </div>

            {!assignedTask ? (
              <div className="technician-empty-state">
                <div className="technician-empty-icon">
                  ✓
                </div>

                <h3>
                  No new assigned tasks
                </h3>

                <p>
                  You currently have no active
                  maintenance assignments.
                </p>
              </div>
            ) : (
              <article className="technician-task-card">
                <div className="technician-task-header">
                  <div>
                    <span className="technician-task-reference">
                      Report #{assignedTask.id}
                    </span>

                    <h3>
                      {assignedTask.location}
                    </h3>
                  </div>

                  <span
                    className={`admin-status-badge status-${assignedTask.status}`}
                  >
                    {formatStatus(
                      assignedTask.status
                    )}
                  </span>
                </div>

                <div className="technician-task-details">
                  <div className="technician-task-detail">
                    <span>
                      Description
                    </span>

                    <p>
                      {
                        assignedTask.description
                      }
                    </p>
                  </div>

                  <div className="technician-task-detail">
                    <span>
                      Submitted By
                    </span>

                    <p>
                      {assignedTask.submitted_by}
                    </p>

                    <small>
                      {
                        assignedTask.submitter_email
                      }
                    </small>
                  </div>

                  <div className="technician-task-detail">
                    <span>
                      Submitted
                    </span>

                    <p>
                      {formatDate(
                        assignedTask.created_at
                      )}
                    </p>
                  </div>
                </div>

                {assignedTask.image_path && (
                  <div className="technician-image-note">
                    An image was attached to
                    this report.
                  </div>
                )}

                <div className="technician-task-actions">
                  <div>
                    <h4>
                      Update Task Status
                    </h4>

                    <p>
                      Change the task status as
                      maintenance work progresses.
                    </p>
                  </div>

                  <form
                    action={updateTaskStatus}
                    className="technician-status-form"
                  >
                    <input
                      type="hidden"
                      name="reportId"
                      value={assignedTask.id}
                    />

                    <input
                      type="hidden"
                      name="technicianId"
                      value={technician.id}
                    />

                    <label
                      htmlFor="technician-task-status"
                      className="sr-only"
                    >
                      Update task status
                    </label>

                    <select
                      id="technician-task-status"
                      name="status"
                      defaultValue={
                        assignedTask.status
                      }
                    >
                      {TECHNICIAN_STATUSES.map(
                        (status) => (
                          <option
                            key={status}
                            value={status}
                          >
                            {formatStatus(
                              status
                            )}
                          </option>
                        )
                      )}
                    </select>

                    <button
                      type="submit"
                      className="technician-update-button"
                    >
                      Update Status
                    </button>
                  </form>
                </div>
              </article>
            )}
          </section>
        </>
      )}
    </div>
  );
}