import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(url, anonKey, {
  auth: { persistSession: true, autoRefreshToken: true },
});

export interface TimeTableEntry {
  topic: string;
  time: string;
  _id?: string;
}

export interface FAQEntry {
  id?: string;
  question: string;
  answer: string;
}

export interface FacultyDetails {
  id?: string;
  name: string;
  designation?: string;
  bio?: string;
  imageUrl?: string;
  experience?: string;
  reach?: string;
  description?: string;
  socialLinks?: string[];
  videoUrl?: string;
}

export interface Subject {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  icon: string | null;
  color: string | null;
  gradient: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
  banner_url: string | null;
  banner_square_url: string | null;
  validity: string | null;
  price: number | null;
  discount_price: number | null;
  live_classes_count: number | null;
  recorded_classes_count: number | null;
  student_count: number | null;
  time_table: TimeTableEntry[] | null;
  faqs: FAQEntry[] | null;
  faculty_details: FacultyDetails | null;
  course_highlights: string[] | null;
  intro_video_id: string | null;
  main_category: string | null;
  source_batch_id: string | null;
  short_description: string | null;
  is_free: boolean;
  is_recorded: boolean;
  demo_video_url: string | null;
}

export interface Chapter {
  id: string;
  subject_id: string;
  slug: string;
  title: string;
  description: string | null;
  sort_order: number;
  created_at: string;
  lecture_count?: number;
  subject?: Subject;
}

export interface ClassTest {
  name: string;
  seriesId: number | null;
  maxAttemptedLimit: number | null;
}

export interface PdfNameEntry {
  name: string;
  url: string;
}

export interface CourseNote {
  id: string;
  subject_id: string;
  source_id: string | null;
  title: string;
  description: string | null;
  pdf_url: string;
  teacher_name: string | null;
  category_name: string | null;
  section_name: string | null;
  topic_name: string | null;
  is_free: boolean;
  sort_order: number;
  source_created_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Lecture {
  id: string;
  chapter_id: string;
  slug: string;
  title: string;
  description: string | null;
  video_url: string | null;
  pdf_url: string | null;
  pdf_urls: string[] | null;
  pdf_names: PdfNameEntry[] | null;
  class_tests: ClassTest[] | null;
  source_video_urls: string[] | null;
  is_live: boolean;
  is_chat: boolean;
  thumbnail_url: string | null;
  duration_seconds: number;
  teacher_name: string | null;
  difficulty: string | null;
  is_pinned: boolean;
  is_new: boolean;
  notes: string | null;
  watch_count: number;
  sort_order: number;
  created_at: string;
  updated_at: string;
  unique_view_count: number;
  is_free: boolean;
  is_blinking: boolean;
  start_date: string | null;
  end_date: string | null;
  section_name: string | null;
  source_lecture_url: string | null;
  chapter?: Chapter;
}
