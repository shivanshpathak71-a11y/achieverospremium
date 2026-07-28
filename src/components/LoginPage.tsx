import { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Lock, LogIn, AlertCircle, Loader } from 'lucide-react';
import { useAuth } from '../lib/auth';
import { useRouter } from '../lib/router';
import { AchieverLogo } from './AchieverLogo';

export function LoginPage() {
  const { signIn } = useAuth();
  const { navigate } = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const { error } = await signIn(email, password);
    setLoading(false);
    if (error) {
      setError(error);
    } else {
      navigate({ name: 'admin' });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 pt-16 pb-16">
      <motion.div
        className="w-full max-w-sm"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="flex flex-col items-center mb-8">
          <AchieverLogo size={56} />
          <h1 className="font-extrabold text-2xl text-gray-900 mt-4">Admin Sign In</h1>
          <p className="text-sm text-gray-400 mt-1">Sign in to manage your courses</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-3xl p-6 space-y-4 shadow-premium">
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Email</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="input-field pl-10"
                autoComplete="email"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Password</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="input-field pl-10"
                autoComplete="current-password"
              />
            </div>
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-red-50 border border-red-100"
            >
              <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
              <span className="text-xs text-red-600 font-medium">{error}</span>
            </motion.div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full py-3 flex items-center justify-center gap-2"
          >
            {loading ? (
              <><Loader className="w-4 h-4 animate-spin" /> Signing in...</>
            ) : (
              <><LogIn className="w-4 h-4" /> Sign In</>
            )}
          </button>
        </form>

        <button
          onClick={() => navigate({ name: 'home' })}
          className="w-full text-center text-sm text-gray-400 hover:text-gray-600 mt-6 transition-colors"
        >
          Back to app
        </button>
      </motion.div>
    </div>
  );
}
