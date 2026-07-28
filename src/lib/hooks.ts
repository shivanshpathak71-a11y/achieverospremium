import { useState, useEffect, useCallback } from 'react';
import { supabase, type Subject, type Chapter, type Lecture, type CourseNote, type Teacher, type Folder, type Topic } from './supabase';

// ── Format helpers ──────────────────────────────────────────
export function formatDuration(seconds: number): string {
  if (!seconds || seconds < 0) return '0m';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

// ── Subjects ─────────────────────────────────────────────────
export function useSubjects() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    supabase
      .from('subjects')
      .select('*')
      .order('sort_order', { ascending: true })
      .then(({ data, error }) => {
        if (mounted) {
          if (!error && data) setSubjects(data as Subject[]);
          setLoading(false);
        }
      });
    return () => { mounted = false; };
  }, []);

  return { subjects, loading };
}

export function useSubject(slug: string | undefined) {
  const [subject, setSubject] = useState<Subject | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) { setLoading(false); return; }
    let mounted = true;
    supabase
      .from('subjects')
      .select('*')
      .eq('slug', slug)
      .single()
      .then(({ data, error }) => {
        if (mounted) {
          if (!error && data) setSubject(data as Subject);
          setLoading(false);
        }
      });
    return () => { mounted = false; };
  }, [slug]);

  return { subject, loading };
}

// ── Chapters ──────────────────────────────────────────────────
export function useChapters(subjectId: string | undefined) {
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!subjectId) { setLoading(false); return; }
    let mounted = true;
    supabase
      .from('chapters')
      .select('*')
      .eq('subject_id', subjectId)
      .order('sort_order', { ascending: true })
      .then(({ data, error }) => {
        if (mounted) {
          if (!error && data) setChapters(data as Chapter[]);
          setLoading(false);
        }
      });
    return () => { mounted = false; };
  }, [subjectId]);

  return { chapters, loading };
}

export function useChaptersBySubjectSlug(slug: string | undefined) {
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) { setLoading(false); return; }
    let mounted = true;
    supabase
      .from('chapters')
      .select('*, subject:subjects(*)')
      .eq('subject.slug', slug)
      .order('sort_order', { ascending: true })
      .then(({ data, error }) => {
        if (mounted) {
          if (!error && data) setChapters(data as Chapter[]);
          setLoading(false);
        }
      });
    return () => { mounted = false; };
  }, [slug]);

  return { chapters, loading };
}

export function useAllChapters() {
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    supabase
      .from('chapters')
      .select('*')
      .order('sort_order', { ascending: true })
      .then(({ data, error }) => {
        if (mounted) {
          if (!error && data) setChapters(data as Chapter[]);
          setLoading(false);
        }
      });
    return () => { mounted = false; };
  }, []);

  return { chapters, loading };
}

// ── Lectures ─────────────────────────────────────────────────
export function useLectures(chapterId: string | undefined) {
  const [lectures, setLectures] = useState<Lecture[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!chapterId) { setLoading(false); return; }
    let mounted = true;
    supabase
      .from('lectures')
      .select('*')
      .eq('chapter_id', chapterId)
      .order('sort_order', { ascending: true })
      .then(({ data, error }) => {
        if (mounted) {
          if (!error && data) setLectures(data as Lecture[]);
          setLoading(false);
        }
      });
    return () => { mounted = false; };
  }, [chapterId]);

  return { lectures, loading };
}

export function useLectureById(id: string | undefined) {
  const [lecture, setLecture] = useState<Lecture | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) { setLoading(false); return; }
    let mounted = true;
    supabase
      .from('lectures')
      .select('*')
      .eq('id', id)
      .single()
      .then(({ data, error }) => {
        if (mounted) {
          if (!error && data) setLecture(data as Lecture);
          setLoading(false);
        }
      });
    return () => { mounted = false; };
  }, [id]);

  return { lecture, loading };
}

