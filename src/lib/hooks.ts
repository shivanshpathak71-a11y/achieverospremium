import { useState, useEffect, useCallback } from 'react';
import { supabase, type Subject, type Chapter, type Lecture } from './supabase';

export function useSubjects() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    supabase.from('subjects').select('*').order('sort_order').then(({ data, error }) => {
      if (!error && data) setSubjects(data as Subject[]);
      setLoading(false);
    });
  }, []);
  return { subjects, loading };
}

export function useSubject(slug: string | undefined) {
  const [subject, setSubject] = useState<Subject | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    if (!slug) { setLoading(false); return; }
    supabase.from('subjects').select('*').eq('slug', slug).maybeSingle().then(({ data }) => {
      setSubject(data as Subject | null);
      setLoading(false);
    });
  }, [slug]);
  return { subject, loading };
}

export function useAllChapters() {
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    supabase.from('chapters').select('*, subject:subjects(*)').order('sort_order').then(({ data, error }) => {
      if (!error && data) setChapters(data as Chapter[]);
      setLoading(false);
    });
  }, []);
  return { chapters, loading };
}

export function useChapters(subjectId?: string) {
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    if (!subjectId) { setLoading(false); return; }
    supabase.from('chapters').select('*').eq('subject_id', subjectId).order('sort_order').then(({ data, error }) => {
      if (!error && data) setChapters(data as Chapter[]);
      setLoading(false);
    });
  }, [subjectId]);
  return { chapters, loading };
}

export function useChaptersBySubjectSlug(slug: string | undefined) {
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    if (!slug) { setLoading(false); return; }
    supabase.from('chapters').select('*, subject:subjects!inner(*)').eq('subject.slug', slug).order('sort_order').then(({ data, error }) => {
      if (!error && data) setChapters(data as Chapter[]);
      setLoading(false);
    });
  }, [slug]);
  return { chapters, loading };
}

export function useLectures(chapterId?: string) {
  const [lectures, setLectures] = useState<Lecture[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    if (!chapterId) { setLoading(false); return; }
    supabase.from('lectures').select('*').eq('chapter_id', chapterId).order('sort_order').then(({ data, error }) => {
      if (!error && data) setLectures(data as Lecture[]);
      setLoading(false);
    });
  }, [chapterId]);
  return { lectures, loading };
}

export function useAllLectures() {
  const [lectures, setLectures] = useState<Lecture[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    supabase.from('lectures').select('*, chapter:chapters(*, subject:subjects(*))').order('sort_order').then(({ data, error }) => {
      if (!error && data) setLectures(data as Lecture[]);
      setLoading(false);
    });
  }, []);
  return { lectures, loading };
}

export function useLectureById(id: string | undefined) {
  const [lecture, setLecture] = useState<Lecture | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    if (!id) { setLoading(false); return; }
    supabase.from('lectures').select('*, chapter:chapters(*, subject:subjects(*))').eq('id', id).maybeSingle().then(({ data }) => {
      setLecture(data as Lecture | null);
      setLoading(false);
    });
  }, [id]);
  return { lecture, loading };
}

export function formatDuration(seconds: number): string {
  if (!seconds || seconds < 1) return '0:00';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function useAdminStatus() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [checking, setChecking] = useState(true);
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session?.user) {
        supabase.from('admin_users').select('id, role').eq('user_id', data.session.user.id).maybeSingle()
          .then(({ data: adminData }) => { setIsAdmin(!!adminData && adminData.role === 'admin'); setChecking(false); });
      } else { setChecking(false); }
    });
  }, []);
  const checkAdmin = useCallback(() => {
    setChecking(true);
    supabase.auth.getSession().then(({ data }) => {
      if (data.session?.user) {
        supabase.from('admin_users').select('id, role').eq('user_id', data.session.user.id).maybeSingle()
          .then(({ data: adminData }) => { setIsAdmin(!!adminData && adminData.role === 'admin'); setChecking(false); });
      } else { setIsAdmin(false); setChecking(false); }
    });
  }, []);
  return { isAdmin, checking, checkAdmin };
}
