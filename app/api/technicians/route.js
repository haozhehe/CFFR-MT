import { createTechnicianAccount } from '../../database/database';

export async function POST(request) {
  try {
    const { username = '', email = '', password = '', name = '', specialisation = '' } = await request.json();

    if (!username || !email || !password || !name) {
      return Response.json(
        { error: 'Please fill in username, email, password and full name.' },
        { status: 400 }
      );
    }

    const trimmedUsername = String(username).trim();
    const trimmedEmail = String(email).trim().toLowerCase();
    const trimmedName = String(name).trim();
    const trimmedSpecialisation = String(specialisation || '').trim();

    const existing = (await import('../../database/database')).default
      .prepare(`SELECT id FROM users WHERE username = ? OR email = ?`)
      .get(trimmedUsername, trimmedEmail);

    if (existing) {
      return Response.json(
        { error: 'A user with that username or email already exists.' },
        { status: 409 }
      );
    }

    createTechnicianAccount({
      username: trimmedUsername,
      email: trimmedEmail,
      password,
      name: trimmedName,
      specialisation: trimmedSpecialisation || null,
    });

    return Response.json({ success: true });
  } catch (error) {
    return Response.json(
      { error: 'Unable to create technician account.' },
      { status: 500 }
    );
  }
}