export function useAllLectures(sourceBatchId?: string) {
  const [lectures, setLectures] = useState<Lecture[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    let query = supabase
      .from('lectures')
      .select('*, chapter:chapters(*)')
      .order('sort_order', { ascending: true });
    if (sourceBatchId) {
      query = query.eq('source_batch_id', sourceBatchId);
    }
    query.then(({ data, error }) => {
      if (mounted) {
        if (!error && data) setLectures(data as Lecture[]);
        setLoading(false);
      }
    });
    return () => { mounted = false; };
  }, [sourceBatchId]);

  return { lectures, loading };
}

// ── Course Notes ─────────────────────────────────────────────
export function useCourseNotes(subjectId: string | undefined) {
  const [notes, setNotes] = useState<CourseNote[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!subjectId) { setLoading(false); return; }
    let mounted = true;
    supabase
      .from('course_notes')
      .select('*')
      .eq('subject_id', subjectId)
      .order('sort_order', { ascending: true })
      .then(({ data, error }) => {
        if (mounted) {
          if (!error && data) setNotes(data as CourseNote[]);
          setLoading(false);
        }
      });
    return () => { mounted = false; };
  }, [subjectId]);

  return { notes, loading };
}

// ── Teacher Hooks ──────────────────────────────────────────────
export function useTeachers() {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    supabase
      .from('teachers')
      .select('*')
      .order('sort_order', { ascending: true })
      .then(({ data, error }) => {
        if (mounted) {
          if (!error && data) setTeachers(data as Teacher[]);
          setLoading(false);
        }
      });
    return () => { mounted = false; };
  }, []);

  return { teachers, loading };
}

export function useTeacherBySlug(slug: string | undefined) {
  const [teacher, setTeacher] = useState<Teacher | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) { setLoading(false); return; }
    let mounted = true;
    supabase
      .from('teachers')
      .select('*')
      .eq('slug', slug)
      .maybeSingle()
      .then(({ data, error }) => {
        if (mounted) {
          if (!error && data) setTeacher(data as Teacher);
          setLoading(false);
        }
      });
    return () => { mounted = false; };
  }, [slug]);

  return { teacher, loading };
}

export function useSubjectsByTeacher(teacherId: string | undefined) {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!teacherId) { setLoading(false); return; }
    let mounted = true;
    supabase
      .from('subjects')
      .select('*')
      .eq('teacher_id', teacherId)
      .order('sort_order', { ascending: true })
      .then(({ data, error }) => {
        if (mounted) {
          if (!error && data) setSubjects(data as Subject[]);
          setLoading(false);
        }
      });
    return () => { mounted = false; };
  }, [teacherId]);

  return { subjects, loading };
}

// ── Folder Hooks ───────────────────────────────────────────────
export function useFoldersBySubject(subjectId: string | undefined) {
  const [folders, setFolders] = useState<Folder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!subjectId) { setLoading(false); return; }
    let mounted = true;
    supabase
      .from('folders')
      .select('*')
      .eq('subject_id', subjectId)
      .order('sort_order', { ascending: true })
      .then(({ data, error }) => {
        if (mounted) {
          if (!error && data) setFolders(data as Folder[]);
          setLoading(false);
        }
      });
    return () => { mounted = false; };
  }, [subjectId]);

  return { folders, loading };
}

export function useFolderBySlug(subjectId: string | undefined, folderSlug: string | undefined) {
  const [folder, setFolder] = useState<Folder | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!subjectId || !folderSlug) { setLoading(false); return; }
    let mounted = true;
    supabase
      .from('folders')
      .select('*')
      .eq('subject_id', subjectId)
      .eq('slug', folderSlug)
      .maybeSingle()
      .then(({ data, error }) => {
        if (mounted) {
          if (!error && data) setFolder(data as Folder);
          setLoading(false);
        }
      });
    return () => { mounted = false; };
  }, [subjectId, folderSlug]);

  return { folder, loading };
}

export function useChaptersByFolder(folderId: string | undefined) {
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!folderId) { setLoading(false); return; }
    let mounted = true;
    supabase
      .from('chapters')
      .select('*')
      .eq('folder_id', folderId)
      .order('sort_order', { ascending: true })
      .then(({ data, error }) => {
        if (mounted) {
          if (!error && data) setChapters(data as Chapter[]);
          setLoading(false);
        }
      });
    return () => { mounted = false; };
  }, [folderId]);

  return { chapters, loading };
}

