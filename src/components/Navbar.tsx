import { useEffect, useState } from 'react';
import { Search as SearchIcon, Bell, Shield, LogOut } from 'lucide-react';
import { useRouter, type Route } from '../lib/router';
import { AchieverLogo } from './AchieverLogo';
import { useAuth } from '../lib/auth';

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
  const { isAdmin, user, signOut } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

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
          <div className="relative ml-1">
            <button onClick={() => setShowUserMenu(!showUserMenu)} className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold transition-transform hover:scale-105" style={{ background: 'linear-gradient(135deg, #0d9488, #0891b2)' }} aria-label="Profile">
              {user?.email?.[0]?.toUpperCase() || 'S'}
            </button>
            {showUserMenu && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowUserMenu(false)} />
                <div className="absolute right-0 top-11 z-50 w-56 bg-white border border-gray-200 rounded-2xl shadow-premium py-2">
                  <div className="px-4 py-2 border-b border-gray-100">
                    <p className="text-xs font-semibold text-gray-900 truncate">{user?.email || 'Guest'}</p>
                    <p className="text-[10px] text-gray-400 mt-0.5">{isAdmin ? 'Administrator' : 'Visitor'}</p>
                  </div>
                  <button onClick={() => { setShowUserMenu(false); navigate({ name: 'profile' }); }} className="w-full px-4 py-2 text-left text-sm text-gray-600 hover:bg-gray-50 transition-colors">Profile</button>
                  {isAdmin && (
                    <button onClick={() => { setShowUserMenu(false); navigate({ name: 'admin' }); }} className="w-full px-4 py-2 text-left text-sm text-gray-600 hover:bg-gray-50 transition-colors flex items-center gap-2">
                      <Shield className="w-3.5 h-3.5" /> Admin Dashboard
                    </button>
                  )}
                  {user && (
                    <button onClick={() => { setShowUserMenu(false); signOut(); }} className="w-full px-4 py-2 text-left text-sm text-red-500 hover:bg-red-50 transition-colors flex items-center gap-2">
                      <LogOut className="w-3.5 h-3.5" /> Sign Out
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
