import { createHash, randomBytes } from 'node:crypto';

export const COOKIE_NAME = 'cffr_workflow_session';
export const SESSION_SECONDS = 12 * 60 * 60;

function tokenHash(token) {
  return createHash('sha256').update(token).digest('hex');
}

function readToken(request) {
  const cookie = (request.headers.get('cookie') || '').split(';')
    .map((part) => part.trim()).find((part) => part.startsWith(`${COOKIE_NAME}=`));
  return cookie ? cookie.slice(COOKIE_NAME.length + 1) : '';
}

export function removeSession(db, request) {
  const token = readToken(request);
  if (token) db.prepare('DELETE FROM workflow_sessions WHERE token_hash = ?').run(tokenHash(token));
}

export function createSession(db, userId) {
  const token = randomBytes(32).toString('hex');
  db.prepare('DELETE FROM workflow_sessions WHERE expires_at <= ?').run(Date.now());
  db.prepare('INSERT INTO workflow_sessions (token_hash, user_id, expires_at) VALUES (?, ?, ?)')
    .run(tokenHash(token), userId, Date.now() + SESSION_SECONDS * 1000);
  return token;
}

export function sessionCookie(token, request) {
  const secure = new URL(request.url).protocol === 'https:' ? '; Secure' : '';
  return `${COOKIE_NAME}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${token ? SESSION_SECONDS : 0}${secure}`;
}

export function currentUser(db, request) {
  const token = readToken(request);
  if (!/^[a-f0-9]{64}$/.test(token)) return null;
  return db.prepare(`
    SELECT u.id, u.username, u.role FROM workflow_sessions s
    JOIN users u ON u.id = s.user_id
    WHERE s.token_hash = ? AND s.expires_at > ?
  `).get(tokenHash(token), Date.now()) || null;
}

export function sameOrigin(request) {
  try {
    const value = request.headers.get('origin');
    if (!value) return false;
    const origin = new URL(value);
    const url = new URL(request.url);
    // Next.js preserves the browser's host/protocol in forwarded headers when rewriting.
    const host = request.headers.get('x-forwarded-host') || request.headers.get('host') || url.host;
    const protocol = request.headers.get('x-forwarded-proto') || url.protocol.replace(':', '');
    return value === origin.origin && origin.host === host && origin.protocol === `${protocol}:`;
  } catch {
    return false;
  }
}
