import { Router, Request, Response } from 'express';
import db from '../db/database';
import { authenticate, requireRole, AuthRequest } from '../middleware/auth';
import { BillingDurationMonths, getPlanByCode, PROVIDER_LAUNCH_COUPON_CODE } from '../config/providerPlans';
import { finalizeProviderDraft, ProviderDraftActivationError } from '../services/providerDraftActivation';

const router = Router();

const VALID_USER_ROLES = ['student', 'tutor', 'institute', 'admin'] as const;
const VALID_PROVIDER_STATUSES = ['pending', 'approved', 'rejected'] as const;
const VALID_TUTOR_MODES = ['online', 'offline', 'both'] as const;

class AdminRequestError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

function normalizeProviderPayment(row: any) {
  const form = JSON.parse(row.form_json) as any;
  const durationMonths = Number(row.selected_duration_months) as BillingDurationMonths;
  const session = db.prepare(`
    SELECT session_id, gateway_reference, updated_at
    FROM provider_checkout_sessions
    WHERE draft_public_id = ? AND status = 'paid'
    ORDER BY updated_at DESC LIMIT 1
  `).get(row.public_id) as any;
  const plan = row.selected_plan_code ? getPlanByCode(row.selected_plan_code) : undefined;
  const appliedCouponCode = plan && durationMonths && row.selected_amount === plan.durationPricing[durationMonths]
    ? PROVIDER_LAUNCH_COUPON_CODE
    : null;

  return {
    draftId: row.public_id,
    role: row.role,
    name: form.name,
    email: form.email,
    location: form.location || undefined,
    subject: form.subject || undefined,
    planCode: row.selected_plan_code,
    planName: plan?.name || row.selected_plan_code,
    durationMonths,
    amount: row.selected_amount,
    appliedCouponCode,
    paymentReference: session?.gateway_reference || '',
    createdAt: row.created_at,
    submittedAt: session?.updated_at || row.updated_at,
  };
}

