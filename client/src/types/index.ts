export interface User {
  id: number;
  name: string;
  email: string;
  role: 'student' | 'tutor' | 'institute' | 'admin';
  created_at?: string;
}

export type RegistrationRole = 'student' | 'tutor' | 'institute';

export type ProviderRole = 'tutor' | 'institute';

export type BillingDurationMonths = 1 | 3 | 6 | 12;

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

export interface ProviderPlanCatalogResponse {
  plans: ProviderPlan[];
  couponCode: string;
}

export interface RegistrationFormDraft {
  name: string;
  email: string;
  password: string;
  location: string;
  description: string;
  contact_email: string;
  contact_phone: string;
  contact_website: string;
  subject: string;
  experience_years: string;
  hourly_rate: string;
  bio: string;
  mode: 'online' | 'offline' | 'both';
}

export interface ProviderRegistrationDraft {
  role: ProviderRole;
  form: RegistrationFormDraft;
}

export interface ProviderDraftSummary {
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
}

export interface ProviderCheckoutSession {
  sessionId: string;
  draftId: string;
  role: ProviderRole;
  plan: ProviderPlan;
  durationMonths: BillingDurationMonths;
  amount: number;
  currency: string;
  status: string;
  gateway: string;
  appliedCouponCode?: string | null;
  paymentReference?: string | null;
  providerSummary: ProviderDraftSummary;
}

export interface InstituteImage {
  id: number;
  file_path: string;
}

export interface CourseBasic {
  name: string;
  category: string;
}

export interface InstituteCourse {
  id: number;
  course_id: number;
  course_name: string;
  category: string;
  fee_structure: string;
  duration: string;
}

export interface StarTeacher {
  id: number;
  name: string;
  subject: string;
  experience_years: number;
  hourly_rate: number;
  avatar: string | null;
}

export interface ProviderPlanFeatures {
  maxImages: number | null;
  reviewsEnabled: boolean;
  enquiriesEnabled: boolean;
  publicSearchEnabled: boolean;
  starTeachersEnabled: boolean;
  isLegacyAccess: boolean;
}

export interface Institute {
  id: number;
  user_id: number;
  name: string;
  location: string;
  description: string;
  contact_email: string;
  contact_phone: string;
  contact_website: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  avg_rating: number;
  review_count: number;
  thumbnail?: string | null;
  images?: InstituteImage[];
  courses?: InstituteCourse[];
  star_teachers?: StarTeacher[];
  subscription_plan_code?: string | null;
  subscription_plan_name?: string | null;
  plan_features?: ProviderPlanFeatures;
}

export interface Availability {
  id?: number;
  day_of_week: string;
  start_time: string;
  end_time: string;
}

export interface TutorImage {
  id: number;
  file_path: string;
}

export interface Tutor {
  id: number;
  user_id: number;
  name: string;
  subject: string;
  experience_years: number;
  hourly_rate: number;
  bio: string;
  mode: 'online' | 'offline' | 'both';
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  avg_rating: number;
  review_count: number;
  avatar?: string | null;
  images?: TutorImage[];
  availability?: Availability[];
  subscription_plan_code?: string | null;
  subscription_plan_name?: string | null;
  plan_features?: ProviderPlanFeatures;
}

export interface Review {
  id: number;
  reviewer_id: number;
  reviewer_name: string;
  target_id: number;
  target_type: 'institute' | 'tutor';
  rating: number;
  comment: string;
  created_at: string;
}

export interface Bookmark {
  id: number;
  target_id: number;
  target_type: 'institute' | 'tutor';
  name: string;
  location?: string;
  subject?: string;
  thumbnail?: string | null;
  created_at: string;
}

export interface Course {
  id: number;
  name: string;
  category: string;
}

export interface SearchResults {
  institutes: Institute[];
  tutors: Tutor[];
}

export interface CompareResult {
  items: (Institute | Tutor)[];
  sharedCourseIds?: number[];
  type: 'institute' | 'tutor';
}

export interface AdminStats {
  total_users: number;
  total_students: number;
  total_institutes: number;
  approved_institutes: number;
  pending_institutes: number;
  total_tutors: number;
  approved_tutors: number;
  pending_tutors: number;
  pending_provider_payments: number;
  total_reviews: number;
  total_bookmarks: number;
}

export interface AdminManagedSubscription {
  planCode: string;
  durationMonths: number;
  amount: number;
  currency: string;
  status: string;
  startsAt: string;
  endsAt: string;
}

export interface AdminManagedInstituteProfile {
  id: number;
  status: 'pending' | 'approved' | 'rejected';
  location: string;
  description: string;
  contact_email: string;
  contact_phone: string;
  contact_website: string;
}

export interface AdminManagedTutorProfile {
  id: number;
  status: 'pending' | 'approved' | 'rejected';
  subject: string;
  experience_years: number;
  hourly_rate: number;
  bio: string;
  mode: 'online' | 'offline' | 'both';
}

export interface AdminManagedUser {
  id: number;
  name: string;
  email: string;
  role: 'student' | 'tutor' | 'institute' | 'admin';
  created_at: string;
  profile: AdminManagedInstituteProfile | AdminManagedTutorProfile | null;
  subscription: AdminManagedSubscription | null;
}

export interface AdminProviderDraft {
  draftId: string;
  role: 'tutor' | 'institute';
  name: string;
  email: string;
  location?: string;
  subject?: string;
  description?: string;
  contactEmail?: string;
  contactPhone?: string;
  contactWebsite?: string;
  experienceYears?: number;
  hourlyRate?: number;
  bio?: string;
  mode?: 'online' | 'offline' | 'both';
  selectedPlanCode?: string | null;
  selectedPlanName?: string;
  selectedDurationMonths?: number | null;
  selectedAmount?: number | null;
  checkoutStatus?: string | null;
  paymentReference?: string;
  status: 'draft' | 'checkout_pending' | 'paid' | 'converted' | 'expired';
  createdAt: string;
  updatedAt: string;
}

export interface Enquiry {
  id: number;
  student_id: number;
  target_id: number;
  target_type: 'institute' | 'tutor';
  target_name?: string;
  message: string;
  student_name: string;
  student_email: string;
  student_phone: string;
  status: 'new' | 'read' | 'replied';
  created_at: string;
}