import { useState, useEffect, useRef } from 'react';
import { Plus, CreditCard as Edit3, Trash2, Pin, Sparkles, BookOpen, Video, Upload, Save, Layers, FolderTree, Shield, Lock, Mail, Loader as Loader2, LogOut, Megaphone, Image } from 'lucide-react';
import { supabase, type Subject, type Chapter, type Lecture } from '../lib/supabase';
import { useSubjects, useChapters, useLectures, formatDuration } from '../lib/hooks';
import { useRouter } from '../lib/router';
import * as LucideIcons from 'lucide-react';

const ICON_OPTIONS = ['BookOpen', 'PenTool', 'BookA', 'FileText', 'Video', 'Film', 'Layers', 'FolderTree'];

type Tab = 'lectures' | 'chapters' | 'subjects' | 'announcements' | 'banners';

export function AdminPage() {
  const { navigate } = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [adminEmail, setAdminEmail] = useState('Admin');
  const [show403, setShow403] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session?.user) {
        setAdminEmail(data.session.user.email || 'Admin');
        supabase.from('admin_users').select('id, role').eq('user_id', data.session.user.id).maybeSingle()
          .then(({ data: adminData }) => {
            if (adminData && adminData.role === 'admin') { setIsAdmin(true); }
            else { setShow403(true); }
            setAuthChecked(true);
          });
      } else { setAuthChecked(true); }
    });
  }, []);

  const handleLogin = async () => {
    setAuthLoading(true); setAuthError(null);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) { setAuthError(error.message); setAuthLoading(false); return; }
    if (data.user) {
      const { data: adminData } = await supabase.from('admin_users').select('id, role').eq('user_id', data.user.id).maybeSingle();
      if (adminData && adminData.role === 'admin') { setIsAdmin(true); setAdminEmail(data.user.email || 'Admin'); setShow403(false); }
      else { setAuthError('Access denied. This account does not have admin privileges.'); await supabase.auth.signOut(); }
    }
    setAuthLoading(false);
  };

  const handleLogout = async () => { await supabase.auth.signOut(); setIsAdmin(false); setEmail(''); setPassword(''); };

  if (!authChecked) return <div className="min-h-screen flex items-center justify-center pt-20"><Loader2 className="w-8 h-8 text-pink-500 animate-spin" /></div>;

  // 403 — non-admin authenticated user
  if (show403 && !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 pt-20 pb-16">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center mx-auto mb-4">
            <Lock className="w-8 h-8 text-red-500" />
          </div>
          <h1 className="font-bold text-xl text-gray-900 mb-2">403 — Access Denied</h1>
          <p className="text-sm text-gray-500 mb-6">You are signed in, but your account does not have administrator permissions. Only authorized admin users can access the dashboard.</p>
          <button onClick={() => navigate({ name: 'home' })} className="btn-primary py-2.5 px-5">Back to Home</button>
        </div>
      </div>
    );
  }

  // Login screen (not signed in)
  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 pt-20 pb-16">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-pink-500/20">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <h1 className="font-bold text-xl text-gray-900 mb-1">Admin Access</h1>
            <p className="text-sm text-gray-500">Sign in with an authorized admin account</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-2xl p-6 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input type="email" className="input-field pl-10" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="admin@achieveros.com" onKeyDown={(e) => e.key === 'Enter' && handleLogin()} />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input type="password" className="input-field pl-10" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" onKeyDown={(e) => e.key === 'Enter' && handleLogin()} />
              </div>
            </div>
            {authError && <div className="text-xs text-red-500 bg-red-50 border border-red-200 rounded-xl px-3 py-2">{authError}</div>}
            <button onClick={handleLogin} disabled={authLoading || !email || !password} className="btn-primary w-full py-3">
              {authLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
              {authLoading ? 'Signing in…' : 'Sign In'}
            </button>
          </div>
          <p className="text-center text-xs text-gray-400 mt-4">Authorized personnel only. All actions are logged.</p>
        </div>
      </div>
    );
  }

  return <AdminDashboard onLogout={handleLogout} adminEmail={adminEmail} />;
}

