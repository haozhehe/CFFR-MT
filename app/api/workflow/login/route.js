import { POST as existingLogin } from '../../login/route.js';
import { openWorkflowDatabase } from '../../../_workflow/database.js';
import { createSession, removeSession, sameOrigin, sessionCookie } from '../../../_workflow/session.js';

export const runtime = 'nodejs';

export async function POST(request) {
  if (!sameOrigin(request)) return Response.json({ error: 'Invalid request origin.' }, { status: 403 });
  let db;
  try {
    const response = await existingLogin(request);
    const result = await response.json();
    db = openWorkflowDatabase();
    removeSession(db, request);
    const token = response.ok && result.success ? createSession(db, result.user.id) : '';
    return Response.json(result, {
      status: response.status,
      headers: { 'Set-Cookie': sessionCookie(token, request), 'Cache-Control': 'no-store' },
    });
  } catch {
    return Response.json({ error: 'Unable to sign in. Please try again.' }, {
      status: 500, headers: { 'Set-Cookie': sessionCookie('', request) },
    });
  } finally {
    db?.close();
  }
}
