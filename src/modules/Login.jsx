import { useState } from 'react';
import { Eye, EyeOff, Loader2, ArrowLeft, CheckCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import ThemeToggle from '../components/ThemeToggle.jsx';

function ForgotPassword({ onBack }) {
  const [email, setEmail]     = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent]       = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    // Simulate API call — in prod: POST /api/auth/forgot-password
    await new Promise(r => setTimeout(r, 1000));
    setLoading(false);
    setSent(true);
  }

  if (sent) return (
    <div className="w-full max-w-sm fade-in text-center">
      <div className="w-14 h-14 rounded-2xl bg-brick-50 grid place-items-center mx-auto mb-4">
        <CheckCircle size={28} className="text-brick-500"/>
      </div>
      <h2 className="text-xl font-semibold text-ink">Demande envoyée</h2>
      <p className="text-sm text-muted mt-2 mb-6">
        Si cet email est enregistré, votre administrateur recevra une notification et pourra réinitialiser votre mot de passe depuis le module <strong>Administration</strong>.
      </p>
      <button onClick={onBack} className="flex items-center gap-2 text-sm text-brick-500 hover:underline mx-auto">
        <ArrowLeft size={14}/> Retour à la connexion
      </button>
    </div>
  );

  return (
    <div className="w-full max-w-sm fade-in">
      <button onClick={onBack} className="flex items-center gap-1.5 text-sm text-muted hover:text-ink mb-6 transition-colors">
        <ArrowLeft size={14}/> Retour
      </button>
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-ink">Mot de passe oublié</h2>
        <p className="text-sm text-muted mt-1">Entrez votre email pour contacter l'administrateur.</p>
      </div>
      <form onSubmit={handleSubmit} className="bg-surface border border-line/70 rounded-2xl p-6 shadow-card space-y-4">
        <div className="space-y-1.5">
          <label className="block text-[10px] uppercase tracking-wider text-muted">Adresse email</label>
          <input type="email" autoFocus required value={email} onChange={e => setEmail(e.target.value)}
            placeholder="prenom@gestcopta.sn"
            className="w-full px-3 py-2.5 text-sm border border-line/70 rounded-lg bg-surface text-ink placeholder:text-muted/60 focus:outline-none focus:border-brick-500 focus:ring-1 focus:ring-brick-500/20"/>
        </div>
        <button type="submit" disabled={loading || !email}
          className="w-full py-2.5 bg-brick-500 hover:bg-brick-600 disabled:opacity-60 text-white text-sm font-semibold rounded-lg flex items-center justify-center gap-2">
          {loading && <Loader2 size={15} className="animate-spin"/>}
          {loading ? 'Envoi…' : 'Envoyer la demande'}
        </button>
      </form>
    </div>
  );
}

export default function Login() {
  const { login } = useAuth();
  const [view,     setView]     = useState('login'); // 'login' | 'forgot'
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [showPwd,  setShowPwd]  = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');

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
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-brick-500 text-white grid place-items-center font-bold text-sm select-none">g</div>
          <span className="font-semibold tracking-tight text-ink">gestCopta</span>
        </div>
        <ThemeToggle variant="icon"/>
      </div>

      <div className="flex-1 flex items-center justify-center px-4 pb-16">
        {view === 'forgot' ? (
          <ForgotPassword onBack={() => setView('login')}/>
        ) : (
          <div className="w-full max-w-sm fade-in">
            <div className="mb-8 text-center">
              <div className="w-14 h-14 rounded-2xl bg-brick-500 text-white grid place-items-center font-bold text-2xl mx-auto mb-4 shadow-card">g</div>
              <h1 className="text-2xl font-semibold text-ink">Connexion</h1>
              <p className="text-sm text-muted mt-1">Accédez à votre espace de travail</p>
            </div>

            <form onSubmit={handleSubmit} className="bg-surface border border-line/70 rounded-2xl p-6 shadow-card space-y-4">
              <div className="space-y-1.5">
                <label className="block text-[10px] uppercase tracking-wider text-muted">Adresse email</label>
                <input type="email" autoComplete="email" autoFocus required value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="prenom@gestcopta.sn"
                  className="w-full px-3 py-2.5 text-sm border border-line/70 rounded-lg bg-surface text-ink placeholder:text-muted/60 focus:outline-none focus:border-brick-500 focus:ring-1 focus:ring-brick-500/20"/>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-[10px] uppercase tracking-wider text-muted">Mot de passe</label>
                  <button type="button" onClick={() => setView('forgot')}
                    className="text-[11px] text-brick-500 hover:underline">
                    Mot de passe oublié ?
                  </button>
                </div>
                <div className="relative">
                  <input type={showPwd ? 'text' : 'password'} autoComplete="current-password" required
                    value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••"
                    className="w-full px-3 py-2.5 pr-10 text-sm border border-line/70 rounded-lg bg-surface text-ink placeholder:text-muted/60 focus:outline-none focus:border-brick-500 focus:ring-1 focus:ring-brick-500/20"/>
                  <button type="button" onClick={() => setShowPwd(v => !v)} tabIndex={-1}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-ink">
                    {showPwd ? <EyeOff size={15}/> : <Eye size={15}/>}
                  </button>
                </div>
              </div>

              {error && (
                <div className="px-3 py-2.5 rounded-lg bg-rose-50 border border-rose-200 text-sm text-rose-700">
                  {error}
                </div>
              )}

              <button type="submit" disabled={loading}
                className="w-full py-2.5 bg-brick-500 hover:bg-brick-600 disabled:opacity-60 text-white text-sm font-semibold rounded-lg flex items-center justify-center gap-2">
                {loading && <Loader2 size={15} className="animate-spin"/>}
                {loading ? 'Connexion…' : 'Se connecter'}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
