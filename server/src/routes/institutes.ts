import { Router, Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import db from '../db/database';
import { authenticate, requireRole, AuthRequest } from '../middleware/auth';
import { upload } from '../middleware/upload';

const router = Router();

function getInstituteById(id: number): any | null {
  const institute = db.prepare(`
    SELECT i.*,
           ROUND(COALESCE(AVG(r.rating), 0), 1) as avg_rating,
           COUNT(DISTINCT r.id) as review_count
    FROM institutes i
    LEFT JOIN reviews r ON r.target_id = i.id AND r.target_type = 'institute'
    WHERE i.id = ?
    GROUP BY i.id
  `).get(id) as any;

  if (!institute) return null;

  institute.images = db.prepare(
    'SELECT id, file_path FROM institute_images WHERE institute_id = ?'
  ).all(id) as any[];

  institute.courses = db.prepare(`
    SELECT ic.id, ic.fee_structure, ic.duration,
           c.id as course_id, c.name as course_name, c.category
    FROM institute_courses ic
    JOIN courses c ON c.id = ic.course_id
    WHERE ic.institute_id = ?
    ORDER BY c.category, c.name
  `).all(id) as any[];

  institute.star_teachers = db.prepare(`
    SELECT t.id, t.name, t.subject, t.experience_years, t.hourly_rate,
           (SELECT file_path FROM tutor_images WHERE tutor_id = t.id LIMIT 1) as avatar
    FROM institute_star_teachers ist
    JOIN tutors t ON t.id = ist.tutor_id
    WHERE ist.institute_id = ?
  `).all(id) as any[];

  return institute;
}

// GET /api/institutes/mine/profile - get own institute profile
router.get('/mine/profile', authenticate, requireRole('institute'), (req: AuthRequest, res: Response): void => {
  const institute = db.prepare('SELECT * FROM institutes WHERE user_id = ?').get(req.user!.id) as any;
  if (!institute) {
    res.status(404).json({ error: 'Institute profile not found' });
    return;
  }
  res.json(getInstituteById(institute.id));
});

// GET /api/institutes - list approved institutes with filters
router.get('/', (req: Request, res: Response): void => {
  const { location, minRating, page = '1', limit = '12' } = req.query;
  const offset = (parseInt(page as string) - 1) * parseInt(limit as string);
  const params: any[] = [];

  let where = `WHERE i.status = 'approved'`;
  if (location) {
    where += ` AND i.location LIKE ?`;
    params.push(`%${location}%`);
  }

  let having = '';
  if (minRating) {
    having = `HAVING avg_rating >= ?`;
    params.push(parseFloat(minRating as string));
  }

  const query = `
    SELECT i.id, i.name, i.location, i.description, i.contact_email, i.contact_phone, i.status,
           ROUND(COALESCE(AVG(r.rating), 0), 1) as avg_rating,
           COUNT(DISTINCT r.id) as review_count,
           (SELECT file_path FROM institute_images WHERE institute_id = i.id LIMIT 1) as thumbnail
    FROM institutes i
    LEFT JOIN reviews r ON r.target_id = i.id AND r.target_type = 'institute'
    ${where}
    GROUP BY i.id
    ${having}
    ORDER BY avg_rating DESC, i.name ASC
    LIMIT ? OFFSET ?
  `;
  params.push(parseInt(limit as string), offset);

  const institutes = db.prepare(query).all(...params) as any[];

  for (const inst of institutes) {
    inst.courses = db.prepare(`
      SELECT c.name, c.category
      FROM institute_courses ic
      JOIN courses c ON c.id = ic.course_id
      WHERE ic.institute_id = ?
    `).all(inst.id);
  }

  res.json(institutes);
});

// GET /api/institutes/:id
router.get('/:id', (req: Request, res: Response): void => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: 'Invalid ID' }); return; }

  const institute = getInstituteById(id);
  if (!institute || institute.status !== 'approved') {
    res.status(404).json({ error: 'Institute not found' });
    return;
  }
  res.json(institute);
});

// PUT /api/institutes/:id - update profile
router.put('/:id', authenticate, requireRole('institute', 'admin'), (req: AuthRequest, res: Response): void => {
  const id = parseInt(req.params.id);
  const institute = db.prepare('SELECT * FROM institutes WHERE id = ?').get(id) as any;
  if (!institute) { res.status(404).json({ error: 'Institute not found' }); return; }
  if (req.user!.role !== 'admin' && institute.user_id !== req.user!.id) {
    res.status(403).json({ error: 'Forbidden' }); return;
  }

  const { name, location, description, contact_email, contact_phone, contact_website } = req.body;

  db.prepare(`
    UPDATE institutes
    SET name = COALESCE(NULLIF(?, ''), name),
        location = COALESCE(NULLIF(?, ''), location),
        description = COALESCE(?, description),
        contact_email = COALESCE(?, contact_email),
        contact_phone = COALESCE(?, contact_phone),
        contact_website = COALESCE(?, contact_website)
    WHERE id = ?
  `).run(name || null, location || null, description ?? null, contact_email ?? null, contact_phone ?? null, contact_website ?? null, id);

  if (name) {
    db.prepare('UPDATE users SET name = ? WHERE id = ?').run(name, institute.user_id);
  }

  res.json(getInstituteById(id));
});

