import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, X, RefreshCw, WifiOff } from 'lucide-react';
import { usePWA } from '../lib/hooks';

export function PWAInstallPrompt() {
  const { installable, installed, updateAvailable, offline, promptInstall, applyUpdate } = usePWA();
  const [dismissed, setDismissed] = useState(false);
  const [showOffline, setShowOffline] = useState(false);

  useEffect(() => {
    if (offline) {
      const t = setTimeout(() => setShowOffline(true), 1000);
      return () => clearTimeout(t);
    }
    setShowOffline(false);
  }, [offline]);

  // Don't show install prompt if already installed or dismissed
  if (installed && !updateAvailable && !showOffline) return null;

  return (
    <AnimatePresence>
      {/* Offline banner */}
      {showOffline && (
        <motion.div
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -100, opacity: 0 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="fixed top-0 left-0 right-0 z-[60] bg-amber-500 text-black px-4 py-2.5 flex items-center justify-center gap-2 text-sm font-medium"
        >
          <WifiOff className="w-4 h-4" />
          You're offline. Cached content is still available.
        </motion.div>
      )}

      {/* Update available prompt */}
      {updateAvailable && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="fixed bottom-20 left-4 right-4 z-[60] max-w-md mx-auto"
        >
          <div className="bg-white border border-gray-200 rounded-2xl shadow-2xl p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center flex-shrink-0">
              <RefreshCw className="w-5 h-5 text-primary-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900">Update available</p>
              <p className="text-xs text-gray-400">A new version of the app is ready.</p>
            </div>
            <button
              onClick={applyUpdate}
              className="px-4 py-2 bg-primary-600 text-white rounded-xl text-sm font-medium hover:bg-primary-700 transition-colors flex-shrink-0"
            >
              Update
            </button>
          </div>
        </motion.div>
      )}

      {/* Install prompt */}
      {installable && !dismissed && !installed && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="fixed bottom-20 left-4 right-4 z-[60] max-w-md mx-auto"
        >
          <div className="bg-white border border-gray-200 rounded-2xl shadow-2xl p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-accent-400 flex items-center justify-center flex-shrink-0">
              <Download className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900">Install Shivansh</p>
              <p className="text-xs text-gray-400">Add to your home screen for a faster experience.</p>
            </div>
            <button
              onClick={() => promptInstall()}
              className="px-4 py-2 bg-primary-600 text-white rounded-xl text-sm font-medium hover:bg-primary-700 transition-colors flex-shrink-0"
            >
              Install
            </button>
            <button
              onClick={() => setDismissed(true)}
              className="p-1.5 text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0"
              aria-label="Dismiss"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
