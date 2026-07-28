import { Shield, BookOpen, FileText, FileArchive, MoveHorizontal as MoreHorizontal, Settings, CircleHelp as HelpCircle, Star, Download, LogIn } from 'lucide-react';
import { useRouter } from '../lib/router';

export function SimplePage({ title, subtitle, icon }: { title: string; subtitle: string; icon: string }) {
  const { navigate } = useRouter();

  const IconMap: Record<string, typeof Shield> = {
    FileText, FileArchive, BookOpen, MoreHorizontal, Settings, Shield,
  };
  const Icon = IconMap[icon] || BookOpen;

  const isMore = title === 'More';

  return (
    <div className="max-w-3xl mx-auto px-4 pt-20 pb-24 lg:pb-12">
      <div className="mt-4 mb-8">
        <div className="w-14 h-14 rounded-2xl bg-primary-50 flex items-center justify-center mb-4">
          <Icon className="w-7 h-7 text-primary-500" />
        </div>
        <h1 className="font-bold text-2xl text-gray-900 mb-1">{title}</h1>
        <p className="text-sm text-gray-500">{subtitle}</p>
      </div>

      {isMore ? (
        <div className="space-y-3">
          <MoreItem icon={Settings} title="Settings" subtitle="App preferences, dark mode, notifications" />
          <MoreItem icon={Download} title="Downloads" subtitle="Manage offline content" />
          <MoreItem icon={Star} title="Rate Us" subtitle="Help us improve with your feedback" />
          <MoreItem icon={HelpCircle} title="Help & Support" subtitle="FAQs, contact, privacy policy" />

          <div className="pt-6 mt-6 border-t border-gray-100">
            <p className="text-xs text-gray-400 uppercase tracking-wide font-semibold mb-3">Administration</p>
            <button
              onClick={() => navigate({ name: 'admin' })}
              className="w-full bg-white border border-gray-200 rounded-2xl p-4 flex items-center gap-3 text-left hover:border-primary-200 hover:shadow-sm transition-all group"
            >
              <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center group-hover:bg-primary-50 transition-colors">
                <Shield className="w-5 h-5 text-gray-500 group-hover:text-primary-500 transition-colors" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-gray-900">Admin Panel</p>
                <p className="text-xs text-gray-400">Manage courses, lectures, and content</p>
              </div>
              <LogIn className="w-4 h-4 text-gray-300 group-hover:text-primary-500 transition-colors" />
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-2xl p-8 text-center">
          <p className="text-sm text-gray-400">This section is coming soon. Stay tuned!</p>
        </div>
      )}
    </div>
  );
}

function MoreItem({ icon: Icon, title, subtitle }: { icon: typeof Shield; title: string; subtitle: string }) {
  return (
    <button className="w-full bg-white border border-gray-200 rounded-2xl p-4 flex items-center gap-3 text-left hover:border-gray-300 hover:shadow-sm transition-all">
      <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center">
        <Icon className="w-5 h-5 text-gray-500" />
      </div>
      <div className="flex-1">
        <p className="text-sm font-semibold text-gray-900">{title}</p>
        <p className="text-xs text-gray-400">{subtitle}</p>
      </div>
    </button>
  );
}
