import { motion } from 'framer-motion';
import { ChevronRight, BookOpen, Users, GraduationCap } from 'lucide-react';
import { useRouter } from '../lib/router';
import { useTeachers, useTeacherBySlug, useSubjectsByTeacher, useAllChapters, useAllLectures } from '../lib/hooks';
import { getCourseProgress } from '../lib/storage';
import { Breadcrumbs } from './Breadcrumbs';

const FALLBACK_TEACHER_IMG = 'https://images.pexels.com/photos/5212345/pexels-photo-5212345.jpeg?auto=compress&cs=tinysrgb&w=400';

export function TeacherListPage() {
  const { navigate } = useRouter();
  const { teachers, loading } = useTeachers();
  const { chapters } = useAllChapters();
  const { lectures } = useAllLectures();

  if (loading) return <TeacherListSkeleton />;

  return (
    <div className="pt-16 pb-24 lg:pb-12 max-w-7xl mx-auto px-4">
      <Breadcrumbs items={[{ label: 'Teachers' }]} />

      <motion.div
        className="mb-6 mt-4"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      >
        <h1 className="font-bold text-2xl sm:text-3xl text-gray-900 mb-1">Our Teachers</h1>
        <p className="text-sm text-gray-500">Learn from expert educators</p>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {teachers.map((teacher, i) => {
          const teacherSubjects = chapters
            .filter((c) => c.subject?.teacher_id === teacher.id)
            .map((c) => c.subject_id);
          const uniqueSubjects = new Set(teacherSubjects);
          const teacherLectures = lectures.filter((l) =>
            chapters.some((c) => c.id === l.chapter_id && c.subject?.teacher_id === teacher.id)
          );
          const subjectCount = uniqueSubjects.size;
          const lectureCount = teacherLectures.length;

          return (
            <motion.button
              key={teacher.id}
              onClick={() => navigate({ name: 'teacher', teacherSlug: teacher.slug })}
              className="group bg-white border border-gray-200 rounded-3xl p-5 text-left overflow-hidden hover:shadow-premium hover:border-primary-200 transition-all duration-300 relative"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06, duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              whileHover={{ y: -3 }}
              whileTap={{ scale: 1.01 }}
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 rounded-2xl overflow-hidden flex-shrink-0 bg-gray-100">
                  <img
                    src={teacher.image_url || FALLBACK_TEACHER_IMG}
                    alt={teacher.name}
                    loading="lazy"
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-base text-gray-900 group-hover:text-primary-600 transition-colors">
                    {teacher.name}
                  </h3>
                  {teacher.designation && (
                    <p className="text-xs text-gray-400 mt-0.5">{teacher.designation}</p>
                  )}
                </div>
              </div>
              {teacher.bio && (
                <p className="text-xs text-gray-500 line-clamp-2 mb-4">{teacher.bio}</p>
              )}
              <div className="flex items-center gap-4 text-xs text-gray-400">
                <span className="flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5 text-primary-500" />
                  {subjectCount} {subjectCount === 1 ? 'subject' : 'subjects'}
                </span>
                <span className="flex items-center gap-1.5">
                  <GraduationCap className="w-3.5 h-3.5 text-accent-500" />
                  {lectureCount} lectures
                </span>
              </div>
              <ChevronRight className="absolute top-5 right-4 w-4 h-4 text-gray-300 group-hover:text-primary-500 group-hover:translate-x-1 transition-all duration-300" />
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}

export function TeacherDetailPage({ teacherSlug }: { teacherSlug: string }) {
  const { navigate } = useRouter();
  const { teacher, loading: teacherLoading } = useTeacherBySlug(teacherSlug);
  const { subjects, loading: subjectsLoading } = useSubjectsByTeacher(teacher?.id);
  const { chapters } = useAllChapters();
  const { lectures } = useAllLectures();

  if (teacherLoading || subjectsLoading) return <TeacherDetailSkeleton />;

  if (!teacher) {
    return (
      <div className="pt-20 px-4 text-center">
        <p className="text-gray-400">Teacher not found.</p>
      </div>
    );
  }

  return (
    <div className="pt-16 pb-24 lg:pb-12 max-w-7xl mx-auto px-4">
      <Breadcrumbs items={[
        { label: 'Teachers', route: { name: 'teachers' } },
        { label: teacher.name },
      ]} />

      <motion.div
        className="bg-white border border-gray-200 rounded-3xl p-6 mb-6 mt-4 flex flex-col sm:flex-row items-center sm:items-start gap-5"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="w-24 h-24 rounded-3xl overflow-hidden flex-shrink-0 bg-gray-100">
          <img
            src={teacher.image_url || FALLBACK_TEACHER_IMG}
            alt={teacher.name}
            className="w-full h-full object-cover"
          />
        </div>
        <div className="flex-1 text-center sm:text-left">
          <h1 className="font-bold text-2xl text-gray-900 mb-1">{teacher.name}</h1>
          {teacher.designation && (
            <p className="text-sm text-primary-600 font-medium mb-2">{teacher.designation}</p>
          )}
          {teacher.bio && <p className="text-sm text-gray-500 max-w-lg">{teacher.bio}</p>}
          <div className="flex items-center justify-center sm:justify-start gap-4 mt-3 text-xs text-gray-400">
            <span className="flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-primary-500" />
              {subjects.length} {subjects.length === 1 ? 'subject' : 'subjects'}
            </span>
            <span className="flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-accent-500" />
              {lectures.filter((l) => chapters.some((c) => c.id === l.chapter_id && c.subject?.teacher_id === teacher.id)).length} lectures
            </span>
          </div>
        </div>
      </motion.div>

      <h2 className="font-bold text-lg text-gray-900 mb-4">Subjects</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {subjects.map((subject, i) => {
          const subjectChapters = chapters.filter((c) => c.subject_id === subject.id);
          const subjectLectureIds = lectures
            .filter((l) => subjectChapters.some((c) => c.id === l.chapter_id))
            .map((l) => l.id);
          const progress = subjectLectureIds.length > 0 ? getCourseProgress(subjectLectureIds) : 0;

          return (
            <motion.button
              key={subject.id}
              onClick={() => navigate({ name: 'course', slug: subject.slug })}
              className="group bg-white border border-gray-200 rounded-2xl p-5 text-left hover:shadow-premium hover:border-primary-200 transition-all duration-300 relative"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06, duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              whileHover={{ y: -3 }}
              whileTap={{ scale: 1.01 }}
            >
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center mb-3"
                style={{ background: `${subject.color || '#14b8a6'}15` }}
              >
                <BookOpen className="w-6 h-6" style={{ color: subject.color || '#14b8a6' }} />
              </div>
              <h3 className="font-bold text-base text-gray-900 group-hover:text-primary-600 transition-colors mb-1">
                {subject.title}
              </h3>
              <div className="flex items-center gap-2 text-xs text-gray-400">
                <span>{subjectChapters.length} chapters</span>
                {progress > 0 && (
                  <>
                    <span>·</span>
                    <span className="text-primary-500 font-medium">{progress}%</span>
                  </>
                )}
              </div>
              {progress > 0 && (
                <div className="h-1 rounded-full bg-gray-100 mt-2 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-primary-500 to-accent-400"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              )}
              <ChevronRight className="absolute top-5 right-4 w-4 h-4 text-gray-300 group-hover:text-primary-500 group-hover:translate-x-1 transition-all duration-300" />
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}

function TeacherListSkeleton() {
  return (
    <div className="pt-20 pb-24 max-w-7xl mx-auto px-4">
      <div className="h-8 w-40 skeleton rounded-lg mb-2" />
      <div className="h-4 w-56 skeleton rounded mb-6" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="skeleton rounded-3xl p-5 h-40" />
        ))}
      </div>
    </div>
  );
}

function TeacherDetailSkeleton() {
  return (
    <div className="pt-20 pb-24 max-w-7xl mx-auto px-4">
      <div className="skeleton rounded-3xl p-6 h-32 mb-6" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="skeleton rounded-2xl p-5 h-36" />
        ))}
      </div>
    </div>
  );
}
