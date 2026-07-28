import { Play, BookOpen, Sparkles, ArrowRight, GraduationCap, Award } from 'lucide-react';
import { useRouter } from '../lib/router';
import { ParticleField } from './ParticleField';
import { useSubjects } from '../lib/hooks';

export function Hero() {
  const { navigate } = useRouter();
  const { subjects } = useSubjects();

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20 pb-12">
      {/* Animated gradient background */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-ink-950" />
        <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-royal-600/30 rounded-full blur-[120px] animate-glow-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-cyan-500/20 rounded-full blur-[120px] animate-glow-pulse" style={{ animationDelay: '2s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-purple-600/20 rounded-full blur-[100px] animate-glow-pulse" style={{ animationDelay: '4s' }} />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-ink-950" />
      </div>

      <ParticleField density={60} />

      {/* Floating glass orbs */}
      <div className="absolute top-32 left-[8%] w-24 h-24 rounded-full glass animate-float opacity-30 hidden lg:block" />
      <div className="absolute bottom-40 right-[10%] w-16 h-16 rounded-full glass animate-float-slow opacity-20 hidden lg:block" />
      <div className="absolute top-1/2 right-[20%] w-12 h-12 rounded-full bg-gradient-to-br from-cyan-400/20 to-royal-500/20 backdrop-blur-xl animate-float opacity-40 hidden lg:block" style={{ animationDelay: '3s' }} />

      <div className="relative z-10 max-w-5xl mx-auto px-4 text-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-8 animate-fade-in-down opacity-0-init" style={{ animationFillMode: 'forwards' }}>
          <Sparkles className="w-4 h-4 text-cyan-400" />
          <span className="text-sm font-medium text-ink-200">Premium English Learning Platform</span>
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
        </div>

        {/* Main title */}
        <h1 className="font-display font-extrabold tracking-tight mb-6 animate-fade-in-up opacity-0-init" style={{ animationFillMode: 'forwards' }}>
          <span className="block text-5xl sm:text-7xl md:text-8xl lg:text-9xl bg-clip-text text-transparent bg-gradient-to-r from-royal-400 via-cyan-300 to-purple-400 text-glow-strong">
            ACHIEVER 8.0
          </span>
        </h1>

        {/* Subtitle */}
        <p className="text-lg sm:text-xl md:text-2xl text-ink-300 font-medium mb-2 animate-fade-in-up opacity-0-init" style={{ animationFillMode: 'forwards', animationDelay: '150ms' }}>
          Master English Grammar <span className="text-cyan-400">•</span> Vocabulary <span className="text-cyan-400">•</span> Reading Comprehension
        </p>
        <p className="text-sm sm:text-base text-ink-500 max-w-2xl mx-auto mb-10 animate-fade-in-up opacity-0-init" style={{ animationFillMode: 'forwards', animationDelay: '250ms' }}>
          A world-class learning experience designed to take you from beginner to exam-ready. Beautifully crafted lessons, premium video lectures, and downloadable resources.
        </p>

        {/* Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in-up opacity-0-init" style={{ animationFillMode: 'forwards', animationDelay: '350ms' }}>
          <button
            onClick={() => {
              if (subjects[0]) navigate({ name: 'subject', slug: subjects[0].slug });
            }}
            className="btn-primary text-base px-8 py-4 group"
          >
            <Play className="w-5 h-5 fill-white" />
            Start Learning
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </button>
          <button
            onClick={() => navigate({ name: 'home' })}
            className="btn-ghost text-base px-8 py-4"
          >
            <BookOpen className="w-5 h-5" />
            Browse Classes
          </button>
        </div>

        {/* Stats */}
        <div className="mt-16 grid grid-cols-3 gap-4 max-w-2xl mx-auto animate-fade-in-up opacity-0-init" style={{ animationFillMode: 'forwards', animationDelay: '500ms' }}>
          {[
            { icon: GraduationCap, label: 'Subjects', value: '3' },
            { icon: BookOpen, label: 'Chapters', value: '30+' },
            { icon: Award, label: 'Lectures', value: '12+' },
          ].map((stat, i) => (
            <div key={i} className="glass-card p-4 sm:p-6 text-center hover:bg-white/[0.06] transition-all duration-300 hover:scale-105">
              <stat.icon className="w-5 h-5 sm:w-6 sm:h-6 mx-auto mb-2 text-cyan-400" />
              <div className="font-display font-bold text-2xl sm:text-3xl text-white">{stat.value}</div>
              <div className="text-xs sm:text-sm text-ink-500 mt-0.5">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Scroll indicator */}
        <div className="mt-16 animate-bounce-subtle">
          <div className="w-6 h-10 rounded-full border-2 border-ink-600 mx-auto flex items-start justify-center p-1.5">
            <div className="w-1 h-2 rounded-full bg-cyan-400" />
          </div>
        </div>
      </div>
    </section>
  );
}
