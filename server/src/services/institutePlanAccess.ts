import db from '../db/database';
import { getPlanByCode } from '../config/providerPlans';

export interface InstitutePlanFeatures {
  maxImages: number | null;
  reviewsEnabled: boolean;
  starTeachersEnabled: boolean;
  enquiriesEnabled: boolean;
  publicSearchEnabled: boolean;
  isLegacyAccess: boolean;
}

export interface InstitutePlanAccess {
  planCode: string | null;
  planName: string | null;
  features: InstitutePlanFeatures;
}

const LEGACY_FEATURES: InstitutePlanFeatures = {
  maxImages: null,
  reviewsEnabled: true,
  starTeachersEnabled: true,
  enquiriesEnabled: true,
  publicSearchEnabled: true,
  isLegacyAccess: true,
};

export function getInstitutePlanFeatures(planCode?: string | null): InstitutePlanFeatures {
  if (!planCode) {
    return LEGACY_FEATURES;
  }

  switch (planCode) {
    case 'academy_starter':
      return {
        maxImages: 5,
        reviewsEnabled: false,
        starTeachersEnabled: false,
        enquiriesEnabled: false,
        publicSearchEnabled: true,
        isLegacyAccess: false,
      };
    case 'academy_growth':
    case 'academy_elite':
      return {
        maxImages: null,
        reviewsEnabled: true,
        starTeachersEnabled: true,
        enquiriesEnabled: true,
        publicSearchEnabled: true,
        isLegacyAccess: false,
      };
    default:
      return LEGACY_FEATURES;
  }
}

export function getInstitutePlanAccessByUserId(userId: number): InstitutePlanAccess {
  const subscription = db.prepare(`
    SELECT plan_code
    FROM provider_subscriptions
    WHERE user_id = ? AND role = 'institute' AND status = 'active'
    ORDER BY datetime(created_at) DESC, id DESC
    LIMIT 1
  `).get(userId) as { plan_code?: string } | undefined;

  const planCode = subscription?.plan_code || null;
  const plan = planCode ? getPlanByCode(planCode) : undefined;

  return {
    planCode,
    planName: plan?.name || null,
    features: getInstitutePlanFeatures(planCode),
  };
}

export function getInstitutePlanAccessByInstituteId(instituteId: number): InstitutePlanAccess {
  const institute = db.prepare('SELECT user_id FROM institutes WHERE id = ?').get(instituteId) as { user_id?: number } | undefined;
  if (!institute?.user_id) {
    return {
      planCode: null,
      planName: null,
      features: LEGACY_FEATURES,
    };
  }

  return getInstitutePlanAccessByUserId(institute.user_id);
}