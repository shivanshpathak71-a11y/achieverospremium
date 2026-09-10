import { motion } from 'framer-motion';
import { ChevronRight, Home } from 'lucide-react';
import { useRouter } from '../lib/router';
import type { Route } from '../lib/router';

export interface BreadcrumbItem {
  label: string;
  route?: Route;
}

export function Breadcrumbs({ items }: { items: BreadcrumbItem[] }) {
  const { navigate } = useRouter();

  return (
    <motion.div
      className="sticky top-14 z-30 bg-white/80 backdrop-blur-lg border-b border-gray-100"
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="max-w-7xl mx-auto px-4 py-2.5 flex items-center gap-1 overflow-x-auto scrollbar-hide">
        <button
          onClick={() => navigate({ name: 'home' })}
          className="flex items-center gap-1 text-xs font-medium text-gray-400 hover:text-primary-600 transition-colors flex-shrink-0"
        >
          <Home className="w-3.5 h-3.5" />
        </button>
        {items.map((item, i) => (
          <div key={i} className="flex items-center gap-1 flex-shrink-0">
            <ChevronRight className="w-3 h-3 text-gray-300 flex-shrink-0" />
            {item.route ? (
              <button
                onClick={() => navigate(item.route!)}
                className="text-xs font-medium text-gray-400 hover:text-primary-600 transition-colors whitespace-nowrap"
              >
                {item.label}
              </button>
            ) : (
              <span className="text-xs font-semibold text-gray-900 whitespace-nowrap truncate max-w-[140px]">
                {item.label}
              </span>
            )}
          </div>
        ))}
      </div>
    </motion.div>
  );
}
