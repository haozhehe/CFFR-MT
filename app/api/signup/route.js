import db, { insertUser } from '../../database/database';

export async function POST(request) {
  try {
    const { username = '', email = '', password = '' } = await request.json();

    if (!username || !email || !password) {
      return Response.json(
        { error: 'Please complete all fields.' },
        { status: 400 }
      );
    }

    const existingUser = db
      .prepare(
        `SELECT id FROM users WHERE username = ? OR email = ?`
      )
      .get(username.trim(), email.trim().toLowerCase());

    if (existingUser) {
      return Response.json(
        { error: 'An account with that username or email already exists.' },
        { status: 409 }
      );
    }

    insertUser({
      username: username.trim(),
      email: email.trim().toLowerCase(),
      password,
      role: 'student',
    });

    return Response.json({ success: true });
  } catch (error) {
    return Response.json(
      { error: 'Unable to create your account.' },
      { status: 500 }
    );
  }
}