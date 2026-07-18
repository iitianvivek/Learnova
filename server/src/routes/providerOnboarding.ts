import crypto from 'node:crypto';
import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import db from '../db/database';
import {
  BillingDurationMonths,
  getPlanByCode,
  getPlansByRole,
  getPlanTotal,
  hasLaunchCoupon,
  ProviderRole,
  PROVIDER_LAUNCH_COUPON_CODE,
} from '../config/providerPlans';

const router = Router();
const BILLING_DURATIONS: BillingDurationMonths[] = [1, 3, 6, 12];

type DraftFormData = {
  name: string;
  email: string;
  password_hash: string;
  location: string;
  description: string;
  contact_email: string;
  contact_phone: string;
  contact_website: string;
  subject: string;
  experience_years: number;
  hourly_rate: number;
  bio: string;
  mode: 'online' | 'offline' | 'both';
};

type DraftSummary = {
  draftId: string;
  role: ProviderRole;
  name: string;
  email: string;
  location?: string;
  subject?: string;
  selectedPlanCode?: string | null;
  selectedDurationMonths?: BillingDurationMonths | null;
  selectedAmount?: number | null;
  appliedCouponCode?: string | null;
  status: string;
};

function parseRole(value: unknown): ProviderRole | null {
  return value === 'institute' || value === 'tutor' ? value : null;
}

function getAppliedCouponCode(planCode: string | null, durationMonths: BillingDurationMonths | null, amount: number | null): string | null {
  if (!planCode || !durationMonths || amount === null || amount === undefined) {
    return null;
  }

  const plan = getPlanByCode(planCode);
  if (!plan) {
    return null;
  }

  return amount === plan.durationPricing[durationMonths] ? PROVIDER_LAUNCH_COUPON_CODE : null;
}

function normalizeDraftRow(row: any): DraftSummary {
  const form = JSON.parse(row.form_json) as DraftFormData;
  return {
    draftId: row.public_id,
    role: row.role,
    name: form.name,
    email: form.email,
    location: form.location || undefined,
    subject: form.subject || undefined,
    selectedPlanCode: row.selected_plan_code,
    selectedDurationMonths: row.selected_duration_months,
    selectedAmount: row.selected_amount,
    appliedCouponCode: getAppliedCouponCode(row.selected_plan_code, row.selected_duration_months, row.selected_amount),
    status: row.status,
  };
}

function normalizeForm(reqBody: any, role: ProviderRole): DraftFormData | { error: string } {
  const name = reqBody.name?.trim();
  const email = reqBody.email?.trim().toLowerCase();
  const password = reqBody.password;

  if (!name || !email || !password) {
    return { error: 'Name, email and password are required' };
  }

  if (password.length < 6) {
    return { error: 'Password must be at least 6 characters' };
  }

  if (role === 'institute' && !reqBody.location?.trim()) {
    return { error: 'Location is required for academies' };
  }

  if (role === 'tutor' && !reqBody.subject?.trim()) {
    return { error: 'Subject is required for tutors' };
  }

  const mode = ['online', 'offline', 'both'].includes(reqBody.mode) ? reqBody.mode : 'both';

  return {
    name,
    email,
    password_hash: bcrypt.hashSync(password, 10),
    location: reqBody.location?.trim() || '',
    description: reqBody.description?.trim() || '',
    contact_email: reqBody.contact_email?.trim() || email,
    contact_phone: reqBody.contact_phone?.trim() || '',
    contact_website: reqBody.contact_website?.trim() || '',
    subject: reqBody.subject?.trim() || '',
    experience_years: parseInt(reqBody.experience_years, 10) || 0,
    hourly_rate: parseFloat(reqBody.hourly_rate) || 0,
    bio: reqBody.bio?.trim() || '',
    mode,
  };
}

function loadDraft(publicId: string): any | null {
  return db.prepare('SELECT * FROM provider_registration_drafts WHERE public_id = ?').get(publicId) as any;
}

router.get('/plans', (req: Request, res: Response): void => {
  const role = parseRole(req.query.role);
  if (!role) {
    res.status(400).json({ error: 'role must be tutor or institute' });
    return;
  }
  res.json({ plans: getPlansByRole(role), couponCode: PROVIDER_LAUNCH_COUPON_CODE });
});

router.post('/drafts', (req: Request, res: Response): void => {
  const role = parseRole(req.body.role);
  if (!role) {
    res.status(400).json({ error: 'role must be tutor or institute' });
    return;
  }

  const existingUser = db.prepare('SELECT id FROM users WHERE email = ?').get(String(req.body.email || '').trim().toLowerCase());
  if (existingUser) {
    res.status(409).json({ error: 'This email is already registered' });
    return;
  }

  const normalized = normalizeForm(req.body, role);
  if ('error' in normalized) {
    res.status(400).json({ error: normalized.error });
    return;
  }

  const publicId = crypto.randomUUID();
  db.prepare(`
    INSERT INTO provider_registration_drafts (public_id, role, form_json, status)
    VALUES (?, ?, ?, 'draft')
  `).run(publicId, role, JSON.stringify(normalized));

  const draft = loadDraft(publicId);
  res.status(201).json({ draft: normalizeDraftRow(draft) });
});