function AdminDashboard({ onLogout, adminEmail }: { onLogout: () => void; adminEmail: string }) {
  const [tab, setTab] = useState<Tab>('lectures');
  const { subjects, loading: subjectsLoading } = useSubjects();
  const [selectedSubjectId, setSelectedSubjectId] = useState<string | undefined>(undefined);
  const { chapters, loading: chaptersLoading } = useChapters(selectedSubjectId);
  const [selectedChapterId, setSelectedChapterId] = useState<string | undefined>(undefined);
  const { lectures, loading: lecturesLoading } = useLectures(selectedChapterId);

  useEffect(() => { if (subjects.length > 0 && !selectedSubjectId) setSelectedSubjectId(subjects[0].id); }, [subjects, selectedSubjectId]);
  useEffect(() => { if (chapters.length > 0 && !selectedChapterId) setSelectedChapterId(chapters[0].id); }, [chapters, selectedChapterId]);

  return (
    <div className="max-w-7xl mx-auto px-4 pt-28 pb-16">
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="font-bold text-3xl text-gray-900 mb-1">Admin Dashboard</h1>
          <p className="text-gray-500">Manage content, announcements, and banners.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block"><p className="text-xs text-gray-400">Signed in as</p><p className="text-xs font-semibold text-gray-700">{adminEmail}</p></div>
          <button onClick={onLogout} className="btn-secondary text-sm py-2 px-3"><LogOut className="w-4 h-4" /> Logout</button>
        </div>
      </div>

      <div className="flex gap-2 mb-6 bg-white border border-gray-200 rounded-2xl p-1.5 w-fit overflow-x-auto">
        {([
          { id: 'lectures' as Tab, label: 'Lectures', icon: Video },
          { id: 'chapters' as Tab, label: 'Chapters', icon: FolderTree },
          { id: 'subjects' as Tab, label: 'Subjects', icon: Layers },
          { id: 'announcements' as Tab, label: 'Announcements', icon: Megaphone },
          { id: 'banners' as Tab, label: 'Banners', icon: Image },
        ]).map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 whitespace-nowrap ${tab === t.id ? 'bg-pink-500 text-white shadow-sm shadow-pink-500/20' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'}`}>
            <t.icon className="w-4 h-4" /> {t.label}
          </button>
        ))}
      </div>

      {tab === 'subjects' && <SubjectsAdmin subjects={subjects} loading={subjectsLoading} />}
      {tab === 'chapters' && <ChaptersAdmin subjects={subjects} subjectsLoading={subjectsLoading} selectedSubjectId={selectedSubjectId} setSelectedSubjectId={setSelectedSubjectId} chapters={chapters} chaptersLoading={chaptersLoading} />}
      {tab === 'lectures' && <LecturesAdmin subjects={subjects} selectedSubjectId={selectedSubjectId} setSelectedSubjectId={setSelectedSubjectId} chapters={chapters} chaptersLoading={chaptersLoading} selectedChapterId={selectedChapterId} setSelectedChapterId={setSelectedChapterId} lectures={lectures} lecturesLoading={lecturesLoading} />}
      {tab === 'announcements' && <AnnouncementsAdmin />}
      {tab === 'banners' && <BannersAdmin />}
    </div>
  );
}

