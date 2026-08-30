import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import Database from 'better-sqlite3';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.join(__dirname, 'cffr.db');

const db = new Database(dbPath);

const hashPassword = (value = '') =>
  createHash('sha256').update(String(value)).digest('hex');

const schemaPath = path.join(__dirname, 'schema.sql');
const schemaSql = fs.readFileSync(schemaPath, 'utf8');
db.exec(schemaSql);

const adminHash = '8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918';
db.prepare(
  `UPDATE users
   SET password_hash = ?
   WHERE username = 'admin' OR email = 'admin@campus.edu'`
).run(adminHash);

db.function('hash_password', (value) => hashPassword(value));

export function insertUser({ username, email, password, role }) {
  return db
    .prepare(
      `INSERT INTO users (username, email, password_hash, role)
       VALUES (?, ?, ?, ?)`
    )
    .run(username, email, hashPassword(password), role);
}

export function insertTechnician({ userId, name, specialisation = null, assignedReport = null }) {
  return db
    .prepare(
      `INSERT INTO technicians (user_id, name, specialisation, assigned_report)
       VALUES (?, ?, ?, ?)`
    )
    .run(userId, name, specialisation, assignedReport);
}

export function createTechnicianAccount({ username, email, password, name, specialisation = null }) {
  return db.transaction(() => {
    const user = insertUser({
      username,
      email,
      password,
      role: 'technician',
    });

    insertTechnician({
      userId: Number(user.lastInsertRowid),
      name,
      specialisation,
      assignedReport: null,
    });

    return { id: Number(user.lastInsertRowid) };
  })();
}

export function updateUserPassword(userId, plainPassword) {
  return db
    .prepare(`UPDATE users SET password_hash = ? WHERE id = ?`)
    .run(hashPassword(plainPassword), userId);
}

export function insertReport({ userId, description, location, imagePath = null, status = 'open' }) {
  return db
    .prepare(
      `INSERT INTO reports (user_id, description, location, image_path, status, created_at)
       VALUES (?, ?, ?, ?, ?, datetime('now'))`
    )
    .run(userId, description, location, imagePath, status);
}

export function getReportsForUser({ userId, role }) {
  if (role && role !== 'student') {
    return db
      .prepare(
        `SELECT r.id, r.user_id AS userId, r.description, r.location, r.image_path AS imagePath,
                r.status, r.created_at AS createdAt, u.username, u.email, u.role
         FROM reports r
         INNER JOIN users u ON u.id = r.user_id
         ORDER BY r.created_at DESC`
      )
      .all();
  }

  return db
    .prepare(
      `SELECT r.id, r.user_id AS userId, r.description, r.location, r.image_path AS imagePath,
              r.status, r.created_at AS createdAt, u.username, u.email, u.role
       FROM reports r
       INNER JOIN users u ON u.id = r.user_id
       WHERE r.user_id = ?
       ORDER BY r.created_at DESC`
    )
    .all(userId);
}

export { hashPassword };
export default db;