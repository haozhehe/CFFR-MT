-- New tables only. The original users, reports and technicians tables stay intact.
CREATE TABLE workflow_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  report_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  kind TEXT NOT NULL,
  status TEXT,
  technician_name TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  read_at TEXT
);

CREATE TABLE workflow_jobs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  report_id INTEGER NOT NULL,
  technician_id INTEGER NOT NULL,
  assigned_at TEXT,
  completed_at TEXT,
  completed_status TEXT,
  released_at TEXT
);

CREATE TABLE workflow_sessions (
  token_hash TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL,
  expires_at INTEGER NOT NULL
);

CREATE INDEX workflow_events_owner ON workflow_events(user_id, id);
CREATE INDEX workflow_events_report ON workflow_events(report_id, id);
CREATE INDEX workflow_jobs_technician ON workflow_jobs(technician_id, report_id);

-- Existing reports have no old change history. Record a snapshot, not invented events.
INSERT INTO workflow_events (report_id, user_id, kind, status, read_at)
SELECT id, user_id, 'snapshot', status, datetime('now') FROM reports;

-- The original database does not record when existing jobs were assigned.
INSERT INTO workflow_jobs (report_id, technician_id)
SELECT assigned_report, id FROM technicians WHERE assigned_report IS NOT NULL;

-- Triggers capture changes made by the existing pages without editing those pages.
CREATE TRIGGER workflow_report_created AFTER INSERT ON reports
BEGIN
  INSERT INTO workflow_events (report_id, user_id, kind, status, created_at)
  VALUES (NEW.id, NEW.user_id, 'submitted', NEW.status, NEW.created_at);
END;

CREATE TRIGGER workflow_report_status AFTER UPDATE OF status ON reports
WHEN OLD.status IS NOT NEW.status
BEGIN
  INSERT INTO workflow_events (report_id, user_id, kind, status)
  VALUES (NEW.id, NEW.user_id, 'status', NEW.status);

  -- Capture the technician before the existing code clears assigned_report.
  UPDATE workflow_jobs
  SET completed_at = datetime('now'), completed_status = NEW.status
  WHERE report_id = NEW.id AND released_at IS NULL AND completed_at IS NULL
    AND NEW.status IN ('resolved', 'closed')
    AND OLD.status NOT IN ('resolved', 'closed');
END;

CREATE TRIGGER workflow_assignment_changed AFTER UPDATE OF assigned_report ON technicians
WHEN OLD.assigned_report IS NOT NEW.assigned_report
BEGIN
  UPDATE workflow_jobs SET released_at = datetime('now')
  WHERE technician_id = NEW.id AND report_id = OLD.assigned_report
    AND released_at IS NULL;

  INSERT INTO workflow_events (report_id, user_id, kind, status, technician_name)
  SELECT id, user_id, 'unassigned', status, OLD.name FROM reports
  WHERE id = OLD.assigned_report AND status NOT IN ('resolved', 'closed');

  INSERT INTO workflow_jobs (report_id, technician_id, assigned_at)
  SELECT NEW.assigned_report, NEW.id, datetime('now')
  WHERE NEW.assigned_report IS NOT NULL;

  INSERT INTO workflow_events (report_id, user_id, kind, status, technician_name)
  SELECT id, user_id, 'assigned', status, NEW.name FROM reports
  WHERE id = NEW.assigned_report;
END;

CREATE TRIGGER workflow_technician_created AFTER INSERT ON technicians
WHEN NEW.assigned_report IS NOT NULL
BEGIN
  INSERT INTO workflow_jobs (report_id, technician_id, assigned_at)
  VALUES (NEW.assigned_report, NEW.id, datetime('now'));
  INSERT INTO workflow_events (report_id, user_id, kind, status, technician_name)
  SELECT id, user_id, 'assigned', status, NEW.name FROM reports
  WHERE id = NEW.assigned_report;
END;

CREATE TABLE workflow_migrations (version INTEGER PRIMARY KEY);
INSERT INTO workflow_migrations VALUES (1);
