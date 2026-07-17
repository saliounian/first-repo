// FCFA formatting

export const fmtFcfa = (n) => {
  if (n == null) return '—';
  if (Math.abs(n) >= 1_000_000) return (n / 1_000_000).toFixed(2).replace(/\.0+$/, '').replace('.', ',') + ' M';
  if (Math.abs(n) >= 1_000)     return Math.round(n / 1_000) + ' K';
  return n.toString();
};

export const fmtFcfaFull = (n) => {
  if (n == null) return '—';
  return n.toLocaleString('fr-FR').replace(/ /g, ' ').replace(/,/g, ' ');
};

export const fmtPct = (n) => `${n}%`;

// ─── Date / heure ─────────────────────────────────────────────────────────────
// Fonction PARTAGÉE web + mobile. Prend un timestamp (created_at ISO, Date, ou
// nombre) et rend « 17 juil. 2026, 11:33 ». Toujours trier par created_at.
export const fmtDateTime = (value) => {
  if (!value) return '—';
  const d = value instanceof Date ? value : new Date(value);
  if (isNaN(d.getTime())) return '—';
  const date = d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
  const time = d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  return `${date}, ${time}`;
};

// Variante date seule « 17 juil. 2026 » (exports, en-têtes).
export const fmtDate = (value) => {
  if (!value) return '—';
  const d = value instanceof Date ? value : new Date(value);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
};
