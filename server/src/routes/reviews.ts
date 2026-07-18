import { Router, Request, Response } from 'express';
import db from '../db/database';
import { authenticate, requireRole, AuthRequest } from '../middleware/auth';
import { getInstitutePlanAccessByUserId } from '../services/institutePlanAccess';
import { getTutorPlanAccessByUserId } from '../services/tutorPlanAccess';

const router = Router();

// GET /api/reviews/:targetType/:targetId
router.get('/:targetType/:targetId', (req: Request, res: Response): void => {
  const { targetType, targetId } = req.params;
  if (!['institute', 'tutor'].includes(targetType)) {
    res.status(400).json({ error: 'targetType must be institute or tutor' }); return;
  }

  if (targetType === 'institute') {
    const institute = db.prepare("SELECT user_id FROM institutes WHERE id = ? AND status = 'approved'").get(parseInt(targetId, 10)) as any;
    if (institute) {
      const planAccess = getInstitutePlanAccessByUserId(institute.user_id);
      if (!planAccess.features.reviewsEnabled) {
        res.json([]);
        return;
      }
    }
  } else {
    const tutor = db.prepare("SELECT user_id FROM tutors WHERE id = ? AND status = 'approved'").get(parseInt(targetId, 10)) as any;
    if (tutor) {
      const planAccess = getTutorPlanAccessByUserId(tutor.user_id);
      if (!planAccess.features.reviewsEnabled) {
        res.json([]);
        return;
      }
    }
  }

  const reviews = db.prepare(`
    SELECT r.id, r.reviewer_id, u.name as reviewer_name, r.rating, r.comment, r.created_at
    FROM reviews r
    JOIN users u ON u.id = r.reviewer_id
    WHERE r.target_id = ? AND r.target_type = ?
    ORDER BY r.created_at DESC
  `).all(parseInt(targetId), targetType);

  res.json(reviews);
});

// POST /api/reviews - create review (students only)
router.post('/', authenticate, requireRole('student'), (req: AuthRequest, res: Response): void => {
  const { target_id, target_type, rating, comment } = req.body;

  if (!target_id || !target_type || !rating) {
    res.status(400).json({ error: 'target_id, target_type and rating are required' }); return;
  }
  if (!['institute', 'tutor'].includes(target_type)) {
    res.status(400).json({ error: 'target_type must be institute or tutor' }); return;
  }
  const ratingNum = parseInt(rating);
  if (isNaN(ratingNum) || ratingNum < 1 || ratingNum > 5) {
    res.status(400).json({ error: 'Rating must be between 1 and 5' }); return;
  }

  // Verify target exists and is approved
  if (target_type === 'institute') {
    const inst = db.prepare("SELECT id, user_id FROM institutes WHERE id = ? AND status = 'approved'").get(target_id) as any;
    if (!inst) { res.status(404).json({ error: 'Institute not found' }); return; }

    const planAccess = getInstitutePlanAccessByUserId(inst.user_id);
    if (!planAccess.features.reviewsEnabled) {
      res.status(403).json({ error: 'Reviews are available on Academy Growth and Academy Elite plans only.' });
      return;
    }
  } else {
    const tutor = db.prepare("SELECT id, user_id FROM tutors WHERE id = ? AND status = 'approved'").get(target_id) as any;
    if (!tutor) { res.status(404).json({ error: 'Tutor not found' }); return; }

    const planAccess = getTutorPlanAccessByUserId(tutor.user_id);
    if (!planAccess.features.reviewsEnabled) {
      res.status(403).json({ error: 'Reviews are available on Tutor Pro and Tutor Elite plans only.' });
      return;
    }
  }

  try {
    const result = db.prepare(
      'INSERT INTO reviews (reviewer_id, target_id, target_type, rating, comment) VALUES (?, ?, ?, ?, ?)'
    ).run(req.user!.id, target_id, target_type, ratingNum, comment || '');

    const review = db.prepare(`
      SELECT r.id, r.reviewer_id, u.name as reviewer_name, r.rating, r.comment, r.created_at
      FROM reviews r JOIN users u ON u.id = r.reviewer_id WHERE r.id = ?
    `).get(result.lastInsertRowid);

    res.status(201).json(review);
  } catch {
    res.status(409).json({ error: 'You have already reviewed this listing' });
  }
});

// DELETE /api/reviews/:id
router.delete('/:id', authenticate, (req: AuthRequest, res: Response): void => {
  const id = parseInt(req.params.id);
  const review = db.prepare('SELECT * FROM reviews WHERE id = ?').get(id) as any;
  if (!review) { res.status(404).json({ error: 'Review not found' }); return; }

  if (req.user!.role !== 'admin' && review.reviewer_id !== req.user!.id) {
    res.status(403).json({ error: 'Forbidden' }); return;
  }

  db.prepare('DELETE FROM reviews WHERE id = ?').run(id);
  res.json({ message: 'Review deleted' });
});

export default router;