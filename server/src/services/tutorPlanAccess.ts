import db from '../db/database';
import { getPlanByCode } from '../config/providerPlans';

export interface TutorPlanFeatures {
  maxImages: number | null;
  reviewsEnabled: boolean;
  enquiriesEnabled: boolean;
  publicSearchEnabled: boolean;
  isLegacyAccess: boolean;
}

export interface TutorPlanAccess {
  planCode: string | null;
  planName: string | null;
  features: TutorPlanFeatures;
}

const LEGACY_FEATURES: TutorPlanFeatures = {
  maxImages: null,
  reviewsEnabled: true,
  enquiriesEnabled: true,
  publicSearchEnabled: true,
  isLegacyAccess: true,
};

export function getTutorPlanFeatures(planCode?: string | null): TutorPlanFeatures {
  if (!planCode) {
    return LEGACY_FEATURES;
  }

  switch (planCode) {
    case 'tutor_starter':
      return {
        maxImages: 0,
        reviewsEnabled: false,
        enquiriesEnabled: false,
        publicSearchEnabled: false,
        isLegacyAccess: false,
      };
    case 'tutor_pro':
      return {
        maxImages: 4,
        reviewsEnabled: true,
        enquiriesEnabled: true,
        publicSearchEnabled: true,
        isLegacyAccess: false,
      };
    case 'tutor_elite':
      return {
        maxImages: null,
        reviewsEnabled: true,
        enquiriesEnabled: true,
        publicSearchEnabled: true,
        isLegacyAccess: false,
      };
    default:
      return LEGACY_FEATURES;
  }
}

export function getTutorPlanAccessByUserId(userId: number): TutorPlanAccess {
  const subscription = db.prepare(`
    SELECT plan_code
    FROM provider_subscriptions
    WHERE user_id = ? AND role = 'tutor' AND status = 'active'
    ORDER BY datetime(created_at) DESC, id DESC
    LIMIT 1
  `).get(userId) as { plan_code?: string } | undefined;

  const planCode = subscription?.plan_code || null;
  const plan = planCode ? getPlanByCode(planCode) : undefined;

  return {
    planCode,
    planName: plan?.name || null,
    features: getTutorPlanFeatures(planCode),
  };
}

export function getTutorPlanAccessByTutorId(tutorId: number): TutorPlanAccess {
  const tutor = db.prepare('SELECT user_id FROM tutors WHERE id = ?').get(tutorId) as { user_id?: number } | undefined;
  if (!tutor?.user_id) {
    return {
      planCode: null,
      planName: null,
      features: LEGACY_FEATURES,
    };
  }

  return getTutorPlanAccessByUserId(tutor.user_id);
}