router.get('/drafts/:draftId', (req: Request, res: Response): void => {
  const draft = loadDraft(req.params.draftId);
  if (!draft) {
    res.status(404).json({ error: 'Draft not found' });
    return;
  }
  res.json({ draft: normalizeDraftRow(draft) });
});

router.post('/drafts/:draftId/selection', (req: Request, res: Response): void => {
  const draft = loadDraft(req.params.draftId);
  if (!draft) {
    res.status(404).json({ error: 'Draft not found' });
    return;
  }

  const planCode = String(req.body.planCode || '');
  const durationMonths = Number(req.body.durationMonths) as BillingDurationMonths;
  const couponCode = String(req.body.couponCode || '').trim();
  const plan = getPlanByCode(planCode);

  if (!plan || plan.role !== draft.role) {
    res.status(400).json({ error: 'Selected plan is invalid for this provider type' });
    return;
  }

  if (!BILLING_DURATIONS.includes(durationMonths)) {
    res.status(400).json({ error: 'Billing duration must be 1, 3, 6, or 12 months' });
    return;
  }

  if (couponCode && !hasLaunchCoupon(couponCode)) {
    res.status(400).json({ error: 'Coupon code is invalid' });
    return;
  }

  const amount = getPlanTotal(plan, durationMonths, couponCode);
  const appliedCouponCode = hasLaunchCoupon(couponCode) ? PROVIDER_LAUNCH_COUPON_CODE : null;
  const sessionId = crypto.randomUUID();

  db.prepare(`
    UPDATE provider_registration_drafts
    SET selected_plan_code = ?, selected_duration_months = ?, selected_amount = ?, status = 'checkout_pending', updated_at = CURRENT_TIMESTAMP
    WHERE public_id = ?
  `).run(plan.code, durationMonths, amount, draft.public_id);

  db.prepare(`
    INSERT INTO provider_checkout_sessions (session_id, draft_public_id, plan_code, duration_months, amount, status)
    VALUES (?, ?, ?, ?, ?, 'created')
  `).run(sessionId, draft.public_id, plan.code, durationMonths, amount);

  const updatedDraft = loadDraft(draft.public_id);
  res.status(201).json({
    checkoutSession: {
      sessionId,
      draftId: draft.public_id,
      role: draft.role,
      plan,
      durationMonths,
      amount,
      currency: 'INR',
      status: 'created',
      gateway: 'local_placeholder',
      appliedCouponCode,
      providerSummary: normalizeDraftRow(updatedDraft),
    },
  });
});

router.get('/checkout/:sessionId', (req: Request, res: Response): void => {
  const session = db.prepare('SELECT * FROM provider_checkout_sessions WHERE session_id = ?').get(req.params.sessionId) as any;
  if (!session) {
    res.status(404).json({ error: 'Checkout session not found' });
    return;
  }

  const draft = loadDraft(session.draft_public_id);
  const plan = getPlanByCode(session.plan_code);
  if (!draft || !plan) {
    res.status(404).json({ error: 'Checkout session is no longer valid' });
    return;
  }

  const appliedCouponCode = getAppliedCouponCode(session.plan_code, session.duration_months, session.amount);

  res.json({
    checkoutSession: {
      sessionId: session.session_id,
      draftId: session.draft_public_id,
      role: draft.role,
      plan,
      durationMonths: session.duration_months,
      amount: session.amount,
      currency: session.currency,
      status: session.status,
      gateway: session.gateway,
      appliedCouponCode,
      paymentReference: session.gateway_reference || null,
      providerSummary: normalizeDraftRow(draft),
    },
  });
});

router.post('/checkout/:sessionId/complete-local', (req: Request, res: Response): void => {
  const session = db.prepare('SELECT * FROM provider_checkout_sessions WHERE session_id = ?').get(req.params.sessionId) as any;
  if (!session) {
    res.status(404).json({ error: 'Checkout session not found' });
    return;
  }

  if (session.status === 'paid') {
    res.json({ message: 'Payment has already been submitted for admin approval', draftId: session.draft_public_id });
    return;
  }

  const paymentReference = String(req.body.paymentReference || '').trim();
  if (!paymentReference) {
    res.status(400).json({ error: 'Payment reference or UTR is required' });
    return;
  }

  db.prepare(`
    UPDATE provider_checkout_sessions
    SET status = 'paid', gateway_reference = ?, updated_at = CURRENT_TIMESTAMP
    WHERE session_id = ?
  `).run(paymentReference, session.session_id);

  db.prepare(`
    UPDATE provider_registration_drafts
    SET status = 'paid', updated_at = CURRENT_TIMESTAMP
    WHERE public_id = ?
  `).run(session.draft_public_id);

  res.json({
    message: 'Payment submitted. It is now waiting for admin approval before the profile is created.',
    draftId: session.draft_public_id,
    paymentReference,
  });
});

router.post('/finalize/:draftId', (req: Request, res: Response): void => {
  res.status(403).json({
    error: 'Provider activation now happens only after admin approval of the submitted QR payment.',
  });
});

export default router;