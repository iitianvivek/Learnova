import { Router, Request, Response } from 'express';
import db from '../db/database';
import { authenticate, requireRole, AuthRequest } from '../middleware/auth';

const router = Router();

// GET /api/bookmarks - get student's bookmarks
router.get('/', authenticate, requireRole('student'), (req: AuthRequest, res: Response): void => {
  const bookmarks = db.prepare(`
    SELECT b.id, b.target_id, b.target_type, b.created_at,
      CASE b.target_type
        WHEN 'institute' THEN (SELECT name FROM institutes WHERE id = b.target_id)
        WHEN 'tutor' THEN (SELECT name FROM tutors WHERE id = b.target_id)
      END as name,
      CASE b.target_type
        WHEN 'institute' THEN (SELECT location FROM institutes WHERE id = b.target_id)
        ELSE NULL
      END as location,
      CASE b.target_type
        WHEN 'tutor' THEN (SELECT subject FROM tutors WHERE id = b.target_id)
        ELSE NULL
      END as subject,
      CASE b.target_type
        WHEN 'institute' THEN (SELECT file_path FROM institute_images WHERE institute_id = b.target_id LIMIT 1)
        WHEN 'tutor' THEN (SELECT file_path FROM tutor_images WHERE tutor_id = b.target_id LIMIT 1)
      END as thumbnail
    FROM bookmarks b
    WHERE b.student_id = ?
    ORDER BY b.created_at DESC
  `).all(req.user!.id);

  res.json(bookmarks);
});

// POST /api/bookmarks - add bookmark
router.post('/', authenticate, requireRole('student'), (req: AuthRequest, res: Response): void => {
  const { target_id, target_type } = req.body;

  if (!target_id || !target_type) {
    res.status(400).json({ error: 'target_id and target_type are required' }); return;
  }
  if (!['institute', 'tutor'].includes(target_type)) {
    res.status(400).json({ error: 'target_type must be institute or tutor' }); return;
  }

  try {
    db.prepare(
      'INSERT INTO bookmarks (student_id, target_id, target_type) VALUES (?, ?, ?)'
    ).run(req.user!.id, target_id, target_type);
    res.status(201).json({ message: 'Bookmarked successfully' });
  } catch {
    res.status(409).json({ error: 'Already bookmarked' });
  }
});

// DELETE /api/bookmarks/:targetType/:targetId - remove bookmark
router.delete('/:targetType/:targetId', authenticate, requireRole('student'), (req: AuthRequest, res: Response): void => {
  const { targetType, targetId } = req.params;

  if (!['institute', 'tutor'].includes(targetType)) {
    res.status(400).json({ error: 'Invalid target type' }); return;
  }

  db.prepare(
    'DELETE FROM bookmarks WHERE student_id = ? AND target_id = ? AND target_type = ?'
  ).run(req.user!.id, parseInt(targetId), targetType);

  res.json({ message: 'Bookmark removed' });
});

// GET /api/bookmarks/check/:targetType/:targetId
router.get('/check/:targetType/:targetId', authenticate, requireRole('student'), (req: AuthRequest, res: Response): void => {
  const { targetType, targetId } = req.params;
  const bookmark = db.prepare(
    'SELECT id FROM bookmarks WHERE student_id = ? AND target_id = ? AND target_type = ?'
  ).get(req.user!.id, parseInt(targetId), targetType);
  res.json({ bookmarked: !!bookmark });
});

export default router;