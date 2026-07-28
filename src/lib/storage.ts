const PREFIX = 'achiever_os_';

export function getProgress(lectureId: string): { position: number; duration: number; completed: boolean } | null {
  try {
    const raw = localStorage.getItem(PREFIX + 'progress_' + lectureId);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

export function setProgress(lectureId: string, position: number, duration: number) {
  try {
    const existing = getProgress(lectureId);
    const completed = existing?.completed || (duration > 0 && position >= duration * 0.95);
    localStorage.setItem(PREFIX + 'progress_' + lectureId, JSON.stringify({ position, duration, completed, updatedAt: Date.now() }));
  } catch { /* ignore */ }
}

export function markCompleted(lectureId: string) {
  try {
    const existing = getProgress(lectureId);
    const position = existing?.position || 0;
    const duration = existing?.duration || 0;
    localStorage.setItem(PREFIX + 'progress_' + lectureId, JSON.stringify({ position, duration, completed: true, updatedAt: Date.now() }));
  } catch { /* ignore */ }
}

export function unmarkCompleted(lectureId: string) {
  try {
    const existing = getProgress(lectureId);
    const position = existing?.position || 0;
    const duration = existing?.duration || 0;
    localStorage.setItem(PREFIX + 'progress_' + lectureId, JSON.stringify({ position, duration, completed: false, updatedAt: Date.now() }));
  } catch { /* ignore */ }
}

export function getAllProgress(): Record<string, { position: number; duration: number; completed: boolean; updatedAt: number }> {
  const result: Record<string, { position: number; duration: number; completed: boolean; updatedAt: number }> = {};
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(PREFIX + 'progress_')) {
        const id = key.replace(PREFIX + 'progress_', '');
        result[id] = JSON.parse(localStorage.getItem(key) || '{}');
      }
    }
  } catch { /* ignore */ }
  return result;
}

export function getCourseProgress(lectureIds: string[]): number {
  if (lectureIds.length === 0) return 0;
  const all = getAllProgress();
  const completed = lectureIds.filter((id) => all[id]?.completed).length;
  return Math.round((completed / lectureIds.length) * 100);
}

export function getContinueWatching(): { lectureId: string; updatedAt: number }[] {
  const all = getAllProgress();
  return Object.entries(all)
    .filter(([, v]) => v.position > 5 && !v.completed)
    .map(([lectureId, v]) => ({ lectureId, updatedAt: v.updatedAt }))
    .sort((a, b) => b.updatedAt - a.updatedAt);
}

export function clearAllProgress() {
  try {
    const keys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(PREFIX + 'progress_')) keys.push(key);
    }
    keys.forEach((k) => localStorage.removeItem(k));
  } catch { /* ignore */ }
}

export function isDownloaded(lectureId: string): boolean {
  return localStorage.getItem(PREFIX + 'downloaded_' + lectureId) === 'true';
}

export function addDownload(lectureId: string) {
  localStorage.setItem(PREFIX + 'downloaded_' + lectureId, 'true');
}

export function removeDownload(lectureId: string) {
  localStorage.removeItem(PREFIX + 'downloaded_' + lectureId);
}

// ── Study tracking ──────────────────────────────────────────
export function addStudyTime(seconds: number) {
  const today = new Date().toISOString().split('T')[0];
  const raw = localStorage.getItem(PREFIX + 'study_log');
  const log: Record<string, number> = raw ? JSON.parse(raw) : {};
  log[today] = (log[today] || 0) + seconds;
  localStorage.setItem(PREFIX + 'study_log', JSON.stringify(log));
}

export function getStudyLog(): Record<string, number> {
  try { return JSON.parse(localStorage.getItem(PREFIX + 'study_log') || '{}'); } catch { return {}; }
}

export function getTodayStudySeconds(): number {
  const today = new Date().toISOString().split('T')[0];
  return getStudyLog()[today] || 0;
}

export function getWeeklyStudySeconds(): number[] {
  const log = getStudyLog();
  const days: number[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i);
    days.push(log[d.toISOString().split('T')[0]] || 0);
  }
  return days;
}

export function getTotalStudySeconds(): number {
  return Object.values(getStudyLog()).reduce((a, b) => a + b, 0);
}

export function getStudyStreak(): number {
  const log = getStudyLog();
  let streak = 0;
  for (let i = 0; i < 365; i++) {
    const d = new Date(); d.setDate(d.getDate() - i);
    if (log[d.toISOString().split('T')[0]]) streak++;
    else if (i > 0) break;
  }
  return streak;
}

export function getDailyGoal(): number {
  return parseInt(localStorage.getItem(PREFIX + 'daily_goal') || '7200');
}

export function setDailyGoal(seconds: number) {
  localStorage.setItem(PREFIX + 'daily_goal', String(seconds));
}

export function getWatchLater(): string[] {
  try { return JSON.parse(localStorage.getItem(PREFIX + 'watch_later') || '[]'); } catch { return []; }
}

export function toggleWatchLater(lectureId: string) {
  const list = getWatchLater();
  const idx = list.indexOf(lectureId);
  if (idx >= 0) list.splice(idx, 1); else list.push(lectureId);
  localStorage.setItem(PREFIX + 'watch_later', JSON.stringify(list));
  return idx < 0;
}

export function getFavourites(): string[] {
  try { return JSON.parse(localStorage.getItem(PREFIX + 'favourites') || '[]'); } catch { return []; }
}

export function toggleFavourite(lectureId: string) {
  const list = getFavourites();
  const idx = list.indexOf(lectureId);
  if (idx >= 0) list.splice(idx, 1); else list.push(lectureId);
  localStorage.setItem(PREFIX + 'favourites', JSON.stringify(list));
  return idx < 0;
}

export function getBookmarks(lectureId: string): number[] {
  try { return JSON.parse(localStorage.getItem(PREFIX + 'bookmarks_' + lectureId) || '[]'); } catch { return []; }
}

export function toggleBookmark(lectureId: string, timestamp: number) {
  const list = getBookmarks(lectureId);
  const idx = list.indexOf(timestamp);
  if (idx >= 0) list.splice(idx, 1); else list.push(timestamp);
  localStorage.setItem(PREFIX + 'bookmarks_' + lectureId, JSON.stringify(list));
  return idx < 0;
}

export function getNotes(lectureId: string): { timestamp: number; text: string }[] {
  try { return JSON.parse(localStorage.getItem(PREFIX + 'notes_' + lectureId) || '[]'); } catch { return []; }
}

export function addNote(lectureId: string, timestamp: number, text: string) {
  const list = getNotes(lectureId);
  list.push({ timestamp, text });
  localStorage.setItem(PREFIX + 'notes_' + lectureId, JSON.stringify(list));
}

export function removeNote(lectureId: string, index: number) {
  const list = getNotes(lectureId);
  list.splice(index, 1);
  localStorage.setItem(PREFIX + 'notes_' + lectureId, JSON.stringify(list));
}

export function getLastOpenedLectures(): { lectureId: string; updatedAt: number }[] {
  const all = getAllProgress();
  return Object.entries(all)
    .map(([lectureId, v]) => ({ lectureId, updatedAt: v.updatedAt || 0 }))
    .sort((a, b) => b.updatedAt - a.updatedAt)
    .slice(0, 5);
}
