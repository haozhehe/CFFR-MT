// Run from the project folder: node --test tests/workflow.test.js (Node 22.13+).
// These tests use disposable in-memory databases, never the project's cffr.db.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import { installWorkflow } from '../app/_workflow/migrate.js';
import { studentData, technicianData, markRead } from '../app/_workflow/queries.js';
import { createSession, currentUser, removeSession, sameOrigin, sessionCookie } from '../app/_workflow/session.js';
import { filterReports, eventMessage, formatDate } from '../app/_workflow/display.js';

function database(t, install = true) {
  const db = new DatabaseSync(':memory:');
  t.after(() => db.close());
  db.exec(fs.readFileSync('app/database/schema.sql', 'utf8'));
  db.exec(`
    INSERT INTO users(id,username,email,password_hash,role) VALUES
      (2,'student-one','one@test.local','test','student'),
      (3,'student-two','two@test.local','test','student'),
      (4,'staff-one','staff@test.local','test','staff'),
      (5,'tech-one','tech-one@test.local','test','technician'),
      (6,'tech-two','tech-two@test.local','test','technician');
    INSERT INTO technicians(id,user_id,name) VALUES (1,5,'Technician One'),(2,6,'Technician Two');
    INSERT INTO reports(id,user_id,description,location) VALUES
      (101,2,'Broken light','Building A'),(102,3,'Broken desk','Building B'),(103,4,'Broken window','Building C');
  `);
  if (install) installWorkflow(db);
  return db;
}

function assign(db, report = 101, technician = 1) {
  db.prepare('UPDATE technicians SET assigned_report = ? WHERE id = ?').run(report, technician);
  db.prepare("UPDATE reports SET status = 'assigned' WHERE id = ? AND status = 'open'").run(report);
}

function resolve(db, report = 101) {
  db.prepare("UPDATE reports SET status = 'resolved' WHERE id = ?").run(report);
  db.prepare('UPDATE technicians SET assigned_report = NULL WHERE assigned_report = ?').run(report);
}

function request(token = '', options = {}) {
  return new Request('http://localhost/api/workflow', {
    headers: { cookie: `cffr_workflow_session=${token}`, ...options },
  });
}

test('installation keeps every existing user, report and technician unchanged', (t) => {
  const db = database(t, false);
  const snapshot = () => ['users','reports','technicians'].map((table) => db.prepare(`SELECT * FROM ${table}`).all());
  const before = snapshot();
  installWorkflow(db);
  assert.deepEqual(snapshot(), before);
});

test('installing twice does not duplicate snapshots or assignments', (t) => {
  const db = database(t, false);
  db.exec('UPDATE technicians SET assigned_report = 101 WHERE id = 1');
  installWorkflow(db);
  installWorkflow(db);
  assert.equal(db.prepare('SELECT COUNT(*) AS n FROM workflow_events').get().n, 3);
  assert.equal(db.prepare('SELECT COUNT(*) AS n FROM workflow_jobs').get().n, 1);
  assert.equal(technicianData(db, 5).assigned[0].assigned_at, null);
});

test('historical completion without a technician link is not invented', (t) => {
  const db = database(t, false);
  db.exec("UPDATE reports SET status = 'resolved' WHERE id = 101");
  installWorkflow(db);
  assert.equal(technicianData(db, 5).completed.length, 0);
  assert.equal(studentData(db, 2).events[0].kind, 'snapshot');
});

test('new submissions and real status changes create distinct events', (t) => {
  const db = database(t);
  db.exec("INSERT INTO reports(id,user_id,description,location) VALUES (104,2,'Door stuck','Building D')");
  db.exec("UPDATE reports SET status = 'in_progress' WHERE id = 104");
  db.exec("UPDATE reports SET status = 'in_progress' WHERE id = 104");
  const events = studentData(db, 2).events.filter((event) => event.report_id === 104);
  assert.deepEqual(events.map((event) => event.kind), ['status', 'submitted']);
});

test('existing assignment and resolution SQL preserves the technician completion', (t) => {
  const db = database(t);
  assign(db);
  assert.equal(technicianData(db, 5).assigned[0].id, 101);
  assert.equal(technicianData(db, 6).assigned.length, 0);
  db.exec("UPDATE reports SET status = 'in_progress' WHERE id = 101");
  resolve(db);
  const jobs = technicianData(db, 5);
  assert.equal(jobs.assigned.length, 0);
  assert.equal(jobs.completed[0].id, 101);
  assert.ok(jobs.completed[0].completed_at);
  assert.equal(technicianData(db, 6).completed.length, 0);
});

test('admin notes are returned to assigned technicians, not student or staff report data', (t) => {
  const db = database(t);
  assign(db);
  db.prepare('INSERT INTO report_notes (report_id, note) VALUES (?, ?)')
    .run(101, 'Check the isolation switch before repair.');

  const technicianJob = technicianData(db, 5).assigned[0];
  const studentReport = studentData(db, 2).reports[0];
  const staffReport = studentData(db, 4).reports[0];

  assert.equal(technicianJob.admin_note, 'Check the isolation switch before repair.');
  assert.equal(Object.hasOwn(studentReport, 'admin_note'), false);
  assert.equal(Object.hasOwn(staffReport, 'admin_note'), false);
});