// POST /api/institutes/:id/courses
router.post('/:id/courses', authenticate, requireRole('institute', 'admin'), (req: AuthRequest, res: Response): void => {
  const id = parseInt(req.params.id);
  const institute = db.prepare('SELECT * FROM institutes WHERE id = ?').get(id) as any;
  if (!institute) { res.status(404).json({ error: 'Institute not found' }); return; }
  if (req.user!.role !== 'admin' && institute.user_id !== req.user!.id) {
    res.status(403).json({ error: 'Forbidden' }); return;
  }

  const { course_id, fee_structure, duration } = req.body;
  if (!course_id || !fee_structure?.trim()) {
    res.status(400).json({ error: 'course_id and fee_structure are required' }); return;
  }

  const course = db.prepare('SELECT id FROM courses WHERE id = ?').get(course_id);
  if (!course) { res.status(404).json({ error: 'Course not found' }); return; }

  try {
    db.prepare(
      'INSERT INTO institute_courses (institute_id, course_id, fee_structure, duration) VALUES (?, ?, ?, ?)'
    ).run(id, course_id, fee_structure, duration || '');
    res.status(201).json({ message: 'Course added successfully' });
  } catch {
    res.status(409).json({ error: 'This course is already added to the institute' });
  }
});

// DELETE /api/institutes/:id/courses/:courseId
router.delete('/:id/courses/:courseId', authenticate, requireRole('institute', 'admin'), (req: AuthRequest, res: Response): void => {
  const id = parseInt(req.params.id);
  const courseId = parseInt(req.params.courseId);
  const institute = db.prepare('SELECT * FROM institutes WHERE id = ?').get(id) as any;
  if (!institute) { res.status(404).json({ error: 'Institute not found' }); return; }
  if (req.user!.role !== 'admin' && institute.user_id !== req.user!.id) {
    res.status(403).json({ error: 'Forbidden' }); return;
  }

  db.prepare('DELETE FROM institute_courses WHERE institute_id = ? AND course_id = ?').run(id, courseId);
  res.json({ message: 'Course removed' });
});

// POST /api/institutes/:id/star-teachers
router.post('/:id/star-teachers', authenticate, requireRole('institute', 'admin'), (req: AuthRequest, res: Response): void => {
  const id = parseInt(req.params.id);
  const institute = db.prepare('SELECT * FROM institutes WHERE id = ?').get(id) as any;
  if (!institute) { res.status(404).json({ error: 'Institute not found' }); return; }
  if (req.user!.role !== 'admin' && institute.user_id !== req.user!.id) {
    res.status(403).json({ error: 'Forbidden' }); return;
  }

  const { tutor_id } = req.body;
  if (!tutor_id) { res.status(400).json({ error: 'tutor_id is required' }); return; }

  const tutor = db.prepare("SELECT id FROM tutors WHERE id = ? AND status = 'approved'").get(tutor_id);
  if (!tutor) { res.status(404).json({ error: 'Approved tutor not found' }); return; }

  try {
    db.prepare('INSERT INTO institute_star_teachers (institute_id, tutor_id) VALUES (?, ?)').run(id, tutor_id);
    res.status(201).json({ message: 'Star teacher added' });
  } catch {
    res.status(409).json({ error: 'Tutor is already a star teacher of this institute' });
  }
});

// DELETE /api/institutes/:id/star-teachers/:tutorId
router.delete('/:id/star-teachers/:tutorId', authenticate, requireRole('institute', 'admin'), (req: AuthRequest, res: Response): void => {
  const id = parseInt(req.params.id);
  const tutorId = parseInt(req.params.tutorId);
  const institute = db.prepare('SELECT * FROM institutes WHERE id = ?').get(id) as any;
  if (!institute) { res.status(404).json({ error: 'Institute not found' }); return; }
  if (req.user!.role !== 'admin' && institute.user_id !== req.user!.id) {
    res.status(403).json({ error: 'Forbidden' }); return;
  }

  db.prepare('DELETE FROM institute_star_teachers WHERE institute_id = ? AND tutor_id = ?').run(id, tutorId);
  res.json({ message: 'Star teacher removed' });
});

// POST /api/institutes/:id/images
router.post('/:id/images', authenticate, requireRole('institute', 'admin'), upload.array('images', 10), (req: AuthRequest, res: Response): void => {
  const id = parseInt(req.params.id);
  const institute = db.prepare('SELECT * FROM institutes WHERE id = ?').get(id) as any;
  if (!institute) { res.status(404).json({ error: 'Institute not found' }); return; }
  if (req.user!.role !== 'admin' && institute.user_id !== req.user!.id) {
    res.status(403).json({ error: 'Forbidden' }); return;
  }

  const files = req.files as Express.Multer.File[];
  if (!files || files.length === 0) {
    res.status(400).json({ error: 'No images uploaded' }); return;
  }

  const insertImage = db.prepare('INSERT INTO institute_images (institute_id, file_path) VALUES (?, ?)');
  for (const file of files) {
    insertImage.run(id, file.filename);
  }

  res.status(201).json({ message: `${files.length} image(s) uploaded successfully` });
});

// DELETE /api/institutes/:id/images/:imageId
router.delete('/:id/images/:imageId', authenticate, requireRole('institute', 'admin'), (req: AuthRequest, res: Response): void => {
  const id = parseInt(req.params.id);
  const imageId = parseInt(req.params.imageId);
  const institute = db.prepare('SELECT * FROM institutes WHERE id = ?').get(id) as any;
  if (!institute) { res.status(404).json({ error: 'Institute not found' }); return; }
  if (req.user!.role !== 'admin' && institute.user_id !== req.user!.id) {
    res.status(403).json({ error: 'Forbidden' }); return;
  }

  const image = db.prepare('SELECT * FROM institute_images WHERE id = ? AND institute_id = ?').get(imageId, id) as any;
  if (!image) { res.status(404).json({ error: 'Image not found' }); return; }

  const filePath = path.join(process.cwd(), 'uploads', image.file_path);
  if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

  db.prepare('DELETE FROM institute_images WHERE id = ?').run(imageId);
  res.json({ message: 'Image deleted' });
});

export default router;