function normalizeProviderDraft(row: any) {
  const form = JSON.parse(row.form_json) as any;
  const plan = row.selected_plan_code ? getPlanByCode(row.selected_plan_code) : undefined;
  const session = db.prepare(`
    SELECT session_id, gateway_reference, status, updated_at
    FROM provider_checkout_sessions
    WHERE draft_public_id = ?
    ORDER BY updated_at DESC LIMIT 1
  `).get(row.public_id) as any;

  return {
    draftId: row.public_id,
    role: row.role,
    name: form.name,
    email: form.email,
    location: form.location || undefined,
    subject: form.subject || undefined,
    description: form.description || undefined,
    contactEmail: form.contact_email || undefined,
    contactPhone: form.contact_phone || undefined,
    contactWebsite: form.contact_website || undefined,
    experienceYears: form.experience_years ?? undefined,
    hourlyRate: form.hourly_rate ?? undefined,
    bio: form.bio || undefined,
    mode: form.mode || undefined,
    selectedPlanCode: row.selected_plan_code,
    selectedPlanName: plan?.name || row.selected_plan_code || undefined,
    selectedDurationMonths: row.selected_duration_months,
    selectedAmount: row.selected_amount,
    checkoutStatus: session?.status || null,
    paymentReference: session?.gateway_reference || '',
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function buildUserFilters(search: string, role: string) {
  const clauses: string[] = [];
  const params: Array<string> = [];

  if (role && VALID_USER_ROLES.includes(role as typeof VALID_USER_ROLES[number])) {
    clauses.push('u.role = ?');
    params.push(role);
  }

  if (search) {
    clauses.push('(LOWER(u.name) LIKE ? OR LOWER(u.email) LIKE ?)');
    const term = `%${search.toLowerCase()}%`;
    params.push(term, term);
  }

  return {
    whereClause: clauses.length ? `WHERE ${clauses.join(' AND ')}` : '',
    params,
  };
}

function baseAdminUserQuery() {
  return `
    SELECT
      u.id AS user_id,
      u.name AS user_name,
      u.email AS user_email,
      u.role AS user_role,
      u.created_at AS user_created_at,
      i.id AS institute_id,
      i.name AS institute_name,
      i.location AS institute_location,
      i.description AS institute_description,
      i.contact_email AS institute_contact_email,
      i.contact_phone AS institute_contact_phone,
      i.contact_website AS institute_contact_website,
      i.status AS institute_status,
      t.id AS tutor_id,
      t.name AS tutor_name,
      t.subject AS tutor_subject,
      t.experience_years AS tutor_experience_years,
      t.hourly_rate AS tutor_hourly_rate,
      t.bio AS tutor_bio,
      t.mode AS tutor_mode,
      t.status AS tutor_status,
      ps.plan_code AS subscription_plan_code,
      ps.duration_months AS subscription_duration_months,
      ps.amount AS subscription_amount,
      ps.currency AS subscription_currency,
      ps.status AS subscription_status,
      ps.starts_at AS subscription_starts_at,
      ps.ends_at AS subscription_ends_at
    FROM users u
    LEFT JOIN institutes i ON i.user_id = u.id
    LEFT JOIN tutors t ON t.user_id = u.id
    LEFT JOIN provider_subscriptions ps ON ps.id = (
      SELECT sub.id
      FROM provider_subscriptions sub
      WHERE sub.user_id = u.id
      ORDER BY sub.created_at DESC, sub.id DESC
      LIMIT 1
    )
  `;
}

function normalizeAdminUser(row: any) {
  const subscription = row.subscription_plan_code ? {
    planCode: row.subscription_plan_code,
    durationMonths: row.subscription_duration_months,
    amount: row.subscription_amount,
    currency: row.subscription_currency,
    status: row.subscription_status,
    startsAt: row.subscription_starts_at,
    endsAt: row.subscription_ends_at,
  } : null;

  if (row.user_role === 'institute') {
    return {
      id: row.user_id,
      name: row.user_name,
      email: row.user_email,
      role: row.user_role,
      created_at: row.user_created_at,
      profile: {
        id: row.institute_id,
        status: row.institute_status,
        location: row.institute_location,
        description: row.institute_description,
        contact_email: row.institute_contact_email,
        contact_phone: row.institute_contact_phone,
        contact_website: row.institute_contact_website,
      },
      subscription,
    };
  }

  if (row.user_role === 'tutor') {
    return {
      id: row.user_id,
      name: row.user_name,
      email: row.user_email,
      role: row.user_role,
      created_at: row.user_created_at,
      profile: {
        id: row.tutor_id,
        status: row.tutor_status,
        subject: row.tutor_subject,
        experience_years: row.tutor_experience_years,
        hourly_rate: row.tutor_hourly_rate,
        bio: row.tutor_bio,
        mode: row.tutor_mode,
      },
      subscription,
    };
  }

  return {
    id: row.user_id,
    name: row.user_name,
    email: row.user_email,
    role: row.user_role,
    created_at: row.user_created_at,
    profile: null,
    subscription,
  };
}

function listAdminUsers(search: string, role: string, limit: number, offset: number) {
  const { whereClause, params } = buildUserFilters(search, role);
  const query = `
    ${baseAdminUserQuery()}
    ${whereClause}
    ORDER BY u.created_at DESC, u.id DESC
    LIMIT ? OFFSET ?
  `;

  return (db.prepare(query).all(...params, limit, offset) as any[]).map(normalizeAdminUser);
}

function countAdminUsers(search: string, role: string) {
  const { whereClause, params } = buildUserFilters(search, role);
  const row = db.prepare(`SELECT COUNT(*) as c FROM users u ${whereClause}`).get(...params) as any;
  return row.c;
}

function getAdminUserById(id: number) {
  const row = db.prepare(`
    ${baseAdminUserQuery()}
    WHERE u.id = ?
    LIMIT 1
  `).get(id) as any;

  return row ? normalizeAdminUser(row) : null;
}

function parseRequiredText(value: unknown, fieldLabel: string) {
  const text = String(value || '').trim();
  if (!text) {
    throw new AdminRequestError(400, `${fieldLabel} is required`);
  }
  return text;
}

function parseOptionalText(value: unknown) {
  return String(value || '').trim();
}

function parseNonNegativeNumber(value: unknown, fieldLabel: string) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) {
    throw new AdminRequestError(400, `${fieldLabel} must be a valid non-negative number`);
  }
  return parsed;
}

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
    pending_provider_payments: (db.prepare("SELECT COUNT(*) as c FROM provider_registration_drafts WHERE status = 'paid'").get() as any).c,
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

  const providerPaymentRows = db.prepare(`
    SELECT public_id, role, form_json, selected_plan_code, selected_duration_months, selected_amount, created_at, updated_at
    FROM provider_registration_drafts
    WHERE status = 'paid'
    ORDER BY updated_at ASC
  `).all() as any[];

  const providerPayments = providerPaymentRows.map(normalizeProviderPayment);

  res.json({ institutes: pendingInstitutes, tutors: pendingTutors, providerPayments });
});