test('reassignment does not give completion credit to the previous technician', (t) => {
  const db = database(t);
  assign(db);
  db.exec('UPDATE technicians SET assigned_report = NULL WHERE id = 1');
  assign(db, 101, 2);
  resolve(db);
  assert.equal(technicianData(db, 5).completed.length, 0);
  assert.equal(technicianData(db, 6).completed.length, 1);
  assert.equal(studentData(db, 2).events.filter((event) => event.kind === 'assigned').length, 2);
});

test('closing an already resolved job does not duplicate its completion', (t) => {
  const db = database(t);
  assign(db); resolve(db);
  const date = technicianData(db, 5).completed[0].completed_at;
  db.exec("UPDATE reports SET status = 'closed' WHERE id = 101");
  const jobs = technicianData(db, 5).completed;
  assert.equal(jobs.length, 1);
  assert.equal(jobs[0].completed_at, date);
  assert.equal(jobs[0].completed_status, 'resolved');
  assert.equal(jobs[0].status, 'closed');
});

test('a reopened report can be completed again by a different technician', (t) => {
  const db = database(t);
  assign(db); resolve(db);
  db.exec("UPDATE reports SET status = 'open' WHERE id = 101");
  assign(db, 101, 2); resolve(db);
  assert.equal(technicianData(db, 5).completed.length, 1);
  assert.equal(technicianData(db, 6).completed.length, 1);
});

test('rollback removes history created inside a failed assignment transaction', (t) => {
  const db = database(t);
  const before = studentData(db, 2).events.length;
  db.exec('BEGIN'); assign(db); db.exec('ROLLBACK');
  assert.equal(studentData(db, 2).events.length, before);
  assert.equal(technicianData(db, 5).assigned.length, 0);
  assert.equal(db.prepare('SELECT COUNT(*) AS n FROM workflow_jobs').get().n, 0);
});

test('student and staff queries return only their own records and events', (t) => {
  const db = database(t);
  assert.deepEqual(studentData(db, 2).reports.map((r) => r.id), [101]);
  assert.deepEqual(studentData(db, 4).reports.map((r) => r.id), [103]);
  assert.ok(studentData(db, 2).events.every((event) => event.user_id === 2));
});

test('a user cannot mark another user notification as read', (t) => {
  const db = database(t);
  assign(db, 102);
  const event = studentData(db, 3).events.find((item) => item.kind === 'assigned');
  assert.equal(markRead(db, 2, event.id).changes, 0);
  assert.equal(studentData(db, 3).events.find((item) => item.id === event.id).read_at, null);
  markRead(db, 3, event.id);
  assert.ok(studentData(db, 3).events.find((item) => item.id === event.id).read_at);
});

test('mark all as read affects only the current user', (t) => {
  const db = database(t);
  assign(db, 101, 1); assign(db, 102, 2);
  markRead(db, 2, 'all');
  assert.ok(studentData(db, 2).events.every((event) => event.read_at));
  assert.ok(studentData(db, 3).events.some((event) => !event.read_at));
});

test('sessions use server identity and ignore supplied role or user headers', (t) => {
  const db = database(t);
  const token = createSession(db, 2);
  assert.equal(currentUser(db, request(token, { role: 'admin', userId: '1' })).id, 2);
  assert.equal(currentUser(db, request(token)).role, 'student');
  assert.equal(currentUser(db, request('forged')), null);
  assert.equal(currentUser(db, request()), null);
});

test('expired and removed sessions cannot be reused', (t) => {
  const db = database(t);
  const expired = createSession(db, 2);
  db.exec('UPDATE workflow_sessions SET expires_at = 1');
  assert.equal(currentUser(db, request(expired)), null);
  const token = createSession(db, 2);
  removeSession(db, request(token));
  assert.equal(currentUser(db, request(token)), null);
});

test('mutating requests require matching origin and HTTPS cookies are Secure', () => {
  assert.equal(sameOrigin(request('', { origin: 'http://localhost' })), true);
  assert.equal(sameOrigin(request('', { origin: 'https://another-site.example' })), false);
  assert.equal(sameOrigin(request()), false);
  assert.match(sessionCookie('token', new Request('https://example.test')), /; Secure$/);
  const rewritten = new Request('http://localhost:3109/api/workflow/login', {
    headers: { host: 'localhost:3109', 'x-forwarded-host': '127.0.0.1:3109', 'x-forwarded-proto': 'http', origin: 'http://127.0.0.1:3109' },
  });
  assert.equal(sameOrigin(rewritten), true);
  assert.equal(sameOrigin(request('', { origin: 'invalid' })), false);
});

test('report search combines text and status without changing source records', () => {
  const reports = [{ id: 1, location: 'Building A', description: 'Light', status: 'open' },
    { id: 2, location: 'Building A', description: 'Window', status: 'resolved' }];
  assert.equal(filterReports(reports, ' building a ', 'open').length, 1);
  assert.equal(filterReports(reports, '2')[0].id, 2);
  assert.equal(filterReports(reports, 'unknown').length, 0);
  assert.equal(reports.length, 2);
});

test('missing timestamps and baseline snapshots are labelled honestly', () => {
  assert.equal(formatDate(null), 'Not recorded');
  assert.equal(formatDate('invalid'), 'Not recorded');
  assert.match(eventMessage({ kind: 'snapshot', status: 'in_progress' }), /First recorded status: In Progress/);
});
