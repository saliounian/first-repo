import { useState } from 'react';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import ThemeToggle from '../components/ThemeToggle.jsx';

export default function Login() {
  const { login } = useAuth();

  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd]   = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email.trim(), password);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-bone flex flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-brick-500 text-white grid place-items-center font-bold text-sm select-none">
            g
          </div>
          <span className="font-semibold tracking-tight text-ink">gestCopta</span>
        </div>
        <ThemeToggle variant="icon" />
      </div>

      {/* Login card */}
      <div className="flex-1 flex items-center justify-center px-4 pb-16">
        <div className="w-full max-w-sm fade-in">
          {/* Header */}
          <div className="mb-8 text-center">
            <div className="w-14 h-14 rounded-2xl bg-brick-500 text-white grid place-items-center font-bold text-2xl mx-auto mb-4 shadow-card">
              g
            </div>
            <h1 className="text-2xl font-semibold text-ink">Connexion</h1>
            <p className="text-sm text-muted mt-1">
              Accédez à votre espace de travail
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="bg-surface border border-line/70 rounded-2xl p-6 shadow-card space-y-4">
            {/* Email */}
            <div className="space-y-1.5">
              <label className="block text-[10px] uppercase tracking-wider text-muted">
                Adresse email
              </label>
              <input
                type="email"
                autoComplete="email"
                autoFocus
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="prenom@gestcopta.sn"
                required
                className="w-full px-3 py-2.5 text-sm border border-line/70 rounded-lg bg-surface text-ink placeholder:text-muted/60
                           focus:outline-none focus:border-brick-500 focus:ring-1 focus:ring-brick-500/20 transition-colors"
              />
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label className="block text-[10px] uppercase tracking-wider text-muted">
                Mot de passe
              </label>
              <div className="relative">
                <input
                  type={showPwd ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full px-3 py-2.5 pr-10 text-sm border border-line/70 rounded-lg bg-surface text-ink placeholder:text-muted/60
                             focus:outline-none focus:border-brick-500 focus:ring-1 focus:ring-brick-500/20 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-ink transition-colors"
                  tabIndex={-1}
                >
                  {showPwd ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="px-3 py-2.5 rounded-lg bg-rose-50 border border-rose-200 text-sm text-rose-700 dark:bg-rose-950/30 dark:border-rose-800 dark:text-rose-400">
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-brick-500 hover:bg-brick-600 disabled:opacity-60 text-white text-sm font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              {loading && <Loader2 size={15} className="animate-spin" />}
              {loading ? 'Connexion…' : 'Se connecter'}
            </button>
          </form>

          {/* Demo hint */}
          <div className="mt-5 text-center">
            <p className="text-[11px] text-muted/80">
              Compte démo · admin@gestcopta.sn · <span className="font-mono">Admin1234!</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
