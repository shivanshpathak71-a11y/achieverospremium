import { motion } from 'framer-motion';
import { Chrome as Home, BookOpen, FileText, Sparkles, User } from 'lucide-react';
import { useRouter, type Route } from '../lib/router';

const TABS: { id: string; label: string; icon: typeof Home; route: Route }[] = [
  { id: 'home',            label: 'Home',    icon: Home,          route: { name: 'home' } },
  { id: 'courses',         label: 'Courses', icon: BookOpen,     route: { name: 'courses' } },
  { id: 'test-series',     label: 'Tests',   icon: FileText,     route: { name: 'test-series' } },
  { id: 'ai-assistant', label: 'AI',      icon: Sparkles,    route: { name: 'ai-assistant' } },
  { id: 'profile',         label: 'Profile', icon: User,         route: { name: 'profile' } },
];

export function BottomNav() {
  const { route, navigate } = useRouter();

  const isActive = (tabId: string) => {
    if (tabId === 'home') return route.name === 'home';
    if (tabId === 'courses') return ['courses', 'course', 'chapter', 'lecture', 'free-content'].includes(route.name);
    if (tabId === 'test-series') return route.name === 'test-series';
    if (tabId === 'ai-assistant') return route.name === 'ai-assistant';
    if (tabId === 'profile') return route.name === 'profile';
    return false;
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 lg:hidden">
      <div className="mx-2 mb-2">
        <div className="bg-white/95 backdrop-blur-xl border border-gray-200 rounded-2xl shadow-lg px-1 py-1 flex items-center justify-around">
          {TABS.map((tab) => {
            const active = isActive(tab.id);
            const Icon = tab.icon;
            return (
              <button key={tab.id} onClick={() => navigate(tab.route)}
                className="relative flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl transition-all duration-200"
                aria-label={tab.label} aria-current={active ? 'page' : undefined}>
                {active && <motion.span className="absolute inset-0 rounded-xl bg-primary-50" layoutId="bottomNavActive" />}
                <Icon className={`relative w-5 h-5 transition-colors duration-200 ${active ? 'text-primary-600' : 'text-gray-400'}`} strokeWidth={active ? 2.5 : 2} />
                <span className={`relative text-[10px] font-medium transition-colors duration-200 ${active ? 'text-primary-600' : 'text-gray-400'}`}>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