// ── Topic Hooks ───────────────────────────────────────────────
export function useTopicsByChapter(chapterId: string | undefined) {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!chapterId) { setLoading(false); return; }
    let mounted = true;
    supabase
      .from('topics')
      .select('*')
      .eq('chapter_id', chapterId)
      .order('sort_order', { ascending: true })
      .then(({ data, error }) => {
        if (mounted) {
          if (!error && data) setTopics(data as Topic[]);
          setLoading(false);
        }
      });
    return () => { mounted = false; };
  }, [chapterId]);

  return { topics, loading };
}

export function useLecturesByTopic(topicId: string | undefined) {
  const [lectures, setLectures] = useState<Lecture[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!topicId) { setLoading(false); return; }
    let mounted = true;
    supabase
      .from('lectures')
      .select('*')
      .eq('topic_id', topicId)
      .order('sort_order', { ascending: true })
      .then(({ data, error }) => {
        if (mounted) {
          if (!error && data) setLectures(data as Lecture[]);
          setLoading(false);
        }
      });
    return () => { mounted = false; };
  }, [topicId]);

  return { lectures, loading };
}

// ── PWA Hook ──────────────────────────────────────────────────
type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
};

export interface PWAState {
  installable: boolean;
  installed: boolean;
  updateAvailable: boolean;
  offline: boolean;
  promptInstall: () => Promise<boolean>;
  applyUpdate: () => void;
  requestNotificationPermission: () => Promise<boolean>;
  subscribeToPush: () => Promise<PushSubscription | null>;
  registerBackgroundSync: () => Promise<void>;
}

export function usePWA(): PWAState {
  const [installable, setInstallable] = useState(false);
  const [installed, setInstalled] = useState(false);
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [offline, setOffline] = useState(!navigator.onLine);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setInstallable(true);
    };

    const handleInstalled = () => {
      setInstalled(true);
      setInstallable(false);
      setDeferredPrompt(null);
    };

    const handleOnline = () => setOffline(false);
    const handleOffline = () => setOffline(true);

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('appinstalled', handleInstalled);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    if (window.matchMedia('(display-mode: standalone)').matches || (window.navigator as unknown as { standalone?: boolean }).standalone) {
      setInstalled(true);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleInstalled);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;

    const handleControllerChange = () => setUpdateAvailable(true);
    navigator.serviceWorker.addEventListener('controllerchange', handleControllerChange);

    const checkUpdate = async () => {
      const reg = await navigator.serviceWorker.getRegistration();
      if (reg) await reg.update();
    };

    const interval = setInterval(checkUpdate, 60 * 60 * 1000);
    return () => {
      clearInterval(interval);
      navigator.serviceWorker.removeEventListener('controllerchange', handleControllerChange);
    };
  }, []);

  const promptInstall = useCallback(async () => {
    if (!deferredPrompt) return false;
    await deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    setInstallable(false);
    return choice.outcome === 'accepted';
  }, [deferredPrompt]);

  const applyUpdate = useCallback(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistration().then((reg) => {
        if (reg && reg.waiting) reg.waiting.postMessage('SKIP_WAITING');
      });
    }
    window.location.reload();
  }, []);

  const requestNotificationPermission = useCallback(async () => {
    if (!('Notification' in window)) return false;
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }, []);

  const subscribeToPush = useCallback(async () => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return null;
    try {
      const reg = await navigator.serviceWorker.ready;
      const existing = await reg.pushManager.getSubscription();
      if (existing) return existing;
      const sub = await reg.pushManager.subscribe({ userVisibleOnly: true });
      return sub;
    } catch {
      return null;
    }
  }, []);

  const registerBackgroundSync = useCallback(async () => {
    if (!('serviceWorker' in navigator) || !('SyncManager' in window)) return;
    try {
      const reg = await navigator.serviceWorker.ready;
      await (reg as unknown as { sync: { register: (tag: string) => Promise<void> } }).sync.register('shivansh-sync');
    } catch { /* not supported */ }
  }, []);

  return {
    installable, installed, updateAvailable, offline,
    promptInstall, applyUpdate, requestNotificationPermission, subscribeToPush, registerBackgroundSync,
  };
}
