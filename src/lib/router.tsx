import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';

export type Route =
  | { name: 'home' }
  | { name: 'courses' }
  | { name: 'course'; slug: string }
  | { name: 'chapter'; subjectSlug: string; chapterSlug: string }
  | { name: 'lecture'; subjectSlug: string; chapterSlug: string; lectureId: string }
  | { name: 'search' }
  | { name: 'profile' }
  | { name: 'admin' }
  | { name: 'test-series' }
  | { name: 'free-content' }
  | { name: 'previous-papers' }
  | { name: 'ai-assistant' }
  | { name: 'more' }
  | { name: 'brand' };

interface RouterContextValue {
  route: Route;
  navigate: (route: Route) => void;
  canGoBack: boolean;
  goBack: () => void;
}

const RouterContext = createContext<RouterContextValue | null>(null);

export function RouterProvider({ children }: { children: ReactNode }) {
  const [route, setRoute] = useState<Route>({ name: 'home' });
  const [history, setHistory] = useState<Route[]>([]);

  const navigate = useCallback((r: Route) => {
    setHistory((prev) => [...prev, route]);
    setRoute(r);
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  }, [route]);

  const goBack = useCallback(() => {
    setHistory((prev) => {
      if (prev.length === 0) return prev;
      const previous = prev[prev.length - 1];
      setRoute(previous);
      window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
      return prev.slice(0, -1);
    });
  }, []);

  // Android back button / browser back handling
  useEffect(() => {
    const handlePopState = (e: PopStateEvent) => {
      e.preventDefault();
      if (history.length > 0) {
        goBack();
      } else {
        setRoute({ name: 'home' });
      }
      window.history.pushState(null, '', window.location.href);
    };

    window.history.pushState(null, '', window.location.href);
    window.addEventListener('popstate', handlePopState);

    return () => window.removeEventListener('popstate', handlePopState);
  }, [history.length, goBack]);

  return (
    <RouterContext.Provider value={{ route, navigate, canGoBack: history.length > 0, goBack }}>
      {children}
    </RouterContext.Provider>
  );
}

export function useRouter() {
  const ctx = useContext(RouterContext);
  if (!ctx) throw new Error('useRouter must be used within RouterProvider');
  return ctx;
}
