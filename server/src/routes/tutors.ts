import { Router, Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import db from '../db/database';
import { authenticate, requireRole, AuthRequest } from '../middleware/auth';
import { upload } from '../middleware/upload';

const router = Router();

function getTutorById(id: number): any | null {
  const tutor = db.prepare(`
    SELECT t.*,
           ROUND(COALESCE(AVG(r.rating), 0), 1) as avg_rating,
           COUNT(DISTINCT r.id) as review_count
    FROM tutors t
    LEFT JOIN reviews r ON r.target_id = t.id AND r.target_type = 'tutor'
    WHERE t.id = ?
    GROUP BY t.id
  `).get(id) as any;

  if (!tutor) return null;

  tutor.images = db.prepare(
    'SELECT id, file_path FROM tutor_images WHERE tutor_id = ?'
  ).all(id) as any[];

  tutor.availability = db.prepare(
    'SELECT id, day_of_week, start_time, end_time FROM tutor_availability WHERE tutor_id = ? ORDER BY CASE day_of_week WHEN "Monday" THEN 1 WHEN "Tuesday" THEN 2 WHEN "Wednesday" THEN 3 WHEN "Thursday" THEN 4 WHEN "Friday" THEN 5 WHEN "Saturday" THEN 6 WHEN "Sunday" THEN 7 END'
  ).all(id) as any[];

  return tutor;
}

// GET /api/tutors/mine/profile
router.get('/mine/profile', authenticate, requireRole('tutor'), (req: AuthRequest, res: Response): void => {
  const tutor = db.prepare('SELECT * FROM tutors WHERE user_id = ?').get(req.user!.id) as any;
  if (!tutor) { res.status(404).json({ error: 'Tutor profile not found' }); return; }
  res.json(getTutorById(tutor.id));
});

// GET /api/tutors - list approved tutors with filters
router.get('/', (req: Request, res: Response): void => {
  const { subject, minRate, maxRate, minRating, minExp, page = '1', limit = '12' } = req.query;
  const offset = (parseInt(page as string) - 1) * parseInt(limit as string);
  const params: any[] = [];

  let where = `WHERE t.status = 'approved'`;
  if (subject) { where += ` AND t.subject LIKE ?`; params.push(`%${subject}%`); }
  if (minRate) { where += ` AND t.hourly_rate >= ?`; params.push(parseFloat(minRate as string)); }
  if (maxRate) { where += ` AND t.hourly_rate <= ?`; params.push(parseFloat(maxRate as string)); }
  if (minExp) { where += ` AND t.experience_years >= ?`; params.push(parseInt(minExp as string)); }

  let having = '';
  if (minRating) { having = `HAVING avg_rating >= ?`; params.push(parseFloat(minRating as string)); }

  const query = `
    SELECT t.id, t.name, t.subject, t.experience_years, t.hourly_rate, t.bio,
           ROUND(COALESCE(AVG(r.rating), 0), 1) as avg_rating,
           COUNT(DISTINCT r.id) as review_count,
           (SELECT file_path FROM tutor_images WHERE tutor_id = t.id LIMIT 1) as avatar
    FROM tutors t
    LEFT JOIN reviews r ON r.target_id = t.id AND r.target_type = 'tutor'
    ${where}
    GROUP BY t.id
    ${having}
    ORDER BY avg_rating DESC, t.name ASC
    LIMIT ? OFFSET ?
  `;
  params.push(parseInt(limit as string), offset);

  res.json(db.prepare(query).all(...params));
});

// GET /api/tutors/:id
router.get('/:id', (req: Request, res: Response): void => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: 'Invalid ID' }); return; }

  const tutor = getTutorById(id);
  if (!tutor || tutor.status !== 'approved') {
    res.status(404).json({ error: 'Tutor not found' });
    return;
  }
  res.json(tutor);
});

