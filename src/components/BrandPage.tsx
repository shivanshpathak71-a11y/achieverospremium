import { motion } from 'framer-motion';
import { ArrowLeft, Download, Crown, Shield, Sparkles } from 'lucide-react';
import { useRouter } from '../lib/router';

interface LogoVariant {
  id: string;
  label: string;
  description: string;
  src: string;
  bg: string;
  size: string;
}

const HORIZONTAL_VARIANTS: LogoVariant[] = [
  { id: 'main', label: 'Primary Logo', description: 'Matte black background with metallic gold & silver accents', src: '/logos/shivansh-main.svg', bg: 'bg-[#0B0B0B]', size: 'w-full max-w-2xl' },
  { id: 'transparent', label: 'Transparent', description: 'No background — use on any surface', src: '/logos/shivansh-transparent.svg', bg: 'bg-gradient-to-br from-gray-100 to-gray-300', size: 'w-full max-w-2xl' },
  { id: 'gold', label: 'All-Gold', description: 'Full gold treatment for premium surfaces', src: '/logos/shivansh-gold.svg', bg: 'bg-[#0B0B0B]', size: 'w-full max-w-2xl' },
  { id: 'white', label: 'White', description: 'Monochrome white on black', src: '/logos/shivansh-white.svg', bg: 'bg-[#0B0B0B]', size: 'w-full max-w-2xl' },
  { id: 'black', label: 'Black', description: 'Black on white — for print & letterhead', src: '/logos/shivansh-black.svg', bg: 'bg-white', size: 'w-full max-w-2xl' },
  { id: 'mono', label: 'Monochrome', description: 'Single-color black version', src: '/logos/shivansh-mono.svg', bg: 'bg-white', size: 'w-full max-w-2xl' },
];

const ICON_VARIANTS: LogoVariant[] = [
  { id: 'app', label: 'App Icon', description: 'Rounded square for Android & iOS', src: '/logos/shivansh-app-icon.svg', bg: 'bg-[#0B0B0B]', size: 'w-40 h-40' },
  { id: 'profile', label: 'Profile', description: 'Circular for social media', src: '/logos/shivansh-profile.svg', bg: 'bg-[#0B0B0B]', size: 'w-40 h-40' },
  { id: 'monogram', label: 'Monogram', description: 'SI letters only — transparent', src: '/logos/shivansh-monogram.svg', bg: 'bg-gradient-to-br from-gray-100 to-gray-300', size: 'w-40 h-40' },
];

function LogoCard({ variant, index }: { variant: LogoVariant; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="group"
    >
      <div className={`relative ${variant.bg} rounded-3xl border border-gray-200 overflow-hidden flex items-center justify-center p-8 transition-all duration-500 group-hover:shadow-premium`}>
        <img src={variant.src} alt={variant.label} className={`${variant.size} transition-transform duration-700 group-hover:scale-105`} />
        <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <a href={variant.src} download className="w-9 h-9 rounded-xl bg-black/60 backdrop-blur-sm flex items-center justify-center hover:bg-black/80 transition-colors">
            <Download className="w-4 h-4 text-white" />
          </a>
        </div>
      </div>
      <div className="mt-3 px-1">
        <h3 className="text-sm font-bold text-gray-900">{variant.label}</h3>
        <p className="text-xs text-gray-400 mt-0.5">{variant.description}</p>
      </div>
    </motion.div>
  );
}

