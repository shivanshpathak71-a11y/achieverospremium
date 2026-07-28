import { motion, AnimatePresence } from 'framer-motion';

export function SplashScreen({ visible }: { visible: boolean }) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center overflow-hidden"
          style={{ background: 'radial-gradient(ellipse at center, #f0fdfa 0%, #ffffff 50%, #f0fdfa 100%)' }}
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.02, filter: 'blur(8px)' }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        >
          {/* Ambient glow orbs */}
          <motion.div
            className="absolute w-72 h-72 rounded-full blur-3xl"
            style={{ background: 'radial-gradient(circle, rgba(20,184,166,0.15), transparent 70%)', top: '15%', left: '20%' }}
            animate={{ scale: [1, 1.15, 1], opacity: [0.4, 0.6, 0.4] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.div
            className="absolute w-64 h-64 rounded-full blur-3xl"
            style={{ background: 'radial-gradient(circle, rgba(8,145,178,0.12), transparent 70%)', bottom: '20%', right: '25%' }}
            animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
            transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
          />

          {/* Logo */}
          <motion.div
            initial={{ scale: 0.6, opacity: 0, rotateZ: -8 }}
            animate={{ scale: 1, opacity: 1, rotateZ: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="relative z-10"
          >
            <div className="relative">
              {/* Glow ring */}
              <motion.div
                className="absolute inset-0 rounded-2xl blur-xl"
                style={{ background: 'linear-gradient(135deg, #14b8a6, #0891b2)' }}
                animate={{ opacity: [0.3, 0.6, 0.3], scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              />
              <svg width="72" height="72" viewBox="0 0 48 48" fill="none" className="relative">
                <rect width="48" height="48" rx="14" fill="url(#splash_grad)" />
                <motion.path
                  d="M24 8L14 40h6.75l1.35-6.75h3.8L27.25 40H34L24 8zm-3.45 21l3.45-9 3.45 9H20.55z"
                  fill="white"
                  fillOpacity="0.97"
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: 1 }}
                  transition={{ duration: 1.2, delay: 0.3, ease: 'easeInOut' }}
                />
                <circle cx="24" cy="12" r="2.5" fill="#FBBF24" />
                <defs>
                  <linearGradient id="splash_grad" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#0F766E" />
                    <stop offset="0.5" stopColor="#0891B2" />
                    <stop offset="1" stopColor="#0E7490" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
          </motion.div>

          {/* Brand name */}
          <motion.div
            className="relative z-10 mt-6 text-center"
            initial={{ opacity: 0, y: 14, filter: 'blur(4px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            transition={{ delay: 0.5, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          >
            <h1 className="font-bold text-2xl tracking-tight text-gray-900">Shivansh</h1>
            <motion.p
              className="text-sm font-medium text-teal-600 mt-1 tracking-wide"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8, duration: 0.5 }}
            >
              Income Tax Officer
            </motion.p>
          </motion.div>

          {/* Progress bar */}
          <motion.div
            className="relative z-10 mt-8 w-36 h-1 rounded-full bg-gray-100 overflow-hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
          >
            <motion.div
              className="h-full rounded-full"
              style={{ background: 'linear-gradient(90deg, #14b8a6, #0891b2)' }}
              initial={{ width: '0%' }}
              animate={{ width: '100%' }}
              transition={{ duration: 1.8, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
