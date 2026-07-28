import { useEffect, useState } from 'react';
import { Search as SearchIcon, Bell, Shield } from 'lucide-react';
import { useRouter, type Route } from '../lib/router';
import { AchieverLogo } from './AchieverLogo';
import { useAdminStatus } from '../lib/hooks';

const NAV_ITEMS: { label: string; route: Route }[] = [
  { label: 'Home',               route: { name: 'home' } },
  { label: 'Courses',            route: { name: 'courses' } },
  { label: 'Test Series',        route: { name: 'test-series' } },
  { label: 'Free Content',       route: { name: 'free-content' } },
  { label: 'Previous Year Papers', route: { name: 'previous-papers' } },
  { label: 'More',               route: { name: 'more' } },
];

export function Navbar() {
  const { route, navigate } = useRouter();
  const { isAdmin } = useAdminStatus();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const isActive = (label: string) => {
    if (label === 'Home') return route.name === 'home';
    if (label === 'Courses') return ['courses', 'course', 'chapter', 'lecture'].includes(route.name);
    if (label === 'Test Series') return route.name === 'test-series';
    if (label === 'Free Content') return route.name === 'free-content';
    if (label === 'Previous Year Papers') return route.name === 'previous-papers';
    if (label === 'More') return route.name === 'more';
    return false;
  };

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-white/90 backdrop-blur-xl border-b border-gray-200 shadow-sm' : 'bg-white/60 backdrop-blur-md'}`}>
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
        <button onClick={() => navigate({ name: 'home' })} className="flex items-center gap-2.5 flex-shrink-0" aria-label="Shivansh home">
          <AchieverLogo size={36} />
          <div className="text-left hidden sm:block">
            <div className="font-bold text-sm text-gray-800 leading-none">Shivansh</div>
            <div className="text-[9px] text-gray-400 leading-none mt-0.5">Income Tax Officer</div>
          </div>
        </button>

        <div className="hidden lg:flex items-center gap-0.5">
          {NAV_ITEMS.map((item) => {
            const active = isActive(item.label);
            return (
              <button key={item.label} onClick={() => navigate(item.route)}
                className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${active ? 'text-primary-700 bg-primary-50' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'}`}>
                {item.label}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-1">
          <button onClick={() => navigate({ name: 'search' })} className="w-9 h-9 rounded-lg flex items-center justify-center text-gray-500 hover:text-gray-900 hover:bg-gray-50 transition-all" aria-label="Search">
            <SearchIcon className="w-[18px] h-[18px]" />
          </button>
          <button className="w-9 h-9 rounded-lg flex items-center justify-center text-gray-500 hover:text-gray-900 hover:bg-gray-50 transition-all relative" aria-label="Notifications">
            <Bell className="w-[18px] h-[18px]" />
            <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-primary-500" />
          </button>
          <button onClick={() => navigate({ name: 'profile' })} className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold ml-1 transition-transform hover:scale-105" style={{ background: 'linear-gradient(135deg, #0d9488, #0891b2)' }} aria-label="Profile">S</button>
          {isAdmin && (
            <button onClick={() => navigate({ name: 'admin' })} className="w-9 h-9 rounded-lg flex items-center justify-center text-primary-600 hover:bg-primary-50 transition-all" aria-label="Admin Dashboard">
              <Shield className="w-[18px] h-[18px]" />
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}
