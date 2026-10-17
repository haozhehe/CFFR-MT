export function studentData(db, userId) {
  const reports = db.prepare(`
    SELECT r.*, t.name AS technician_name FROM reports r
    LEFT JOIN technicians t ON t.assigned_report = r.id
    WHERE r.user_id = ? ORDER BY r.id DESC
  `).all(userId);
  const events = db.prepare(`
    SELECT e.*, r.location FROM workflow_events e
    JOIN reports r ON r.id = e.report_id
    WHERE e.user_id = ? AND r.user_id = ? ORDER BY e.id DESC
  `).all(userId, userId);
  return { reports, events };
}

export function technicianData(db, userId) {
  const technician = db.prepare('SELECT id, name FROM technicians WHERE user_id = ?').get(userId);
  if (!technician) return { technician: null, assigned: [], completed: [] };
  const assigned = db.prepare(`
    SELECT r.*, u.username AS submitted_by, j.assigned_at,
      n.note AS admin_note
    FROM technicians t
    JOIN reports r ON r.id = t.assigned_report
    JOIN users u ON u.id = r.user_id
    LEFT JOIN workflow_jobs j ON j.technician_id = t.id AND j.report_id = r.id
      AND j.released_at IS NULL
    LEFT JOIN report_notes n ON n.report_id = r.id
    WHERE t.id = ? AND r.status NOT IN ('resolved', 'closed')
    ORDER BY r.id DESC
  `).all(technician.id);
  const completed = db.prepare(`
    SELECT r.*, u.username AS submitted_by, j.id AS job_id,
      j.assigned_at, j.completed_at, j.completed_status,
      n.note AS admin_note
    FROM workflow_jobs j JOIN reports r ON r.id = j.report_id
    JOIN users u ON u.id = r.user_id
    LEFT JOIN report_notes n ON n.report_id = r.id
    WHERE j.technician_id = ? AND j.completed_at IS NOT NULL
    ORDER BY j.completed_at DESC, j.id DESC
  `).all(technician.id);
  return { technician, assigned, completed };
}

export function markRead(db, userId, eventId) {
  if (eventId === 'all') {
    return db.prepare(`UPDATE workflow_events SET read_at = datetime('now')
      WHERE user_id = ? AND read_at IS NULL AND kind != 'snapshot'`).run(userId);
  }
  return db.prepare(`UPDATE workflow_events SET read_at = COALESCE(read_at, datetime('now'))
    WHERE user_id = ? AND id = ? AND kind != 'snapshot'`).run(userId, eventId);
}
