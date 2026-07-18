import { Router, Request, Response } from 'express';
import db from '../db/database';
import { getInstitutePlanAccessByUserId } from '../services/institutePlanAccess';
import { getTutorPlanAccessByUserId } from '../services/tutorPlanAccess';

const router = Router();

// GET /api/search?q=&type=&subject=&location=&minFee=&maxFee=&minRating=&page=&limit=
router.get('/', (req: Request, res: Response): void => {
  const {
    q = '',
    type = 'all',
    subject,
    location,
    minFee,
    maxFee,
    minRating,
    mode,
    page = '1',
    limit = '12',
  } = req.query;

  const offset = (parseInt(page as string) - 1) * parseInt(limit as string);
  const keyword = `%${q}%`;

  const results: { institutes: any[]; tutors: any[] } = { institutes: [], tutors: [] };

  // Search institutes
  if (type === 'all' || type === 'institute') {
    const params: any[] = [keyword, keyword];
    let where = `WHERE i.status = 'approved' AND (i.name LIKE ? OR i.description LIKE ?)`;

    if (location) { where += ` AND i.location LIKE ?`; params.push(`%${location}%`); }

    let having = '';
    if (minRating) { having = `HAVING avg_rating >= ?`; params.push(parseFloat(minRating as string)); }

    const query = `
      SELECT i.id, i.user_id, i.name, i.location, i.description, i.contact_email, i.contact_phone,
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
        SELECT c.name, c.category FROM institute_courses ic
        JOIN courses c ON c.id = ic.course_id WHERE ic.institute_id = ?
      `).all(inst.id);

      const planAccess = getInstitutePlanAccessByUserId(inst.user_id);
      inst.subscription_plan_code = planAccess.planCode;
      inst.subscription_plan_name = planAccess.planName;
      inst.plan_features = planAccess.features;

      if (!planAccess.features.reviewsEnabled) {
        inst.avg_rating = 0;
        inst.review_count = 0;
      }
    }

    // Filter by subject (course name)
    if (subject) {
      const s = (subject as string).toLowerCase();
      results.institutes = institutes.filter((inst: any) =>
        inst.courses.some((c: any) => c.name.toLowerCase().includes(s) || c.category.toLowerCase().includes(s))
      );
    } else {
      results.institutes = institutes;
    }

    // Filter by fee (if subject matched, filter institute_courses fees)
    if ((minFee || maxFee) && subject) {
      results.institutes = results.institutes.filter((inst: any) => {
        const ic = db.prepare(`
          SELECT ic.fee_structure FROM institute_courses ic
          JOIN courses c ON c.id = ic.course_id
          WHERE ic.institute_id = ? AND (c.name LIKE ? OR c.category LIKE ?)
          LIMIT 1
        `).get(inst.id, `%${subject}%`, `%${subject}%`) as any;

        if (!ic) return false;
        const fee = parseFloat(ic.fee_structure.replace(/[^0-9.]/g, ''));
        if (isNaN(fee)) return true;
        if (minFee && fee < parseFloat(minFee as string)) return false;
        if (maxFee && fee > parseFloat(maxFee as string)) return false;
        return true;
      });
    }
  }

  // Search tutors
  if (type === 'all' || type === 'tutor') {
    const params: any[] = [keyword, keyword, keyword];
    let where = `WHERE t.status = 'approved' AND (t.name LIKE ? OR t.bio LIKE ? OR t.subject LIKE ?)`;

    if (subject) { where += ` AND t.subject LIKE ?`; params.push(`%${subject}%`); }
    if (minFee) { where += ` AND t.hourly_rate >= ?`; params.push(parseFloat(minFee as string)); }
    if (maxFee) { where += ` AND t.hourly_rate <= ?`; params.push(parseFloat(maxFee as string)); }
    if (mode && mode !== 'both') { where += ` AND (t.mode = ? OR t.mode = 'both')`; params.push(mode); }

    let having = '';
    if (minRating) { having = `HAVING avg_rating >= ?`; params.push(parseFloat(minRating as string)); }

    const query = `
      SELECT t.id, t.user_id, t.name, t.subject, t.experience_years, t.hourly_rate, t.bio, t.mode,
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
    const tutors = db.prepare(query).all(...params) as any[];
    results.tutors = tutors.filter((tutor: any) => {
      const planAccess = getTutorPlanAccessByUserId(tutor.user_id);
      tutor.subscription_plan_code = planAccess.planCode;
      tutor.subscription_plan_name = planAccess.planName;
      tutor.plan_features = planAccess.features;

      if (!planAccess.features.reviewsEnabled) {
        tutor.avg_rating = 0;
        tutor.review_count = 0;
      }

      return planAccess.features.publicSearchEnabled;
    });
  }

  res.json(results);
});

// GET /api/search/courses - get all courses for filter dropdowns
router.get('/courses', (_req: Request, res: Response): void => {
  const courses = db.prepare('SELECT * FROM courses ORDER BY category, name').all();
  res.json(courses);
});

// GET /api/search/compare?ids=1,2,3&type=institute|tutor
router.get('/compare', (req: Request, res: Response): void => {
  const { ids, type } = req.query;

  if (!ids || !type) {
    res.status(400).json({ error: 'ids and type are required' }); return;
  }

  const idList = (ids as string).split(',').map(Number).filter(n => !isNaN(n)).slice(0, 4);
  if (idList.length < 2) {
    res.status(400).json({ error: 'At least 2 IDs required for comparison' }); return;
  }

  if (type === 'institute') {
    const placeholders = idList.map(() => '?').join(',');
    const items = db.prepare(`
      SELECT i.*,
             ROUND(COALESCE(AVG(r.rating), 0), 1) as avg_rating,
             COUNT(DISTINCT r.id) as review_count
      FROM institutes i
      LEFT JOIN reviews r ON r.target_id = i.id AND r.target_type = 'institute'
      WHERE i.id IN (${placeholders}) AND i.status = 'approved'
      GROUP BY i.id
    `).all(...idList) as any[];

    for (const item of items) {
      item.images = db.prepare('SELECT file_path FROM institute_images WHERE institute_id = ? LIMIT 1').all(item.id);
      item.courses = db.prepare(`
        SELECT ic.fee_structure, ic.duration, c.id as course_id, c.name as course_name, c.category
        FROM institute_courses ic JOIN courses c ON c.id = ic.course_id
        WHERE ic.institute_id = ?
      `).all(item.id);
      item.star_teachers = db.prepare(`
        SELECT t.name, t.subject FROM institute_star_teachers ist
        JOIN tutors t ON t.id = ist.tutor_id WHERE ist.institute_id = ?
      `).all(item.id);

      const planAccess = getInstitutePlanAccessByUserId(item.user_id);
      item.subscription_plan_code = planAccess.planCode;
      item.subscription_plan_name = planAccess.planName;
      item.plan_features = planAccess.features;

      if (!planAccess.features.reviewsEnabled) {
        item.avg_rating = 0;
        item.review_count = 0;
      }

      if (!planAccess.features.starTeachersEnabled) {
        item.star_teachers = [];
      }
    }

    // Find shared courses across all selected institutes
    if (items.length > 1) {
      const allCourseSets = items.map((inst: any) =>
        new Set<number>(inst.courses.map((c: any) => c.course_id))
      );
      const sharedCourseIds = [...allCourseSets[0]].filter(cid =>
        allCourseSets.every((s: Set<number>) => s.has(cid))
      );
      res.json({ items, sharedCourseIds, type: 'institute' });
      return;
    }

    res.json({ items, sharedCourseIds: [], type: 'institute' });
    return;
  }

  if (type === 'tutor') {
    const placeholders = idList.map(() => '?').join(',');
    const items = db.prepare(`
      SELECT t.*,
             ROUND(COALESCE(AVG(r.rating), 0), 1) as avg_rating,
             COUNT(DISTINCT r.id) as review_count
      FROM tutors t
      LEFT JOIN reviews r ON r.target_id = t.id AND r.target_type = 'tutor'
      WHERE t.id IN (${placeholders}) AND t.status = 'approved'
      GROUP BY t.id
    `).all(...idList) as any[];

    for (const item of items) {
      item.images = db.prepare('SELECT file_path FROM tutor_images WHERE tutor_id = ? LIMIT 1').all(item.id);
      item.availability = db.prepare('SELECT day_of_week, start_time, end_time FROM tutor_availability WHERE tutor_id = ?').all(item.id);

      const planAccess = getTutorPlanAccessByUserId(item.user_id);
      item.subscription_plan_code = planAccess.planCode;
      item.subscription_plan_name = planAccess.planName;
      item.plan_features = planAccess.features;

      if (!planAccess.features.reviewsEnabled) {
        item.avg_rating = 0;
        item.review_count = 0;
      }
    }

    res.json({ items: items.filter((item: any) => item.plan_features.publicSearchEnabled), type: 'tutor' });
    return;
  }

  res.status(400).json({ error: 'type must be institute or tutor' });
});

export default router;