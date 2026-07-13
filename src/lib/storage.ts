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
    localStorage.setItem(PREFIX + 'progress_' + lectureId, JSON.stringify({ position: existing?.position || 0, duration: existing?.duration || 0, completed: true, updatedAt: Date.now() }));
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
