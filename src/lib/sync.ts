import { supabase } from './supabase';

const PROGRESS_KEY = 'achiever_os_progress_synced';
const STATS_KEY = 'achiever_os_stats_synced';

export type CloudProgress = {
  lecture_id: string;
  position: number;
  duration: number;
  completed: boolean;
  updated_at: string;
};

export type CloudStats = {
  study_date: string;
  seconds: number;
  updated_at: string;
};

/** Pull all cloud progress for the signed-in user and merge into localStorage. */
export async function pullCloudProgress(): Promise<void> {
  const { data, error } = await supabase
    .from('study_progress')
    .select('lecture_id, position, duration, completed, updated_at')
    .order('updated_at', { ascending: false });

  if (error || !data) return;

  const lastSync = localStorage.getItem(PROGRESS_KEY);
  const lastTs = lastSync ? parseInt(lastSync) : 0;

  for (const row of data as CloudProgress[]) {
    const cloudTs = new Date(row.updated_at).getTime();
    if (cloudTs <= lastTs) continue;
    const localRaw = localStorage.getItem('achiever_os_progress_' + row.lecture_id);
    const local = localRaw ? JSON.parse(localRaw) : null;
    // Cloud wins if it's newer than local
    if (!local || cloudTs > (local.updatedAt || 0)) {
      localStorage.setItem('achiever_os_progress_' + row.lecture_id, JSON.stringify({
        position: row.position,
        duration: row.duration,
        completed: row.completed,
        updatedAt: cloudTs,
      }));
    }
  }
  localStorage.setItem(PROGRESS_KEY, String(Date.now()));
}

/** Push a single lecture's progress to the cloud (upsert). */
export async function pushProgress(lectureId: string, position: number, duration: number, completed: boolean): Promise<void> {
  const { error } = await supabase
    .from('study_progress')
    .upsert(
      { lecture_id: lectureId, position, duration, completed, updated_at: new Date().toISOString() },
      { onConflict: 'user_id,lecture_id' }
    );
  if (error) console.warn('Progress sync failed:', error.message);
}

/** Pull all cloud study stats and merge into localStorage. */
export async function pullCloudStats(): Promise<void> {
  const { data, error } = await supabase
    .from('study_stats')
    .select('study_date, seconds, updated_at');

  if (error || !data) return;

  const raw = localStorage.getItem('achiever_os_study_log');
  const log: Record<string, number> = raw ? JSON.parse(raw) : {};

  for (const row of data as CloudStats[]) {
    const cloudSec = row.seconds;
    const localSec = log[row.study_date] || 0;
    // Take the max of local and cloud for each day
    log[row.study_date] = Math.max(localSec, cloudSec);
  }
  localStorage.setItem('achiever_os_study_log', JSON.stringify(log));
  localStorage.setItem(STATS_KEY, String(Date.now()));
}

/** Push study time for a specific date to the cloud (upsert, max merge). */
export async function pushStudyTime(date: string, seconds: number): Promise<void> {
  const { error } = await supabase
    .from('study_stats')
    .upsert(
      { study_date: date, seconds, updated_at: new Date().toISOString() },
      { onConflict: 'user_id,study_date' }
    );
  if (error) console.warn('Stats sync failed:', error.message);
}

/** Full sync: pull cloud, then push any local-only data. Called on login. */
export async function fullSync(): Promise<void> {
  await pullCloudProgress();
  await pullCloudStats();

  // Push any local progress that's newer than last sync
  const progressKeys: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith('achiever_os_progress_')) progressKeys.push(key);
  }

  for (const key of progressKeys) {
    const lectureId = key.replace('achiever_os_progress_', '');
    const local = JSON.parse(localStorage.getItem(key) || '{}');
    if (local.updatedAt && local.position !== undefined) {
      await pushProgress(lectureId, local.position, local.duration, local.completed);
    }
  }

  // Push local study stats
  const raw = localStorage.getItem('achiever_os_study_log');
  if (raw) {
    const log: Record<string, number> = JSON.parse(raw);
    for (const [date, seconds] of Object.entries(log)) {
      if (seconds > 0) await pushStudyTime(date, seconds);
    }
  }
}
