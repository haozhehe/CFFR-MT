import fs from 'node:fs';
import path from 'node:path';

export function installWorkflow(db) {
  // Run once, even when several requests open the database together.
  db.exec('BEGIN IMMEDIATE');
  try {
    const installed = db.prepare(
      "SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'workflow_migrations'"
    ).get();
    if (!installed) {
      const file = path.join(process.cwd(), 'app', '_workflow', 'schema.sql');
      db.exec(fs.readFileSync(file, 'utf8'));
    }
    db.exec('COMMIT');
  } catch (error) {
    db.exec('ROLLBACK');
    throw error;
  }
}
