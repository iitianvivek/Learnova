import { Router, Response } from 'express';
import db from '../db/database';
import { authenticate, requireRole, AuthRequest } from '../middleware/auth';

const router = Router();

// POST /api/enquiries  — student sends an enquiry
router.post('/', authenticate, requireRole('student'), (req: AuthRequest, res: Response): void => {
  const { target_id, target_type, message, student_phone } = req.body;

  if (!target_id || !target_type || !message?.trim()) {
    res.status(400).json({ error: 'target_id, target_type and message are required' });
    return;
  }
  if (!['institute', 'tutor'].includes(target_type)) {
    res.status(400).json({ error: 'target_type must be institute or tutor' });
    return;
  }

  const user = db.prepare('SELECT name, email FROM users WHERE id = ?').get(req.user!.id) as any;

  // Prevent duplicate: block if student already has a non-replied enquiry to same target
  const existing = db.prepare(
    `SELECT id FROM enquiries WHERE student_id = ? AND target_id = ? AND target_type = ? AND status != 'replied'`
  ).get(req.user!.id, parseInt(target_id), target_type);
  if (existing) {
    res.status(409).json({ error: 'You already have a pending enquiry to this institute/tutor. Please wait for a reply before sending another.' });
    return;
  }

  const result = db.prepare(`
    INSERT INTO enquiries (student_id, target_id, target_type, message, student_name, student_email, student_phone)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    req.user!.id,
    parseInt(target_id),
    target_type,
    message.trim(),
    user.name,
    user.email,
    student_phone?.trim() || ''
  );

  res.status(201).json({ id: result.lastInsertRowid, message: 'Enquiry sent successfully' });
});

// GET /api/enquiries/mine  — student sees their sent enquiries
router.get('/mine', authenticate, requireRole('student'), (req: AuthRequest, res: Response): void => {
  const enquiries = db.prepare(`
    SELECT e.*,
      CASE e.target_type
        WHEN 'institute' THEN (SELECT name FROM institutes WHERE id = e.target_id)
        WHEN 'tutor'     THEN (SELECT name FROM tutors     WHERE id = e.target_id)
      END as target_name
    FROM enquiries e
    WHERE e.student_id = ?
    ORDER BY e.created_at DESC
  `).all(req.user!.id);

  res.json(enquiries);
});

// GET /api/enquiries/received  — institute or tutor sees enquiries sent to them
router.get('/received', authenticate, requireRole('institute', 'tutor'), (req: AuthRequest, res: Response): void => {
  const role = req.user!.role as 'institute' | 'tutor';

  // Find the entity id for this user
  const entity = role === 'institute'
    ? db.prepare('SELECT id FROM institutes WHERE user_id = ?').get(req.user!.id) as any
    : db.prepare('SELECT id FROM tutors WHERE user_id = ?').get(req.user!.id) as any;

  if (!entity) {
    res.status(404).json({ error: 'Profile not found' });
    return;
  }

  const enquiries = db.prepare(`
    SELECT * FROM enquiries
    WHERE target_id = ? AND target_type = ?
    ORDER BY created_at DESC
  `).all(entity.id, role);

  res.json(enquiries);
});

// PATCH /api/enquiries/:id/status  — institute/tutor marks an enquiry read or replied
router.patch('/:id/status', authenticate, requireRole('institute', 'tutor'), (req: AuthRequest, res: Response): void => {
  const id = parseInt(req.params.id);
  const { status } = req.body;

  if (!['read', 'replied'].includes(status)) {
    res.status(400).json({ error: 'status must be read or replied' });
    return;
  }

  const role = req.user!.role as 'institute' | 'tutor';
  const entity = role === 'institute'
    ? db.prepare('SELECT id FROM institutes WHERE user_id = ?').get(req.user!.id) as any
    : db.prepare('SELECT id FROM tutors WHERE user_id = ?').get(req.user!.id) as any;

  if (!entity) { res.status(404).json({ error: 'Profile not found' }); return; }

  const enquiry = db.prepare('SELECT * FROM enquiries WHERE id = ?').get(id) as any;
  if (!enquiry || enquiry.target_id !== entity.id || enquiry.target_type !== role) {
    res.status(403).json({ error: 'Forbidden' });
    return;
  }

  db.prepare('UPDATE enquiries SET status = ? WHERE id = ?').run(status, id);
  res.json({ message: 'Status updated' });
});

// GET /api/enquiries/admin  — admin sees all enquiries
router.get('/admin', authenticate, requireRole('admin'), (_req: AuthRequest, res: Response): void => {
  const enquiries = db.prepare(`
    SELECT e.*,
      CASE e.target_type
        WHEN 'institute' THEN (SELECT name FROM institutes WHERE id = e.target_id)
        WHEN 'tutor'     THEN (SELECT name FROM tutors     WHERE id = e.target_id)
      END as target_name
    FROM enquiries e
    ORDER BY e.created_at DESC
    LIMIT 200
  `).all();
  res.json(enquiries);
});

export default router;