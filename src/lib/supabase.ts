import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(url, anonKey, {
  auth: { persistSession: true, autoRefreshToken: true },
});

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

export interface Lecture {
  id: string;
  chapter_id: string;
  slug: string;
  title: string;
  description: string | null;
  video_url: string | null;
  pdf_url: string | null;
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
  chapter?: Chapter;
}