router.get('/provider-drafts', authenticate, requireRole('admin'), (_req: Request, res: Response): void => {
  const draftRows = db.prepare(`
    SELECT public_id, role, form_json, selected_plan_code, selected_duration_months, selected_amount, status, created_at, updated_at
    FROM provider_registration_drafts
    WHERE status IN ('draft', 'checkout_pending')
    ORDER BY updated_at DESC, created_at DESC
  `).all() as any[];

  res.json({ drafts: draftRows.map(normalizeProviderDraft) });
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

router.post('/provider-payments/:draftId/approve', authenticate, requireRole('admin'), (req: AuthRequest, res: Response): void => {
  try {
    const provider = finalizeProviderDraft(req.params.draftId);
    res.json({
      message: 'Provider payment approved and profile created',
      provider,
      approvedBy: req.user!.id,
    });
  } catch (error) {
    if (error instanceof ProviderDraftActivationError) {
      res.status(error.status).json({ error: error.message });
      return;
    }

    res.status(500).json({ error: 'Unable to approve this provider payment' });
  }
});

router.post('/provider-payments/:draftId/reject', authenticate, requireRole('admin'), (req: AuthRequest, res: Response): void => {
  const draft = db.prepare('SELECT * FROM provider_registration_drafts WHERE public_id = ?').get(req.params.draftId) as any;
  if (!draft) {
    res.status(404).json({ error: 'Draft not found' });
    return;
  }

  if (draft.status !== 'paid') {
    res.status(409).json({ error: 'Only submitted provider payments can be reset' });
    return;
  }

  db.prepare(`
    UPDATE provider_registration_drafts
    SET status = 'checkout_pending', updated_at = CURRENT_TIMESTAMP
    WHERE public_id = ?
  `).run(draft.public_id);

  db.prepare(`
    UPDATE provider_checkout_sessions
    SET status = 'created', gateway_reference = '', updated_at = CURRENT_TIMESTAMP
    WHERE draft_public_id = ? AND status = 'paid'
  `).run(draft.public_id);

  res.json({
    message: 'Provider payment submission was reset. The provider can submit the payment reference again.',
    resetBy: req.user!.id,
  });
});

// GET /api/admin/users
router.get('/users', authenticate, requireRole('admin'), (req: Request, res: Response): void => {
  const page = Math.max(1, parseInt(String(req.query.page || '1'), 10) || 1);
  const limit = Math.max(1, Math.min(1000, parseInt(String(req.query.limit || '20'), 10) || 20));
  const search = String(req.query.search || '').trim();
  const role = String(req.query.role || '').trim();
  const offset = (page - 1) * limit;

  const users = listAdminUsers(search, role, limit, offset);
  const total = countAdminUsers(search, role);
  res.json({ users, total });
});

router.put('/users/:id', authenticate, requireRole('admin'), (req: AuthRequest, res: Response): void => {
  const id = parseInt(req.params.id, 10);
  if (Number.isNaN(id)) {
    res.status(400).json({ error: 'Invalid user id' });
    return;
  }

  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(id) as any;
  if (!user) {
    res.status(404).json({ error: 'User not found' });
    return;
  }

  try {
    const name = parseRequiredText(req.body.name, 'Name');
    const email = parseRequiredText(req.body.email, 'Email').toLowerCase();
    const emailOwner = db.prepare('SELECT id FROM users WHERE email = ? AND id != ?').get(email, id) as any;
    if (emailOwner) {
      throw new AdminRequestError(409, 'This email is already registered to another account');
    }

    db.exec('BEGIN');
    db.prepare('UPDATE users SET name = ?, email = ? WHERE id = ?').run(name, email, id);

    if (user.role === 'institute') {
      const institute = db.prepare('SELECT * FROM institutes WHERE user_id = ?').get(id) as any;
      if (!institute) {
        throw new AdminRequestError(404, 'Linked institute profile not found');
      }

      const location = parseRequiredText(req.body.location, 'Location');
      const status = String(req.body.status || '').trim();
      if (!VALID_PROVIDER_STATUSES.includes(status as typeof VALID_PROVIDER_STATUSES[number])) {
        throw new AdminRequestError(400, 'Institute status must be pending, approved or rejected');
      }

      db.prepare(`
        UPDATE institutes
        SET name = ?, location = ?, description = ?, contact_email = ?, contact_phone = ?, contact_website = ?, status = ?
        WHERE user_id = ?
      `).run(
        name,
        location,
        parseOptionalText(req.body.description),
        parseOptionalText(req.body.contact_email),
        parseOptionalText(req.body.contact_phone),
        parseOptionalText(req.body.contact_website),
        status,
        id,
      );
    }

    if (user.role === 'tutor') {
      const tutor = db.prepare('SELECT * FROM tutors WHERE user_id = ?').get(id) as any;
      if (!tutor) {
        throw new AdminRequestError(404, 'Linked tutor profile not found');
      }

      const subject = parseRequiredText(req.body.subject, 'Subject');
      const mode = String(req.body.mode || '').trim();
      const status = String(req.body.status || '').trim();
      if (!VALID_TUTOR_MODES.includes(mode as typeof VALID_TUTOR_MODES[number])) {
        throw new AdminRequestError(400, 'Tutor mode must be online, offline or both');
      }
      if (!VALID_PROVIDER_STATUSES.includes(status as typeof VALID_PROVIDER_STATUSES[number])) {
        throw new AdminRequestError(400, 'Tutor status must be pending, approved or rejected');
      }

      db.prepare(`
        UPDATE tutors
        SET name = ?, subject = ?, experience_years = ?, hourly_rate = ?, bio = ?, mode = ?, status = ?
        WHERE user_id = ?
      `).run(
        name,
        subject,
        Math.trunc(parseNonNegativeNumber(req.body.experience_years, 'Experience years')),
        parseNonNegativeNumber(req.body.hourly_rate, 'Hourly rate'),
        parseOptionalText(req.body.bio),
        mode,
        status,
        id,
      );
    }

    db.exec('COMMIT');
  } catch (error) {
    try {
      db.exec('ROLLBACK');
    } catch {
      // ignore rollback failures when a transaction was not opened
    }

    if (error instanceof AdminRequestError) {
      res.status(error.status).json({ error: error.message });
      return;
    }

    res.status(500).json({ error: 'Unable to update this user right now' });
    return;
  }

  res.json({
    message: 'User updated successfully',
    user: getAdminUserById(id),
  });
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

router.delete('/provider-drafts/:draftId', authenticate, requireRole('admin'), (_req: AuthRequest, res: Response): void => {
  const draftId = _req.params.draftId;
  const draft = db.prepare('SELECT * FROM provider_registration_drafts WHERE public_id = ?').get(draftId) as any;
  if (!draft) {
    res.status(404).json({ error: 'Draft not found' });
    return;
  }

  if (draft.status === 'converted') {
    res.status(409).json({ error: 'This draft has already been activated. Manage the real account from the users list.' });
    return;
  }

  db.exec('BEGIN');
  try {
    db.prepare('DELETE FROM provider_checkout_sessions WHERE draft_public_id = ?').run(draftId);
    db.prepare('DELETE FROM provider_registration_drafts WHERE public_id = ?').run(draftId);
    db.exec('COMMIT');
  } catch {
    db.exec('ROLLBACK');
    res.status(500).json({ error: 'Unable to delete this draft right now' });
    return;
  }

  res.json({ message: 'Registration draft deleted' });
});

export default router;