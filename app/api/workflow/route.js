import { openWorkflowDatabase } from '../../_workflow/database.js';
import { currentUser, sameOrigin } from '../../_workflow/session.js';
import { markRead, studentData, technicianData } from '../../_workflow/queries.js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function reply(data, status = 200) {
  return Response.json(data, { status, headers: { 'Cache-Control': 'no-store' } });
}

async function handle(request, update = false) {
  let db;
  try {
    db = openWorkflowDatabase();
    const user = currentUser(db, request);
    if (!user) return reply({ error: 'Please sign in again to view your reports and jobs.' }, 401);
    // Prevent stale browser account details from displaying a different session's data.
    const browserUser = request.headers.get('x-workflow-user');
    if (browserUser && browserUser !== String(user.id)) {
      return reply({ error: 'Your account has changed. Please sign in again.' }, 401);
    }
    if (!['student', 'staff', 'technician'].includes(user.role)) {
      return reply({ error: 'This page is not available for your role.' }, 403);
    }
    if (update) {
      if (!sameOrigin(request)) return reply({ error: 'Invalid request origin.' }, 403);
      if (!['student', 'staff'].includes(user.role)) return reply({ error: 'Access denied.' }, 403);
      let body;
      try { body = await request.json(); } catch { return reply({ error: 'Invalid request.' }, 400); }
      const id = body?.eventId;
      if (id !== 'all' && (!Number.isSafeInteger(id) || id <= 0)) return reply({ error: 'Invalid notification.' }, 400);
      const result = markRead(db, user.id, id);
      if (id !== 'all' && !result.changes) return reply({ error: 'Notification not found.' }, 404);
    }
    return reply({ user, ...(user.role === 'technician' ? technicianData(db, user.id) : studentData(db, user.id)) });
  } catch (error) {
    console.error('Unable to load workflow data:', error.message);
    return reply({ error: 'Unable to load your information. Please try again.' }, 500);
  } finally {
    db?.close();
  }
}

export function GET(request) { return handle(request); }
export function POST(request) { return handle(request, true); }
