import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';

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
  | { name: 'more' };

interface RouterContextValue {
  route: Route;
  navigate: (route: Route) => void;
}

const RouterContext = createContext<RouterContextValue | null>(null);

export function RouterProvider({ children }: { children: ReactNode }) {
  const [route, setRoute] = useState<Route>({ name: 'home' });
  const navigate = useCallback((r: Route) => {
    setRoute(r);
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  }, []);
  return <RouterContext.Provider value={{ route, navigate }}>{children}</RouterContext.Provider>;
}

export function useRouter() {
  const ctx = useContext(RouterContext);
  if (!ctx) throw new Error('useRouter must be used within RouterProvider');
  return ctx;
}
