export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    // Start recording history before an existing page changes an assignment.
    const { openWorkflowDatabase } = await import('./app/_workflow/database.js');
    const db = openWorkflowDatabase();
    db.close();
  }
}