function Input({ label, children }: { label: string; children: React.ReactNode }) {
  return (<div><label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">{label}</label>{children}</div>);
}

function SaveBar({ onSave, saving, onCancel }: { onSave: () => void; saving: boolean; onCancel: () => void }) {
  return (
    <div className="flex gap-3 pt-2">
      <button onClick={onSave} disabled={saving} className="btn-primary flex-1 py-2.5">{saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}{saving ? 'Saving...' : 'Save'}</button>
      <button onClick={onCancel} className="btn-secondary py-2.5 px-5">Cancel</button>
    </div>
  );
}

function getIcon(name: string | null) {
  if (!name) return BookOpen;
  const Icon = (LucideIcons as unknown as Record<string, React.ComponentType<{ className?: string; style?: React.CSSProperties }>>)[name];
  return Icon || BookOpen;
}

// ─── Subjects Admin ───────────────────────────────────────────────────────────
function SubjectsAdmin({ subjects, loading }: { subjects: Subject[]; loading: boolean }) {
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Subject | null>(null);
  const [form, setForm] = useState({ title: '', slug: '', description: '', icon: 'BookOpen', color: '#ec4899' });
  const [saving, setSaving] = useState(false);

  const startEdit = (s: Subject) => { setEditing(s); setForm({ title: s.title, slug: s.slug, description: s.description || '', icon: s.icon || 'BookOpen', color: s.color || '#ec4899' }); setShowForm(true); };
  const startCreate = () => { setEditing(null); setForm({ title: '', slug: '', description: '', icon: 'BookOpen', color: '#ec4899' }); setShowForm(true); };

  const handleSave = async () => {
    setSaving(true);
    if (editing) { await supabase.from('subjects').update({ title: form.title, slug: form.slug, description: form.description, icon: form.icon, color: form.color }).eq('id', editing.id); }
    else { await supabase.from('subjects').insert({ title: form.title, slug: form.slug, description: form.description, icon: form.icon, color: form.color, sort_order: subjects.length }); }
    setSaving(false); setShowForm(false); window.location.reload();
  };

  const handleDelete = async (id: string) => { if (!confirm('Delete this subject and all its content?')) return; await supabase.from('subjects').delete().eq('id', id); window.location.reload(); };

  if (loading) return <div className="bg-white border border-gray-200 rounded-2xl h-40 animate-pulse" />;

  return (
    <div>
      <div className="flex items-center justify-between mb-4"><p className="text-sm text-gray-500">{subjects.length} subjects</p><button onClick={startCreate} className="btn-primary text-sm py-2 px-3"><Plus className="w-4 h-4" /> New Subject</button></div>
      {showForm && (
        <div className="bg-white border border-gray-200 rounded-2xl p-5 mb-4 space-y-3">
          <Input label="Title"><input className="input-field" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="POLITY" /></Input>
          <Input label="Slug"><input className="input-field" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} placeholder="polity" /></Input>
          <Input label="Description"><input className="input-field" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Description" /></Input>
          <Input label="Icon"><select className="input-field" value={form.icon} onChange={(e) => setForm({ ...form, icon: e.target.value })}>{ICON_OPTIONS.map((ic) => <option key={ic} value={ic}>{ic}</option>)}</select></Input>
          <Input label="Color"><input type="color" className="input-field h-12" value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} /></Input>
          <SaveBar onSave={handleSave} saving={saving} onCancel={() => setShowForm(false)} />
        </div>
      )}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {subjects.map((s) => {
          const Icon = getIcon(s.icon);
          return (
            <div key={s.id} className="bg-white border border-gray-200 rounded-2xl p-4 flex items-start justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${s.color || '#ec4899'}15` }}><Icon className="w-5 h-5" style={{ color: s.color || '#ec4899' }} /></div>
                <div className="min-w-0"><p className="font-semibold text-gray-900 text-sm truncate">{s.title}</p><p className="text-[11px] text-gray-400 truncate">{s.slug}</p></div>
              </div>
              <div className="flex gap-1.5 flex-shrink-0">
                <button onClick={() => startEdit(s)} className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors"><Edit3 className="w-3.5 h-3.5" /></button>
                <button onClick={() => handleDelete(s.id)} className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center text-red-500 hover:text-red-600 hover:bg-red-50 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Chapters Admin ───────────────────────────────────────────────────────────
function ChaptersAdmin({ subjects, subjectsLoading, selectedSubjectId, setSelectedSubjectId, chapters, chaptersLoading }: {
  subjects: Subject[]; subjectsLoading: boolean; selectedSubjectId: string | undefined; setSelectedSubjectId: (v: string) => void; chapters: Chapter[]; chaptersLoading: boolean;
}) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', slug: '', description: '' });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!selectedSubjectId) return;
    setSaving(true);
    await supabase.from('chapters').insert({ subject_id: selectedSubjectId, title: form.title, slug: form.slug, description: form.description, sort_order: chapters.length });
    setSaving(false); setShowForm(false); setForm({ title: '', slug: '', description: '' }); window.location.reload();
  };

  const handleDelete = async (id: string) => { if (!confirm('Delete this chapter and all its lectures?')) return; await supabase.from('chapters').delete().eq('id', id); window.location.reload(); };

  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <select className="input-field max-w-xs" value={selectedSubjectId || ''} onChange={(e) => setSelectedSubjectId(e.target.value)} disabled={subjectsLoading}>
          {subjects.map((s) => <option key={s.id} value={s.id}>{s.title}</option>)}
        </select>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary text-sm py-2 px-3"><Plus className="w-4 h-4" /> New Chapter</button>
      </div>
      {showForm && (
        <div className="bg-white border border-gray-200 rounded-2xl p-5 mb-4 space-y-3">
          <Input label="Title"><input className="input-field" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Indian Constitution" /></Input>
          <Input label="Slug"><input className="input-field" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} placeholder="indian-constitution" /></Input>
          <Input label="Description"><input className="input-field" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Description" /></Input>
          <SaveBar onSave={handleSave} saving={saving} onCancel={() => setShowForm(false)} />
        </div>
      )}
      {chaptersLoading ? <div className="bg-white border border-gray-200 rounded-2xl h-32 animate-pulse" /> : chapters.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-2xl p-8 text-center text-sm text-gray-400">No chapters in this subject yet.</div>
      ) : (
        <div className="space-y-2">
          {chapters.map((c) => (
            <div key={c.id} className="bg-white border border-gray-200 rounded-2xl p-4 flex items-center justify-between gap-3">
              <div className="min-w-0"><p className="font-semibold text-gray-900 text-sm">{c.title}</p><p className="text-[11px] text-gray-400">{c.slug}</p></div>
              <button onClick={() => handleDelete(c.id)} className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center text-red-500 hover:text-red-600 hover:bg-red-50 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Lectures Admin ───────────────────────────────────────────────────────────
function LecturesAdmin({ subjects, selectedSubjectId, setSelectedSubjectId, chapters, chaptersLoading, selectedChapterId, setSelectedChapterId, lectures, lecturesLoading }: {
  subjects: Subject[]; selectedSubjectId: string | undefined; setSelectedSubjectId: (v: string) => void; chapters: Chapter[]; chaptersLoading: boolean; selectedChapterId: string | undefined; setSelectedChapterId: (v: string) => void; lectures: Lecture[]; lecturesLoading: boolean;
}) {
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Lecture | null>(null);
  const [form, setForm] = useState({ title: '', slug: '', description: '', video_url: '', pdf_url: '', thumbnail_url: '', duration_seconds: 0, teacher_name: 'Achiever Faculty', difficulty: 'Beginner', is_pinned: false, is_new: false, notes: '' });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkText, setBulkText] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pdfInputRef = useRef<HTMLInputElement>(null);

  const startCreate = () => { setEditing(null); setForm({ title: '', slug: '', description: '', video_url: '', pdf_url: '', thumbnail_url: '', duration_seconds: 0, teacher_name: 'Achiever Faculty', difficulty: 'Beginner', is_pinned: false, is_new: false, notes: '' }); setShowForm(true); };
  const startEdit = (l: Lecture) => { setEditing(l); setForm({ title: l.title, slug: l.slug, description: l.description || '', video_url: l.video_url || '', pdf_url: l.pdf_url || '', thumbnail_url: l.thumbnail_url || '', duration_seconds: l.duration_seconds, teacher_name: l.teacher_name || 'Achiever Faculty', difficulty: l.difficulty || 'Beginner', is_pinned: l.is_pinned, is_new: l.is_new, notes: l.notes || '' }); setShowForm(true); };

  const handleSave = async () => {
    if (!selectedChapterId) return;
    setSaving(true);
    if (editing) { await supabase.from('lectures').update({ ...form, chapter_id: selectedChapterId }).eq('id', editing.id); }
    else { await supabase.from('lectures').insert({ ...form, chapter_id: selectedChapterId, sort_order: lectures.length, watch_count: 0 }); }
    setSaving(false); setShowForm(false); window.location.reload();
  };

  const handleDelete = async (id: string) => { if (!confirm('Delete this lecture?')) return; await supabase.from('lectures').delete().eq('id', id); window.location.reload(); };

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    setUploading(true);
    const fileName = `${Date.now()}-${file.name}`;
    const { error } = await supabase.storage.from('lecture-videos').upload(fileName, file);
    if (!error) { const { data } = supabase.storage.from('lecture-videos').getPublicUrl(fileName); setForm((f) => ({ ...f, video_url: data.publicUrl })); }
    else alert('Upload failed: ' + error.message);
    setUploading(false);
  };

  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    setUploading(true);
    const fileName = `${Date.now()}-${file.name}`;
    const { error } = await supabase.storage.from('lecture-videos').upload(fileName, file);
    if (!error) { const { data } = supabase.storage.from('lecture-videos').getPublicUrl(fileName); setForm((f) => ({ ...f, pdf_url: data.publicUrl })); }
    else alert('Upload failed: ' + error.message);
    setUploading(false);
  };

  const handleBulkUpload = async () => {
    if (!selectedChapterId || !bulkText.trim()) return;
    setSaving(true);
    const lines = bulkText.trim().split('\n').filter((l) => l.trim());
    const inserts = lines.map((line, i) => {
      const [title, video_url, duration] = line.split(',').map((s) => s.trim());
      return { title: title || `Lecture ${i + 1}`, slug: (title || `lecture-${i + 1}`).toLowerCase().replace(/\s+/g, '-'), video_url: video_url || '', duration_seconds: parseInt(duration) || 0, chapter_id: selectedChapterId, sort_order: lectures.length + i, watch_count: 0, teacher_name: 'Achiever Faculty', difficulty: 'Beginner', is_pinned: false, is_new: false };
    });
    const { error } = await supabase.from('lectures').insert(inserts);
    if (error) alert('Bulk upload error: ' + error.message);
    setSaving(false); setBulkOpen(false); setBulkText(''); window.location.reload();
  };

  return (
    <div>
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <select className="input-field max-w-xs" value={selectedSubjectId || ''} onChange={(e) => setSelectedSubjectId(e.target.value)}>
          {subjects.map((s) => <option key={s.id} value={s.id}>{s.title}</option>)}
        </select>
        <select className="input-field max-w-xs" value={selectedChapterId || ''} onChange={(e) => setSelectedChapterId(e.target.value)} disabled={chaptersLoading}>
          {chapters.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
        </select>
        <button onClick={startCreate} className="btn-primary text-sm py-2 px-3"><Plus className="w-4 h-4" /> New Lecture</button>
        <button onClick={() => setBulkOpen(!bulkOpen)} className="btn-secondary text-sm py-2 px-3"><Upload className="w-4 h-4" /> Bulk Upload</button>
      </div>

      {bulkOpen && (
        <div className="bg-white border border-gray-200 rounded-2xl p-5 mb-4 space-y-3">
          <Input label="Bulk Upload (one lecture per line: title, video_url, duration_seconds)">
            <textarea className="input-field min-h-32 font-mono text-xs" value={bulkText} onChange={(e) => setBulkText(e.target.value)} placeholder={"Making of Constitution, https://example.com/video.mp4, 3600\nFundamental Rights, https://example.com/video2.mp4, 4200"} />
          </Input>
          <SaveBar onSave={handleBulkUpload} saving={saving} onCancel={() => setBulkOpen(false)} />
        </div>
      )}

      {showForm && (
        <div className="bg-white border border-gray-200 rounded-2xl p-5 mb-4 space-y-3">
          <Input label="Title"><input className="input-field" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="MAKING OF CONSTITUTION" /></Input>
          <Input label="Slug"><input className="input-field" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} placeholder="making-of-constitution" /></Input>
          <Input label="Description"><textarea className="input-field min-h-20" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Description" /></Input>
          <div className="grid sm:grid-cols-2 gap-3">
            <Input label="Video URL"><input className="input-field" value={form.video_url} onChange={(e) => setForm({ ...form, video_url: e.target.value })} placeholder="https://…" /></Input>
            <Input label="PDF URL"><input className="input-field" value={form.pdf_url} onChange={(e) => setForm({ ...form, pdf_url: e.target.value })} placeholder="https://…" /></Input>
          </div>
          <div className="flex gap-3">
            <input ref={fileInputRef} type="file" accept="video/*" onChange={handleVideoUpload} className="hidden" />
            <button onClick={() => fileInputRef.current?.click()} disabled={uploading} className="btn-secondary text-sm py-2 px-4">{uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Video className="w-4 h-4" />} Upload Video</button>
            <input ref={pdfInputRef} type="file" accept=".pdf" onChange={handlePdfUpload} className="hidden" />
            <button onClick={() => pdfInputRef.current?.click()} disabled={uploading} className="btn-secondary text-sm py-2 px-4">{uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />} Upload PDF</button>
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            <Input label="Thumbnail URL"><input className="input-field" value={form.thumbnail_url} onChange={(e) => setForm({ ...form, thumbnail_url: e.target.value })} placeholder="https://…" /></Input>
            <Input label="Duration (seconds)"><input type="number" className="input-field" value={form.duration_seconds} onChange={(e) => setForm({ ...form, duration_seconds: parseInt(e.target.value) || 0 })} /></Input>
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            <Input label="Teacher"><input className="input-field" value={form.teacher_name} onChange={(e) => setForm({ ...form, teacher_name: e.target.value })} /></Input>
            <Input label="Difficulty"><select className="input-field" value={form.difficulty} onChange={(e) => setForm({ ...form, difficulty: e.target.value })}><option>Beginner</option><option>Intermediate</option><option>Advanced</option></select></Input>
          </div>
          <Input label="Notes"><textarea className="input-field min-h-20" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Lecture notes" /></Input>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 text-sm text-gray-700"><input type="checkbox" checked={form.is_pinned} onChange={(e) => setForm({ ...form, is_pinned: e.target.checked })} className="accent-pink-500" /> Pinned</label>
            <label className="flex items-center gap-2 text-sm text-gray-700"><input type="checkbox" checked={form.is_new} onChange={(e) => setForm({ ...form, is_new: e.target.checked })} className="accent-pink-500" /> New</label>
          </div>
          <SaveBar onSave={handleSave} saving={saving} onCancel={() => setShowForm(false)} />
        </div>
      )}

      {lecturesLoading ? <div className="bg-white border border-gray-200 rounded-2xl h-32 animate-pulse" /> : lectures.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-2xl p-8 text-center text-sm text-gray-400">No lectures in this chapter yet.</div>
      ) : (
        <div className="space-y-2">
          {lectures.map((l) => (
            <div key={l.id} className="bg-white border border-gray-200 rounded-2xl p-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                {l.thumbnail_url ? <img src={l.thumbnail_url} alt="" className="w-12 h-12 rounded-lg object-cover flex-shrink-0" /> : <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0"><Video className="w-5 h-5 text-gray-400" /></div>}
                <div className="min-w-0">
                  <p className="font-semibold text-gray-900 text-sm truncate">{l.title}</p>
                  <p className="text-[11px] text-gray-400">{formatDuration(l.duration_seconds)} · {l.teacher_name || 'Unknown'}</p>
                </div>
              </div>
              <div className="flex gap-1.5 flex-shrink-0">
                {l.is_pinned && <Pin className="w-4 h-4 text-pink-500" />}
                {l.is_new && <span className="badge bg-pink-50 text-pink-600 border border-pink-200 text-[9px]">NEW</span>}
                <button onClick={() => startEdit(l)} className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors"><Edit3 className="w-3.5 h-3.5" /></button>
                <button onClick={() => handleDelete(l.id)} className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center text-red-500 hover:text-red-600 hover:bg-red-50 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Announcements Admin ──────────────────────────────────────────────────────
function AnnouncementsAdmin() {
  const [items, setItems] = useState<{ id: string; title: string; body: string; is_active: boolean; created_at: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [saving, setSaving] = useState(false);

  const load = async () => { setLoading(true); const { data } = await supabase.from('announcements').select('*').order('created_at', { ascending: false }); setItems(data || []); setLoading(false); };
  useEffect(() => { load(); }, []);

  const handleCreate = async () => {
    if (!title.trim() || !body.trim()) return;
    setSaving(true);
    await supabase.from('announcements').insert({ title, body, is_active: true });
    setTitle(''); setBody(''); setShowForm(false); setSaving(false); load();
  };

  const toggleActive = async (id: string, current: boolean) => { await supabase.from('announcements').update({ is_active: !current }).eq('id', id); load(); };
  const handleDelete = async (id: string) => { if (!confirm('Delete?')) return; await supabase.from('announcements').delete().eq('id', id); load(); };

  return (
    <div>
      <div className="flex items-center justify-between mb-4"><p className="text-sm text-gray-500">{items.length} announcements</p><button onClick={() => setShowForm(!showForm)} className="btn-primary text-sm py-2 px-3"><Plus className="w-4 h-4" /> New</button></div>
      {showForm && (
        <div className="bg-white border border-gray-200 rounded-2xl p-5 mb-4 space-y-3">
          <Input label="Title"><input className="input-field" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title" /></Input>
          <Input label="Body"><textarea className="input-field min-h-20" value={body} onChange={(e) => setBody(e.target.value)} placeholder="Body" /></Input>
          <SaveBar onSave={handleCreate} saving={saving} onCancel={() => setShowForm(false)} />
        </div>
      )}
      {loading ? <div className="bg-white border border-gray-200 rounded-2xl h-40 animate-pulse" /> : items.length === 0 ? <div className="bg-white border border-gray-200 rounded-2xl p-8 text-center text-sm text-gray-400">No announcements yet.</div> : (
        <div className="space-y-3">
          {items.map((item) => (
            <div key={item.id} className="bg-white border border-gray-200 rounded-2xl p-4 flex items-start justify-between gap-4">
              <div className="min-w-0"><div className="flex items-center gap-2 mb-1"><p className="font-semibold text-gray-900 text-sm">{item.title}</p><span className={`badge text-[10px] ${item.is_active ? 'bg-green-50 text-green-600 border border-green-200' : 'bg-gray-100 text-gray-500'}`}>{item.is_active ? 'Active' : 'Inactive'}</span></div><p className="text-xs text-gray-400 line-clamp-2">{item.body}</p></div>
              <div className="flex gap-1.5 flex-shrink-0"><button onClick={() => toggleActive(item.id, item.is_active)} className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center text-gray-500 hover:text-gray-900 transition-colors"><Sparkles className="w-3.5 h-3.5" /></button><button onClick={() => handleDelete(item.id)} className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center text-red-500 hover:text-red-600 hover:bg-red-50 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button></div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Banners Admin ────────────────────────────────────────────────────────────
function BannersAdmin() {
  const [items, setItems] = useState<{ id: string; title: string; subtitle: string | null; image_url: string | null; is_active: boolean; sort_order: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', subtitle: '', image_url: '', link_url: '' });
  const [saving, setSaving] = useState(false);

  const load = async () => { setLoading(true); const { data } = await supabase.from('banners').select('*').order('sort_order'); setItems(data || []); setLoading(false); };
  useEffect(() => { load(); }, []);

  const handleCreate = async () => {
    if (!form.title.trim()) return;
    setSaving(true);
    await supabase.from('banners').insert({ title: form.title, subtitle: form.subtitle || null, image_url: form.image_url || null, link_url: form.link_url || null, is_active: true, sort_order: items.length });
    setForm({ title: '', subtitle: '', image_url: '', link_url: '' }); setShowForm(false); setSaving(false); load();
  };

  const handleDelete = async (id: string) => { if (!confirm('Delete?')) return; await supabase.from('banners').delete().eq('id', id); load(); };
  const toggleActive = async (id: string, current: boolean) => { await supabase.from('banners').update({ is_active: !current }).eq('id', id); load(); };

  return (
    <div>
      <div className="flex items-center justify-between mb-4"><p className="text-sm text-gray-500">{items.length} banners</p><button onClick={() => setShowForm(!showForm)} className="btn-primary text-sm py-2 px-3"><Plus className="w-4 h-4" /> New</button></div>
      {showForm && (
        <div className="bg-white border border-gray-200 rounded-2xl p-5 mb-4 space-y-3">
          <Input label="Title"><input className="input-field" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Banner title" /></Input>
          <Input label="Subtitle"><input className="input-field" value={form.subtitle} onChange={(e) => setForm({ ...form, subtitle: e.target.value })} placeholder="Subtitle" /></Input>
          <Input label="Image URL"><input className="input-field" value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} placeholder="https://…" /></Input>
          <Input label="Link URL"><input className="input-field" value={form.link_url} onChange={(e) => setForm({ ...form, link_url: e.target.value })} placeholder="https://…" /></Input>
          <SaveBar onSave={handleCreate} saving={saving} onCancel={() => setShowForm(false)} />
        </div>
      )}
      {loading ? <div className="bg-white border border-gray-200 rounded-2xl h-40 animate-pulse" /> : items.length === 0 ? <div className="bg-white border border-gray-200 rounded-2xl p-8 text-center text-sm text-gray-400">No banners yet.</div> : (
        <div className="grid sm:grid-cols-2 gap-3">
          {items.map((item) => (
            <div key={item.id} className="bg-white border border-gray-200 rounded-2xl p-4">
              <div className="flex items-start justify-between gap-3 mb-2"><div className="min-w-0"><p className="font-semibold text-gray-900 text-sm mb-0.5">{item.title}</p>{item.subtitle && <p className="text-xs text-gray-400">{item.subtitle}</p>}</div><span className={`badge text-[10px] flex-shrink-0 ${item.is_active ? 'bg-green-50 text-green-600 border border-green-200' : 'bg-gray-100 text-gray-500'}`}>{item.is_active ? 'Active' : 'Inactive'}</span></div>
              {item.image_url && <img src={item.image_url} alt="" className="w-full h-24 object-cover rounded-lg mb-2" loading="lazy" />}
              <div className="flex gap-1.5"><button onClick={() => toggleActive(item.id, item.is_active)} className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center text-gray-500 hover:text-gray-900 transition-colors"><Sparkles className="w-3.5 h-3.5" /></button><button onClick={() => handleDelete(item.id)} className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center text-red-500 hover:text-red-600 hover:bg-red-50 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button></div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
