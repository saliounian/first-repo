import { useState } from 'react';
import { Lock, X, AlertTriangle } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { toast } from '../utils/toast.jsx';

/**
 * Confirmation modal asking the current user to re-enter their password
 * before performing a sensitive (irreversible) action.
 *
 * Props:
 *   title       — header (e.g. "Supprimer la facture")
 *   description — explanation of what will happen
 *   confirmLabel— action button label (e.g. "Supprimer")
 *   tone        — 'danger' (default) | 'warning'
 *   onConfirm   — called when password is verified ok
 *   onCancel    — called when user cancels / closes
 */
export default function PasswordConfirmModal({
  title = 'Confirmer l\'action',
  description = 'Pour des raisons de sécurité, veuillez confirmer votre mot de passe.',
  confirmLabel = 'Confirmer',
  tone = 'danger',
  onConfirm,
  onCancel,
}) {
  const { verifyPassword, user } = useAuth();
  const [pwd, setPwd] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit(e) {
    e?.preventDefault();
    if (!pwd) { toast.error('Mot de passe requis'); return; }
    setLoading(true);
    try {
      const ok = await verifyPassword(pwd);
      if (ok) {
        onConfirm?.();
      } else {
        toast.error('Mot de passe incorrect');
      }
    } catch {
      toast.error('Erreur de vérification');
    } finally {
      setLoading(false);
    }
  }

  const accent = tone === 'warning' ? 'bg-amber-500 hover:bg-amber-600' : 'bg-rose-500 hover:bg-rose-600';
  const ring   = tone === 'warning' ? 'text-amber-500' : 'text-rose-500';

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm slide-in p-4" onClick={onCancel}>
      <form onSubmit={submit} onClick={e => e.stopPropagation()}
        className="bg-surface rounded-2xl shadow-pop w-full max-w-md">
        <div className="px-6 pt-5 pb-4 border-b border-line/60 flex items-start justify-between">
          <div className="flex items-start gap-3">
            <div className={`w-10 h-10 rounded-lg grid place-items-center bg-bone ${ring}`}>
              <AlertTriangle size={18} />
            </div>
            <div>
              <div className="font-semibold text-ink">{title}</div>
              <div className="text-sm text-muted mt-0.5">{description}</div>
            </div>
          </div>
          <button type="button" onClick={onCancel} className="text-muted hover:text-ink p-1 -mt-1"><X size={18} /></button>
        </div>

        <div className="px-6 py-5 space-y-3">
          <div>
            <label className="text-[11px] uppercase tracking-widest text-muted block mb-1.5 font-medium">
              Mot de passe — {user?.email}
            </label>
            <div className="relative">
              <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
              <input
                type="password"
                value={pwd}
                onChange={e => setPwd(e.target.value)}
                placeholder="Votre mot de passe"
                autoFocus
                className="field-input pl-9"
              />
            </div>
          </div>
        </div>

        <div className="px-6 pb-5 flex items-center justify-end gap-2">
          <button type="button" onClick={onCancel} className="px-4 py-2 text-sm border border-line/70 rounded-lg hover:bg-bone">
            Annuler
          </button>
          <button type="submit" disabled={loading || !pwd}
            className={`px-5 py-2.5 ${accent} text-white text-sm font-semibold rounded-lg disabled:opacity-50`}>
            {loading ? 'Vérification…' : confirmLabel}
          </button>
        </div>
      </form>
    </div>
  );
}
