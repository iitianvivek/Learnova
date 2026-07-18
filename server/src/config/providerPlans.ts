export type ProviderRole = 'institute' | 'tutor';
export type BillingDurationMonths = 1 | 3 | 6 | 12;
export const PROVIDER_LAUNCH_COUPON_CODE = 'FIRSTFIFTY';

export interface ProviderPlan {
  role: ProviderRole;
  code: string;
  name: string;
  audience: string;
  originalMonthly: number;
  launchMonthly: number;
  badge?: string;
  cta: string;
  durationPricing: Record<BillingDurationMonths, number>;
  included: string[];
  notIncluded?: string[];
  plusLabel?: string;
  extraFeatures?: string[];
  cardStyle: 'starter' | 'popular' | 'elite';
}

export const PROVIDER_PLANS: ProviderPlan[] = [
  {
    role: 'institute',
    code: 'academy_starter',
    name: 'Academy Starter',
    audience: 'Best for: New Academies',
    originalMonthly: 999,
    launchMonthly: 499,
    cta: 'Join Starter',
    durationPricing: { 1: 499, 3: 1275, 6: 4800, 12: 9000 },
    included: [
      'Academy Listing',
      'Contact Details',
      'Course List',
      'Address & Google Map',
      'WhatsApp Button',
      'Gallery (5 Images)',
      'Basic Search Visibility',
    ],
    notIncluded: [
      'Reviews & Ratings',
      'Demo Requests',
      'Teacher Profiles',
      'Analytics',
      'Featured Listing',
      'Lead Dashboard',
      'Priority Support',
    ],
    cardStyle: 'starter',
  },
  {
    role: 'institute',
    code: 'academy_growth',
    name: 'Academy Growth',
    audience: 'Best for: Growing Academies',
    originalMonthly: 1999,
    launchMonthly: 999,
    badge: 'Most Popular',
    cta: 'Choose Growth',
    durationPricing: { 1: 999, 3: 2550, 6: 9600, 12: 18000 },
    included: ['Everything in Starter'],
    plusLabel: 'Includes everything in Starter PLUS',
    extraFeatures: [
      'Student Reviews & Ratings',
      'Demo Class Requests',
      'Teacher Profiles',
      'Unlimited Gallery',
      'Website & Social Media Links',
      'Student Enquiry Dashboard',
      'Analytics & Performance Reports',
      'Featured in Category',
      'Verified Badge',
      'Priority Search Ranking',
      'Basic Marketing Support',
    ],
    cardStyle: 'popular',
  },
  {
    role: 'institute',
    code: 'academy_elite',
    name: 'Academy Elite',
    audience: 'Best for: Established Academies',
    originalMonthly: 3499,
    launchMonthly: 1749,
    cta: 'Go Elite',
    durationPricing: { 1: 1749, 3: 4499, 6: 16999, 12: 32999 },
    included: ['Everything in Growth'],
    plusLabel: 'Includes everything in Growth PLUS',
    extraFeatures: [
      'Homepage Featured Placement',
      'Top Search Placement',
      'Premium Academy Badge',
      'AI Profile Optimization',
      'Unlimited Teacher Profiles',
      'Unlimited Videos & Gallery',
      'Unlimited Courses',
      'Dedicated Account Manager',
      'Sponsored Listing',
      'Promotional Banner',
      'Student Interest Analytics',
      'Conversion Analytics',
      'Marketing Campaign Support',
      'Premium Support',
    ],
    cardStyle: 'elite',
  },
  {
    role: 'tutor',
    code: 'tutor_starter',
    name: 'Tutor Starter',
    audience: 'Best for: Individual Tutors',
    originalMonthly: 199,
    launchMonthly: 99,
    cta: 'Join Starter',
    durationPricing: { 1: 99, 3: 249, 6: 899, 12: 1699 },
    included: [
      'Tutor Profile',
      'Subjects',
      'Qualification',
      'Experience',
      'Contact Details',
    ],
    notIncluded: [
      'WhatsApp Button',
      'City Listing',
      'Basic Search Listing',
      'Reviews & Ratings',
      'Demo Booking',
      'Analytics',
    ],
    cardStyle: 'starter',
  },
  {
    role: 'tutor',
    code: 'tutor_pro',
    name: 'Tutor Pro',
    audience: 'Best for: Professional Tutors',
    originalMonthly: 399,
    launchMonthly: 199,
    badge: 'Popular Pick',
    cta: 'Choose Pro',
    durationPricing: { 1: 199, 3: 499, 6: 1899, 12: 3599 },
    included: ['Everything in Starter'],
    plusLabel: 'Includes everything in Starter PLUS',
    extraFeatures: [
      'Reviews & Ratings',
      'Demo Class Booking',
      'Featured Search',
      'Gallery (4 Images)',
      'Social Media Links',
      'Student Enquiries',
      'Monthly Analytics',
      'Profile Verification',
      'Priority Support',
    ],
    cardStyle: 'popular',
  },
  {
    role: 'tutor',
    code: 'tutor_elite',
    name: 'Tutor Elite',
    audience: 'Best for: Top Tutors',
    originalMonthly: 749,
    launchMonthly: 349,
    cta: 'Go Elite',
    durationPricing: { 1: 349, 3: 899, 6: 3599, 12: 6999 },
    included: ['Everything in Pro'],
    plusLabel: 'Includes everything in Pro PLUS',
    extraFeatures: [
      'Homepage Featured Placement',
      'Top Search Placement',
      'AI Profile Optimization',
      'Premium Badge',
      'Unlimited Videos & Gallery',
      'Unlimited Subjects',
      'Priority Listing',
      'Conversion Analytics',
      'Marketing Promotion',
      'Premium Support',
    ],
    cardStyle: 'elite',
  },
];

export function getPlansByRole(role: ProviderRole): ProviderPlan[] {
  return PROVIDER_PLANS.filter((plan) => plan.role === role);
}

export function getPlanByCode(code: string): ProviderPlan | undefined {
  return PROVIDER_PLANS.find((plan) => plan.code === code);
}

export function hasLaunchCoupon(code: unknown): boolean {
  return String(code || '').trim().toUpperCase() === PROVIDER_LAUNCH_COUPON_CODE;
}

export function getPlanTotal(plan: ProviderPlan, durationMonths: BillingDurationMonths, couponCode?: unknown): number {
  if (hasLaunchCoupon(couponCode)) {
    return plan.durationPricing[durationMonths];
  }

  return plan.originalMonthly * durationMonths;
}