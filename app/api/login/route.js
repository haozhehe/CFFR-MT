import { createHash } from 'node:crypto';
import db from '../../database/database';

export async function POST(request) {
  try {
    const { email = '', username = '', password = '' } = await request.json();

    if (!password || (!email && !username)) {
      return Response.json(
        { error: 'The details may be incorrect.' },
        { status: 401 }
      );
    }

    const passwordHash = createHash('sha256').update(password).digest('hex');

    const user = db
      .prepare(
        `SELECT id, username, email, role
         FROM users
         WHERE (email = ? OR username = ?) AND password_hash = ?`
      )
      .get(email || username, username || email, passwordHash);

    if (!user) {
      return Response.json(
        { error: 'The details may be incorrect.' },
        { status: 401 }
      );
    }

    return Response.json({ success: true, user });
  } catch (error) {
    return Response.json(
      { error: 'The details may be incorrect.' },
      { status: 401 }
    );
  }
}