export function BrandPage() {
  const { navigate } = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0B0B0B] via-[#111] to-[#0B0B0B] pt-20 pb-20">
      {/* Hero */}
      <div className="max-w-5xl mx-auto px-4 mb-16 text-center">
        <motion.button
          onClick={() => navigate({ name: 'home' })}
          className="inline-flex items-center gap-2 text-xs text-gray-500 hover:text-gold-400 transition-colors mb-8"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </motion.button>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="inline-block mb-6"
        >
          <div className="flex items-center justify-center gap-2 text-gold-400 mb-4">
            <Crown className="w-5 h-5" />
            <span className="text-xs font-bold tracking-[0.3em] uppercase">Personal Brand Identity</span>
            <Crown className="w-5 h-5" />
          </div>
        </motion.div>

        <motion.img
          src="/logos/shivansh-main.svg"
          alt="SHIVANSH"
          className="w-full max-w-3xl mx-auto rounded-3xl shadow-premium"
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
        />

        <motion.p
          className="text-sm text-gray-400 max-w-xl mx-auto mt-6 leading-relaxed"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
        >
          An ultra-premium identity built around the SI monogram — symbolizing justice,
          knowledge, precision, and financial integrity. Crafted for a future senior
          Income Tax Officer.
        </motion.p>
      </div>

      {/* Design Principles */}
      <div className="max-w-5xl mx-auto px-4 mb-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { icon: Shield, title: 'Authority & Trust', desc: 'Symmetrical geometry conveys stability and command.' },
            { icon: Sparkles, title: 'Luxury Craftsmanship', desc: 'Metallic gold gradients meet matte black minimalism.' },
            { icon: Crown, title: 'Timeless Excellence', desc: 'Clean serif typography designed to endure for decades.' },
          ].map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 + i * 0.1 }}
              className="bg-white/5 border border-white/10 rounded-2xl p-6 text-center backdrop-blur-sm"
            >
              <div className="w-12 h-12 rounded-xl bg-gold-400/10 flex items-center justify-center mx-auto mb-3">
                <item.icon className="w-6 h-6 text-gold-400" />
              </div>
              <h3 className="text-sm font-bold text-white mb-1">{item.title}</h3>
              <p className="text-xs text-gray-400 leading-relaxed">{item.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Horizontal Logos */}
      <div className="max-w-6xl mx-auto px-4 mb-16">
        <div className="flex items-center gap-3 mb-6">
          <div className="h-px flex-1 bg-gradient-to-r from-transparent to-gold-400/30" />
          <h2 className="text-xs font-bold tracking-[0.25em] uppercase text-gold-400">Horizontal Lockups</h2>
          <div className="h-px flex-1 bg-gradient-to-l from-transparent to-gold-400/30" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {HORIZONTAL_VARIANTS.map((v, i) => <LogoCard key={v.id} variant={v} index={i} />)}
        </div>
      </div>

      {/* Icon Variants */}
      <div className="max-w-6xl mx-auto px-4 mb-16">
        <div className="flex items-center gap-3 mb-6">
          <div className="h-px flex-1 bg-gradient-to-r from-transparent to-gold-400/30" />
          <h2 className="text-xs font-bold tracking-[0.25em] uppercase text-gold-400">Icons & Monogram</h2>
          <div className="h-px flex-1 bg-gradient-to-l from-transparent to-gold-400/30" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-2xl mx-auto">
          {ICON_VARIANTS.map((v, i) => <LogoCard key={v.id} variant={v} index={i} />)}
        </div>
      </div>

      {/* Color Palette */}
      <div className="max-w-4xl mx-auto px-4 mb-16">
        <div className="flex items-center gap-3 mb-6">
          <div className="h-px flex-1 bg-gradient-to-r from-transparent to-gold-400/30" />
          <h2 className="text-xs font-bold tracking-[0.25em] uppercase text-gold-400">Color Palette</h2>
          <div className="h-px flex-1 bg-gradient-to-l from-transparent to-gold-400/30" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { name: 'Matte Black', hex: '#0B0B0B', bg: 'bg-[#0B0B0B]', text: 'text-white' },
            { name: 'Metallic Gold', hex: '#D4AF37', bg: 'bg-[#D4AF37]', text: 'text-black' },
            { name: 'White', hex: '#FFFFFF', bg: 'bg-white', text: 'text-black' },
            { name: 'Deep Navy', hex: '#0A1A3F', bg: 'bg-[#0A1A3F]', text: 'text-white' },
          ].map((c, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.08 }}
              className={`${c.bg} rounded-2xl p-6 text-center border border-white/10`}
            >
              <p className={`text-xs font-bold ${c.text}`}>{c.name}</p>
              <p className={`text-[10px] mt-1 font-mono ${c.text} opacity-60`}>{c.hex}</p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="max-w-4xl mx-auto px-4 text-center">
        <p className="text-xs text-gray-500">
          All logos are original vector artwork (SVG). No government emblems, seals, or
          protected insignia are used. Fully scalable to 8K and beyond.
        </p>
      </div>
    </div>
  );
}
