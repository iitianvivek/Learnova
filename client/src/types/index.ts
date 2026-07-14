export interface User {
  id: number;
  name: string;
  email: string;
  role: 'student' | 'tutor' | 'institute' | 'admin';
  created_at?: string;
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
  total_reviews: number;
  total_bookmarks: number;
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