// PUT /api/tutors/:id - update profile
router.put('/:id', authenticate, requireRole('tutor', 'admin'), (req: AuthRequest, res: Response): void => {
  const id = parseInt(req.params.id);
  const tutor = db.prepare('SELECT * FROM tutors WHERE id = ?').get(id) as any;
  if (!tutor) { res.status(404).json({ error: 'Tutor not found' }); return; }
  if (req.user!.role !== 'admin' && tutor.user_id !== req.user!.id) {
    res.status(403).json({ error: 'Forbidden' }); return;
  }

  const { name, subject, experience_years, hourly_rate, bio, mode } = req.body;

  if (mode && !['online', 'offline', 'both'].includes(mode)) {
    res.status(400).json({ error: 'mode must be online, offline or both' }); return;
  }

  db.prepare(`
    UPDATE tutors
    SET name = COALESCE(NULLIF(?, ''), name),
        subject = COALESCE(NULLIF(?, ''), subject),
        experience_years = COALESCE(?, experience_years),
        hourly_rate = COALESCE(?, hourly_rate),
        bio = COALESCE(?, bio),
        mode = COALESCE(NULLIF(?, ''), mode)
    WHERE id = ?
  `).run(
    name || null, subject || null,
    experience_years !== undefined ? parseInt(experience_years) : null,
    hourly_rate !== undefined ? parseFloat(hourly_rate) : null,
    bio ?? null, mode || null, id
  );

  if (name) {
    db.prepare('UPDATE users SET name = ? WHERE id = ?').run(name, tutor.user_id);
  }

  res.json(getTutorById(id));
});

// POST /api/tutors/:id/availability - replace all availability slots
router.post('/:id/availability', authenticate, requireRole('tutor', 'admin'), (req: AuthRequest, res: Response): void => {
  const id = parseInt(req.params.id);
  const tutor = db.prepare('SELECT * FROM tutors WHERE id = ?').get(id) as any;
  if (!tutor) { res.status(404).json({ error: 'Tutor not found' }); return; }
  if (req.user!.role !== 'admin' && tutor.user_id !== req.user!.id) {
    res.status(403).json({ error: 'Forbidden' }); return;
  }

  const { slots } = req.body;
  if (!Array.isArray(slots)) {
    res.status(400).json({ error: 'slots must be an array' }); return;
  }

  const validDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  for (const slot of slots) {
    if (!validDays.includes(slot.day_of_week) || !slot.start_time || !slot.end_time) {
      res.status(400).json({ error: 'Each slot needs a valid day_of_week, start_time, and end_time' });
      return;
    }
  }

  db.prepare('DELETE FROM tutor_availability WHERE tutor_id = ?').run(id);
  const insert = db.prepare('INSERT INTO tutor_availability (tutor_id, day_of_week, start_time, end_time) VALUES (?, ?, ?, ?)');
  for (const slot of slots) {
    insert.run(id, slot.day_of_week, slot.start_time, slot.end_time);
  }

  res.json({ message: 'Availability updated', slots });
});

// POST /api/tutors/:id/images
router.post('/:id/images', authenticate, requireRole('tutor', 'admin'), upload.array('images', 5), (req: AuthRequest, res: Response): void => {
  const id = parseInt(req.params.id);
  const tutor = db.prepare('SELECT * FROM tutors WHERE id = ?').get(id) as any;
  if (!tutor) { res.status(404).json({ error: 'Tutor not found' }); return; }
  if (req.user!.role !== 'admin' && tutor.user_id !== req.user!.id) {
    res.status(403).json({ error: 'Forbidden' }); return;
  }

  const files = req.files as Express.Multer.File[];
  if (!files || files.length === 0) {
    res.status(400).json({ error: 'No images uploaded' }); return;
  }

  const insert = db.prepare('INSERT INTO tutor_images (tutor_id, file_path) VALUES (?, ?)');
  for (const file of files) {
    insert.run(id, file.filename);
  }

  res.status(201).json({ message: `${files.length} image(s) uploaded` });
});

// DELETE /api/tutors/:id/images/:imageId
router.delete('/:id/images/:imageId', authenticate, requireRole('tutor', 'admin'), (req: AuthRequest, res: Response): void => {
  const id = parseInt(req.params.id);
  const imageId = parseInt(req.params.imageId);
  const tutor = db.prepare('SELECT * FROM tutors WHERE id = ?').get(id) as any;
  if (!tutor) { res.status(404).json({ error: 'Tutor not found' }); return; }
  if (req.user!.role !== 'admin' && tutor.user_id !== req.user!.id) {
    res.status(403).json({ error: 'Forbidden' }); return;
  }

  const image = db.prepare('SELECT * FROM tutor_images WHERE id = ? AND tutor_id = ?').get(imageId, id) as any;
  if (!image) { res.status(404).json({ error: 'Image not found' }); return; }

  const filePath = path.join(process.cwd(), 'uploads', image.file_path);
  if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

  db.prepare('DELETE FROM tutor_images WHERE id = ?').run(imageId);
  res.json({ message: 'Image deleted' });
});

export default router;