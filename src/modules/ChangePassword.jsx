import { useState } from 'react';
import { Eye, EyeOff, Loader2, KeyRound, CheckCircle2, XCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';

function Rule({ ok, label }) {
  return (
    <li className={`flex items-center gap-1.5 text-[11px] ${ok ? 'text-brick-600' : 'text-muted'}`}>
      {ok ? <CheckCircle2 size={11} /> : <XCircle size={11} />}
      {label}
    </li>
  );
}

export default function ChangePassword() {
  const { changePassword, user } = useAuth();

  const [newPwd, setNewPwd]       = useState('');
  const [confirm, setConfirm]     = useState('');
  const [showNew, setShowNew]     = useState(false);
  const [showCon, setShowCon]     = useState(false);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState('');

  const minLen  = newPwd.length >= 8;
  const hasNum  = /\d/.test(newPwd);
  const matches = newPwd === confirm && newPwd.length > 0;
  const valid   = minLen && hasNum && matches;

  async function handleSubmit(e) {
    e.preventDefault();
    if (!valid) return;
    setError('');
    setLoading(true);
    try {
      await changePassword({ newPassword: newPwd });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-bone flex items-center justify-center px-4">
      <div className="w-full max-w-sm fade-in">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-brick-50 border border-brick-100 text-brick-500 grid place-items-center mx-auto mb-4">
            <KeyRound size={24} />
          </div>
          <h1 className="text-xl font-semibold text-ink">Changez votre mot de passe</h1>
          <p className="text-sm text-muted mt-1.5 max-w-xs mx-auto">
            Bienvenue, <strong className="text-ink">{user?.nom}</strong>. Choisissez un mot de passe personnel
            avant d'accéder à votre espace.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-surface border border-line/70 rounded-2xl p-6 shadow-card space-y-4">
          {/* New password */}
          <div className="space-y-1.5">
            <label className="block text-[10px] uppercase tracking-wider text-muted">
              Nouveau mot de passe
            </label>
            <div className="relative">
              <input
                type={showNew ? 'text' : 'password'}
                autoFocus
                value={newPwd}
                onChange={e => setNewPwd(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full px-3 py-2.5 pr-10 text-sm border border-line/70 rounded-lg bg-surface text-ink placeholder:text-muted/60
                           focus:outline-none focus:border-brick-500 focus:ring-1 focus:ring-brick-500/20 transition-colors"
              />
              <button type="button" onClick={() => setShowNew(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-ink" tabIndex={-1}>
                {showNew ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          {/* Confirm */}
          <div className="space-y-1.5">
            <label className="block text-[10px] uppercase tracking-wider text-muted">
              Confirmer le mot de passe
            </label>
            <div className="relative">
              <input
                type={showCon ? 'text' : 'password'}
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full px-3 py-2.5 pr-10 text-sm border border-line/70 rounded-lg bg-surface text-ink placeholder:text-muted/60
                           focus:outline-none focus:border-brick-500 focus:ring-1 focus:ring-brick-500/20 transition-colors"
              />
              <button type="button" onClick={() => setShowCon(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-ink" tabIndex={-1}>
                {showCon ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          {/* Rules */}
          {newPwd.length > 0 && (
            <ul className="space-y-1 pl-0.5">
              <Rule ok={minLen}  label="Au moins 8 caractères" />
              <Rule ok={hasNum}  label="Au moins un chiffre" />
              <Rule ok={matches} label="Les deux mots de passe correspondent" />
            </ul>
          )}

          {error && (
            <div className="px-3 py-2.5 rounded-lg bg-rose-50 border border-rose-200 text-sm text-rose-700 dark:bg-rose-950/30 dark:border-rose-800 dark:text-rose-400">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={!valid || loading}
            className="w-full py-2.5 bg-brick-500 hover:bg-brick-600 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            {loading && <Loader2 size={15} className="animate-spin" />}
            {loading ? 'Enregistrement…' : 'Enregistrer et continuer →'}
          </button>
        </form>
      </div>
    </div>
  );
}
