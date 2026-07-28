import { GraduationCap, Github, Twitter, Youtube } from 'lucide-react';

export function Footer() {
  return (
    <footer className="relative mt-20 border-t border-white/5">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-royal-500 to-cyan-400 flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="font-display font-bold text-white">Elevate Academy</div>
              <div className="text-xs text-ink-500">Achiever 8.0 — Premium English Learning</div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {[Github, Twitter, Youtube].map((Icon, i) => (
              <button
                key={i}
                className="w-10 h-10 rounded-xl glass flex items-center justify-center text-ink-400 hover:text-white hover:bg-white/10 transition-all duration-200"
              >
                <Icon className="w-4 h-4" />
              </button>
            ))}
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-white/5 text-center text-xs text-ink-500">
          © 2026 Elevate Academy. Crafted for Achiever 8.0 aspirants.
        </div>
      </div>
    </footer>
  );
}
