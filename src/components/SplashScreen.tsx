import { motion, AnimatePresence } from 'framer-motion';

const EASE = [0.16, 1, 0.3, 1] as const;

export function SplashScreen({ visible }: { visible: boolean }) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center overflow-hidden bg-black"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5, ease: EASE }}
        >
          {/* Expanding light rays from center */}
          <motion.div
            className="absolute inset-0 flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 1, 0.6, 0] }}
            transition={{ duration: 2.4, times: [0, 0.3, 0.7, 1], ease: EASE }}
          >
            <motion.div
              className="absolute rounded-full"
              style={{ background: 'radial-gradient(circle, rgba(20,184,166,0.35), transparent 60%)' }}
              initial={{ width: 0, height: 0 }}
              animate={{ width: 900, height: 900 }}
              transition={{ duration: 2.4, ease: EASE }}
            />
          </motion.div>

          {/* Rotating conic beam */}
          <motion.div
            className="absolute w-[200vmax] h-[200vmax]"
            style={{
              background: 'conic-gradient(from 0deg, transparent 0deg, rgba(20,184,166,0.12) 8deg, transparent 16deg, transparent 40deg, rgba(8,145,178,0.10) 48deg, transparent 56deg, transparent 90deg, rgba(20,184,166,0.10) 98deg, transparent 106deg, transparent 360deg)',
            }}
            initial={{ rotate: 0, opacity: 0, scale: 0.3 }}
            animate={{ rotate: 90, opacity: [0, 0.8, 0.4], scale: 1 }}
            transition={{ duration: 2.6, ease: EASE, opacity: { duration: 2.6, times: [0, 0.4, 1] } }}
          />

          {/* Vignette */}
          <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at center, transparent 30%, rgba(0,0,0,0.85) 100%)' }} />

          {/* Logo block */}
          <div className="relative z-10 flex flex-col items-center">
            {/* Logo with dramatic zoom + light sweep */}
            <motion.div
              className="relative"
              initial={{ scale: 3.5, opacity: 0, filter: 'blur(20px)' }}
              animate={{ scale: 1, opacity: 1, filter: 'blur(0px)' }}
              transition={{ duration: 1.4, ease: EASE, delay: 0.2 }}
            >
              {/* Glow halo */}
              <motion.div
                className="absolute inset-0 rounded-3xl blur-2xl"
                style={{ background: 'linear-gradient(135deg, #14b8a6, #0891b2)' }}
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: [0, 0.7, 0.4], scale: [0.5, 1.3, 1] }}
                transition={{ duration: 2.6, ease: EASE, delay: 0.2 }}
              />

              <motion.img
                src="/logos/shivansh-app-icon.svg"
                width="88" height="88"
                alt="Shivansh"
                className="relative"
                initial={{ rotate: -12 }}
                animate={{ rotate: 0 }}
                transition={{ duration: 1.2, ease: EASE, delay: 0.3 }}
              />

              {/* Light sweep across logo */}
              <motion.div
                className="absolute inset-0 overflow-hidden rounded-3xl pointer-events-none"
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 1, 0] }}
                transition={{ duration: 0.8, delay: 1.2, ease: EASE }}
              >
                <motion.div
                  className="absolute -inset-y-4 w-24"
                  style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.55), transparent)' }}
                  initial={{ x: -120, skewX: -15 }}
                  animate={{ x: 160 }}
                  transition={{ duration: 0.7, delay: 1.2, ease: EASE }}
                />
              </motion.div>
            </motion.div>

            {/* Brand name — dramatic reveal */}
            <motion.div
              className="mt-7 text-center overflow-hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.1, duration: 0.4 }}
            >
              <div className="overflow-hidden">
                <motion.h1
                  className="font-bold text-3xl tracking-[0.2em] text-white"
                  initial={{ y: '100%' }}
                  animate={{ y: '0%' }}
                  transition={{ delay: 1.1, duration: 0.7, ease: EASE }}
                >
                  SHIVANSH
                </motion.h1>
              </div>
              <motion.div
                className="h-px w-0 bg-gradient-to-r from-transparent via-teal-400 to-transparent mx-auto mt-3"
                initial={{ width: 0 }}
                animate={{ width: 180 }}
                transition={{ delay: 1.5, duration: 0.6, ease: EASE }}
              />
              <motion.p
                className="text-xs font-medium text-teal-300 mt-3 tracking-[0.35em] uppercase"
                initial={{ opacity: 0, letterSpacing: '0.1em' }}
                animate={{ opacity: 1, letterSpacing: '0.35em' }}
                transition={{ delay: 1.6, duration: 0.6, ease: EASE }}
              >
                Income Tax Officer
              </motion.p>
            </motion.div>
          </div>

          {/* Expanding panel wipe-out (Marvel-style) */}
          <motion.div
            className="absolute inset-0 bg-black origin-bottom z-20"
            initial={{ scaleY: 0 }}
            exit={{ scaleY: 1 }}
            transition={{ duration: 0.45, ease: EASE }}
            style={{ transformOrigin: 'bottom' }}
          />
          <motion.div
            className="absolute inset-0 bg-black origin-top z-20"
            initial={{ scaleY: 1 }}
            animate={{ scaleY: 0 }}
            transition={{ duration: 0.6, ease: EASE, delay: 0 }}
            style={{ transformOrigin: 'top' }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
