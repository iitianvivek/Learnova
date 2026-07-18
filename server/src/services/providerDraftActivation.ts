import db from '../db/database';
import { getPlanByCode, ProviderRole } from '../config/providerPlans';

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

export class ProviderDraftActivationError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

function addMonths(date: Date, months: number): Date {
  const next = new Date(date);
  next.setMonth(next.getMonth() + months);
  return next;
}

export function finalizeProviderDraft(draftId: string) {
  const draft = db.prepare('SELECT * FROM provider_registration_drafts WHERE public_id = ?').get(draftId) as any;
  if (!draft) {
    throw new ProviderDraftActivationError(404, 'Draft not found');
  }

  if (draft.status === 'converted') {
    throw new ProviderDraftActivationError(409, 'Draft has already been finalized');
  }

  if (draft.status !== 'paid') {
    throw new ProviderDraftActivationError(409, 'Payment submission must be approved before finalizing this account');
  }

  const form = JSON.parse(draft.form_json) as DraftFormData;
  const existingUser = db.prepare('SELECT id FROM users WHERE email = ?').get(form.email) as any;
  if (existingUser) {
    throw new ProviderDraftActivationError(409, 'This email is already registered');
  }

  const plan = draft.selected_plan_code ? getPlanByCode(draft.selected_plan_code) : undefined;
  if (!plan) {
    throw new ProviderDraftActivationError(400, 'No plan is attached to this draft');
  }

  const paymentSession = db.prepare(`
    SELECT session_id FROM provider_checkout_sessions
    WHERE draft_public_id = ? AND status = 'paid'
    ORDER BY updated_at DESC LIMIT 1
  `).get(draft.public_id) as any;

  if (!paymentSession) {
    throw new ProviderDraftActivationError(409, 'No submitted payment was found for this draft');
  }

  const result = db.prepare(
    'INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)'
  ).run(form.name, form.email, form.password_hash, draft.role);

  const userId = Number(result.lastInsertRowid);

  try {
    if ((draft.role as ProviderRole) === 'institute') {
      db.prepare(`
        INSERT INTO institutes (user_id, name, location, description, contact_email, contact_phone, contact_website, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, 'approved')
      `).run(userId, form.name, form.location, form.description, form.contact_email || form.email, form.contact_phone, form.contact_website);
    } else {
      db.prepare(`
        INSERT INTO tutors (user_id, name, subject, experience_years, hourly_rate, bio, mode, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, 'approved')
      `).run(userId, form.name, form.subject, form.experience_years, form.hourly_rate, form.bio, form.mode);
    }

    const startsAt = new Date();
    const endsAt = addMonths(startsAt, draft.selected_duration_months);

    db.prepare(`
      INSERT INTO provider_subscriptions (user_id, role, plan_code, duration_months, amount, payment_session_id, starts_at, ends_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      userId,
      draft.role,
      plan.code,
      draft.selected_duration_months,
      draft.selected_amount,
      paymentSession.session_id,
      startsAt.toISOString(),
      endsAt.toISOString(),
    );

    db.prepare(`
      UPDATE provider_registration_drafts
      SET status = 'converted', updated_at = CURRENT_TIMESTAMP
      WHERE public_id = ?
    `).run(draft.public_id);
  } catch {
    db.prepare('DELETE FROM users WHERE id = ?').run(userId);
    throw new ProviderDraftActivationError(500, 'Unable to finalize provider account');
  }

  return {
    userId,
    role: draft.role as ProviderRole,
    name: form.name,
    email: form.email,
    planCode: plan.code,
    durationMonths: draft.selected_duration_months,
    amount: draft.selected_amount,
  };
}