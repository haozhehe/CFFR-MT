import Database from 'better-sqlite3';
import fs from 'node:fs';
import path from 'node:path';
import { installWorkflow } from './migrate.js';

export function openWorkflowDatabase() {
  const file = path.join(process.cwd(), 'app', 'database', 'cffr.db');
  const db = new Database(file, { fileMustExist: true, timeout: 5000 });
  try {
    const installed = db.prepare(
      "SELECT name FROM sqlite_master WHERE name = 'workflow_migrations'"
    ).get();
    if (!installed) {
      // Keep a consistent database backup before adding history tables.
      const backup = path.join(process.cwd(), 'app', 'database', 'cffr.before-workflow.db');
      if (!fs.existsSync(backup)) db.prepare('VACUUM INTO ?').run(backup);
      installWorkflow(db);
    }
    return db;
  } catch (error) {
    db.close();
    throw error;
  }
}
