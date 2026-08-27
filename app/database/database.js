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

export function updateUserPassword(userId, plainPassword) {
  return db
    .prepare(`UPDATE users SET password_hash = ? WHERE id = ?`)
    .run(hashPassword(plainPassword), userId);
}

export { hashPassword };
export default db;