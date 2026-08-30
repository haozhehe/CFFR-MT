import fs from 'node:fs';
import path from 'node:path';
import db, { insertReport, getReportsForUser } from '../../database/database';

const UPLOADS_DIR = path.join(process.cwd(), 'public', 'uploads');

if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

function normalizeReport(row) {
  if (!row) return null;

  return {
    id: Number(row.id),
    userId: Number(row.userId ?? row.user_id),
    description: row.description,
    location: row.location,
    imagePath: row.imagePath ?? row.image_path ?? null,
    status: row.status,
    createdAt: row.createdAt ?? row.created_at,
    username: row.username ?? null,
    email: row.email ?? null,
    role: row.role ?? null,
  };
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const role = searchParams.get('role') || 'student';

    if (!userId) {
      return Response.json(
        { error: 'User information is required.' },
        { status: 400 }
      );
    }

    const rows = getReportsForUser({
      userId: Number(userId),
      role,
    });

    return Response.json({
      reports: rows.map(normalizeReport).filter(Boolean),
    });
  } catch (error) {
    return Response.json(
      { error: 'Unable to load reports from the database.' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const contentType = request.headers.get('content-type') || '';
    let userId = null;
    let location = '';
    let description = '';
    let savedImagePath = null;

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      const file = formData.get('image');
      userId = formData.get('userId');
      location = formData.get('location') || '';
      description = formData.get('description') || '';

      if (file && typeof file === 'object' && file.name) {
        const fileExt = path.extname(file.name).toLowerCase() || '.png';
        const safeName = `${Date.now()}-${Math.random().toString(36).slice(2)}${fileExt}`;
        const destination = path.join(UPLOADS_DIR, safeName);
        const buffer = Buffer.from(await file.arrayBuffer());
        fs.writeFileSync(destination, buffer);
        savedImagePath = `/uploads/${safeName}`;
      }
    } else {
      const payload = await request.json();
      userId = payload.userId;
      location = payload.location || '';
      description = payload.description || '';
      savedImagePath = payload.imagePath || null;
    }

    if (!userId || !location || !description) {
      return Response.json(
        { error: 'Location and description are required.' },
        { status: 400 }
      );
    }

    const result = insertReport({
      userId: Number(userId),
      location: String(location).trim(),
      description: String(description).trim(),
      imagePath: savedImagePath ? String(savedImagePath).trim() : null,
      status: 'open',
    });

    const savedReport = db
      .prepare(
        `SELECT id, user_id AS userId, description, location, image_path AS imagePath,
                status, created_at AS createdAt
         FROM reports
         WHERE id = ?`
      )
      .get(result.lastInsertRowid);

    return Response.json({
      success: true,
      report: normalizeReport(savedReport),
    });
  } catch (error) {
    return Response.json(
      { error: 'Unable to save the report to the database.' },
      { status: 500 }
    );
  }
}
