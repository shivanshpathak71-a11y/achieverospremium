import { Suspense, lazy, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RouterProvider, useRouter } from './lib/router';
import { AuthProvider, useAuth } from './lib/auth';
import { fullSync, pushProgress, pushStudyTime } from './lib/sync';
import { setSyncCallbacks, clearSyncCallbacks } from './lib/storage';
import { Navbar } from './components/Navbar';
import { BottomNav } from './components/BottomNav';
import { SplashScreen } from './components/SplashScreen';
import { SimplePage } from './components/SimplePage';

const HomePage         = lazy(() => import('./components/HomePage').then(m => ({ default: m.HomePage })));
const CourseListPage   = lazy(() => import('./components/CoursePages').then(m => ({ default: m.CourseListPage })));
const CourseDetailPage = lazy(() => import('./components/CoursePages').then(m => ({ default: m.CourseDetailPage })));
const ChapterPage      = lazy(() => import('./components/CoursePages').then(m => ({ default: m.ChapterPage })));
const LecturePage      = lazy(() => import('./components/LecturePage').then(m => ({ default: m.LecturePage })));
const SearchPage       = lazy(() => import('./components/SearchPage').then(m => ({ default: m.SearchPage })));
const ProfilePage      = lazy(() => import('./components/ProfilePage').then(m => ({ default: m.ProfilePage })));
const AdminPage        = lazy(() => import('./components/AdminPage').then(m => ({ default: m.AdminPage })));
const AuthPage         = lazy(() => import('./components/AuthPage').then(m => ({ default: m.AuthPage })));

function Loading() {
  return (
    <div className="max-w-7xl mx-auto px-4 pt-24 pb-16">
      <div className="space-y-4">
        <div className="h-8 w-48 bg-gray-200 rounded-lg animate-pulse" />
        <div className="h-4 w-64 bg-gray-200 rounded animate-pulse" />
      </div>
    </div>
  );
}

function Routes() {
  const { route } = useRouter();

  const renderPage = () => {
    switch (route.name) {
      case 'home':           return <HomePage />;
      case 'courses':        return <CourseListPage />;
      case 'course':         return <CourseDetailPage slug={route.slug} />;
      case 'chapter':        return <ChapterPage subjectSlug={route.subjectSlug} chapterSlug={route.chapterSlug} />;
      case 'lecture':        return <LecturePage subjectSlug={route.subjectSlug} chapterSlug={route.chapterSlug} lectureId={route.lectureId} />;
      case 'search':         return <SearchPage />;
      case 'profile':        return <ProfilePage />;
      case 'admin':          return <AdminPage />;
      case 'test-series':    return <SimplePage title="Test Series" subtitle="Practice tests and mock exams." icon="FileText" />;
      case 'free-content':   return <SimplePage title="Free Content" subtitle="Access free study material and sample lessons." icon="BookOpen" />;
      case 'previous-papers': return <SimplePage title="Previous Year Papers" subtitle="Previous year question papers with solutions." icon="FileArchive" />;
      case 'more':           return <SimplePage title="More" subtitle="Settings, help, and additional features." icon="MoreHorizontal" />;
      default:               return <HomePage />;
    }
  };

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={route.name + (route.name === 'lecture' ? route.lectureId : '') + (route.name === 'course' ? route.slug : '') + (route.name === 'chapter' ? route.chapterSlug : '')}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
      >
        <Suspense fallback={<Loading />}>
          {renderPage()}
        </Suspense>
      </motion.div>
    </AnimatePresence>
  );
}

function AppContent() {
  const [showSplash, setShowSplash] = useState(true);
  const { user, loading } = useAuth();

  useEffect(() => {
    const timer = setTimeout(() => setShowSplash(false), 3200);
    return () => clearTimeout(timer);
  }, []);

  // Trigger full sync when user signs in
  useEffect(() => {
    if (user) {
      setSyncCallbacks({
        onProgress: (lectureId, position, duration, completed) => pushProgress(lectureId, position, duration, completed),
        onStats: (date, seconds) => pushStudyTime(date, seconds),
      });
      fullSync().catch(console.warn);
    } else {
      clearSyncCallbacks();
    }
  }, [user]);

  if (loading || showSplash) {
    return <SplashScreen visible={showSplash} />;
  }

  // Not signed in — show auth page
  if (!user) {
    return <AuthPage />;
  }

  return (
    <>
      <Navbar />
      <Routes />
      <BottomNav />
    </>
  );
}

function App() {
  return (
    <AuthProvider>
      <RouterProvider>
        <AppContent />
      </RouterProvider>
    </AuthProvider>
  );
}

export default App;
