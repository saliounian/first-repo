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
