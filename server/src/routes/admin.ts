import { Router, Request, Response } from 'express';
import db from '../db/database';
import { authenticate, requireRole, AuthRequest } from '../middleware/auth';

const router = Router();

// GET /api/admin/stats
router.get('/stats', authenticate, requireRole('admin'), (_req: Request, res: Response): void => {
  const stats = {
    total_users: (db.prepare('SELECT COUNT(*) as c FROM users').get() as any).c,
    total_students: (db.prepare("SELECT COUNT(*) as c FROM users WHERE role = 'student'").get() as any).c,
    total_institutes: (db.prepare('SELECT COUNT(*) as c FROM institutes').get() as any).c,
    approved_institutes: (db.prepare("SELECT COUNT(*) as c FROM institutes WHERE status = 'approved'").get() as any).c,
    pending_institutes: (db.prepare("SELECT COUNT(*) as c FROM institutes WHERE status = 'pending'").get() as any).c,
    total_tutors: (db.prepare('SELECT COUNT(*) as c FROM tutors').get() as any).c,
    approved_tutors: (db.prepare("SELECT COUNT(*) as c FROM tutors WHERE status = 'approved'").get() as any).c,
    pending_tutors: (db.prepare("SELECT COUNT(*) as c FROM tutors WHERE status = 'pending'").get() as any).c,
    total_reviews: (db.prepare('SELECT COUNT(*) as c FROM reviews').get() as any).c,
    total_bookmarks: (db.prepare('SELECT COUNT(*) as c FROM bookmarks').get() as any).c,
  };
  res.json(stats);
});

// GET /api/admin/pending
router.get('/pending', authenticate, requireRole('admin'), (_req: Request, res: Response): void => {
  const pendingInstitutes = db.prepare(`
    SELECT i.*, u.email FROM institutes i
    JOIN users u ON u.id = i.user_id
    WHERE i.status = 'pending'
    ORDER BY i.created_at ASC
  `).all();

  const pendingTutors = db.prepare(`
    SELECT t.*, u.email FROM tutors t
    JOIN users u ON u.id = t.user_id
    WHERE t.status = 'pending'
    ORDER BY t.created_at ASC
  `).all();

  res.json({ institutes: pendingInstitutes, tutors: pendingTutors });
});

// PUT /api/admin/institutes/:id/status
router.put('/institutes/:id/status', authenticate, requireRole('admin'), (req: AuthRequest, res: Response): void => {
  const id = parseInt(req.params.id);
  const { status } = req.body;

  if (!['approved', 'rejected'].includes(status)) {
    res.status(400).json({ error: 'Status must be approved or rejected' }); return;
  }

  const institute = db.prepare('SELECT * FROM institutes WHERE id = ?').get(id);
  if (!institute) { res.status(404).json({ error: 'Institute not found' }); return; }

  db.prepare('UPDATE institutes SET status = ? WHERE id = ?').run(status, id);
  res.json({ message: `Institute ${status}` });
});

// PUT /api/admin/tutors/:id/status
router.put('/tutors/:id/status', authenticate, requireRole('admin'), (req: AuthRequest, res: Response): void => {
  const id = parseInt(req.params.id);
  const { status } = req.body;

  if (!['approved', 'rejected'].includes(status)) {
    res.status(400).json({ error: 'Status must be approved or rejected' }); return;
  }

  const tutor = db.prepare('SELECT * FROM tutors WHERE id = ?').get(id);
  if (!tutor) { res.status(404).json({ error: 'Tutor not found' }); return; }

  db.prepare('UPDATE tutors SET status = ? WHERE id = ?').run(status, id);
  res.json({ message: `Tutor ${status}` });
});

// GET /api/admin/users
router.get('/users', authenticate, requireRole('admin'), (req: Request, res: Response): void => {
  const { page = '1', limit = '20' } = req.query;
  const offset = (parseInt(page as string) - 1) * parseInt(limit as string);

  const users = db.prepare(
    'SELECT id, name, email, role, created_at FROM users ORDER BY created_at DESC LIMIT ? OFFSET ?'
  ).all(parseInt(limit as string), offset);

  const total = (db.prepare('SELECT COUNT(*) as c FROM users').get() as any).c;
  res.json({ users, total });
});

// DELETE /api/admin/users/:id
router.delete('/users/:id', authenticate, requireRole('admin'), (req: AuthRequest, res: Response): void => {
  const id = parseInt(req.params.id);
  if (id === req.user!.id) {
    res.status(400).json({ error: 'Cannot delete your own admin account' }); return;
  }
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(id);
  if (!user) { res.status(404).json({ error: 'User not found' }); return; }
  db.prepare('DELETE FROM users WHERE id = ?').run(id);
  res.json({ message: 'User deleted' });
});

export default router;