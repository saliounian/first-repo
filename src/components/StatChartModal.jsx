import { useState, useMemo } from 'react';
import { X } from 'lucide-react';
import Modal from './Modal.jsx';
import { BarChart } from './ui.jsx';
import { fmtFcfa } from '../utils/format.js';

// ─── Config métrique ──────────────────────────────────────────────────────────
const METRICS = {
  ca:      { title: "Chiffre d'affaires", accent: '#0D5C2E', unit: 'fcfa' },
  orders:  { title: 'Commandes',          accent: '#2E86AB', unit: 'int'  },
  panier:  { title: 'Panier moyen',       accent: '#A23B72', unit: 'fcfa' },
  clients: { title: 'Nouveaux clients',   accent: '#F18F01', unit: 'int'  },
};

const PERIODS = [
  { id: 'today',  label: "Aujourd'hui" },
  { id: 'week',   label: 'Cette semaine' },
  { id: 'month',  label: 'Ce mois-ci' },
  { id: 'year',   label: 'Cette année' },
  { id: 'custom', label: 'Personnalisé' },
];

// ─── Helpers date ─────────────────────────────────────────────────────────────
const startOfDay = (d) => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; };
const addDays    = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
const parseInput = (s) => (s ? startOfDay(new Date(s + 'T00:00:00')) : null);

// Retourne { start, end, gran } pour la période choisie
function getRange(period, customStart, customEnd) {
  const now = new Date();
  if (period === 'today') {
    const s = startOfDay(now); return { start: s, end: addDays(s, 1), gran: 'hour' };
  }
  if (period === 'week') {
    const dow = (now.getDay() + 6) % 7;            // lundi = 0
    const s = startOfDay(addDays(now, -dow));
    return { start: s, end: addDays(s, 7), gran: 'day' };
  }
  if (period === 'month') {
    const s = new Date(now.getFullYear(), now.getMonth(), 1);
    const e = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    return { start: s, end: e, gran: 'day' };
  }
  if (period === 'year') {
    const s = new Date(now.getFullYear(), 0, 1);
    const e = new Date(now.getFullYear() + 1, 0, 1);
    return { start: s, end: e, gran: 'month' };
  }
  // custom
  const cs = parseInput(customStart) || startOfDay(now);
  const ce = parseInput(customEnd)   || startOfDay(now);
  const s  = cs <= ce ? cs : ce;
  const e  = addDays(cs <= ce ? ce : cs, 1);
  const spanDays = Math.round((e - s) / 86_400_000);
  return { start: s, end: e, gran: spanDays <= 31 ? 'day' : 'month' };
}

// Construit la liste des buckets [{ start, end, label, short }]
function buildBuckets({ start, end, gran }) {
  const buckets = [];
  if (gran === 'hour') {
    for (let h = 0; h < 24; h++) {
      const s = new Date(start); s.setHours(h);
      const e = new Date(start); e.setHours(h + 1);
      buckets.push({ start: s, end: e, label: `${h}h`, short: `${h}h` });
    }
  } else if (gran === 'day') {
    let cur = new Date(start);
    while (cur < end) {
      const e = addDays(cur, 1);
      buckets.push({
        start: new Date(cur), end: e,
        label: cur.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' }),
        short: String(cur.getDate()),
      });
      cur = e;
    }
  } else { // month
    let cur = new Date(start.getFullYear(), start.getMonth(), 1);
    while (cur < end) {
      const e = new Date(cur.getFullYear(), cur.getMonth() + 1, 1);
      buckets.push({
        start: new Date(cur), end: e,
        label: cur.toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' }),
        short: cur.toLocaleDateString('fr-FR', { month: 'short' }),
      });
      cur = e;
    }
  }
  return buckets;
}

const orderNet = (o) => o.net ?? o.total ?? 0;

export default function StatChartModal({
  metric,
  initialPeriod = 'month',
  orders = [],
  clients = [],
  shops = [],
  shopFilter = 'all',
  onClose,
}) {
  const cfg = METRICS[metric] || METRICS.ca;
  const [period, setPeriod] = useState(initialPeriod);
  const today = startOfDay(new Date()).toISOString().slice(0, 10);
  const [customStart, setCustomStart] = useState(today);
  const [customEnd, setCustomEnd]     = useState(today);

  const shopName = shopFilter === 'all'
    ? 'Toutes boutiques'
    : (shops.find(s => s.id === shopFilter)?.name || 'Boutique');

  const fmtVal = cfg.unit === 'fcfa' ? fmtFcfa : (v) => String(v);

  // Commandes de la boutique sélectionnée
  const shopOrders = useMemo(
    () => shopFilter === 'all' ? orders : orders.filter(o => o.shopId === shopFilter),
    [orders, shopFilter]
  );

  // Clients dans le périmètre (filtré via commandes de la boutique)
  const scopedClients = useMemo(() => {
    if (shopFilter === 'all') return clients;
    const ids = new Set(shopOrders.map(o => o.clientId).filter(Boolean));
    return clients.filter(c => ids.has(c.id));
  }, [clients, shopOrders, shopFilter]);

  const { data, total } = useMemo(() => {
    const range   = getRange(period, customStart, customEnd);
    const buckets = buildBuckets(range);
    const s = range.start.getTime(), e = range.end.getTime();
    const inRange = (ts) => { const t = new Date(ts).getTime(); return t >= s && t < e; };
    const bIndex  = (ts) => {
      const t = new Date(ts).getTime();
      return buckets.findIndex(b => t >= b.start.getTime() && t < b.end.getTime());
    };

    const rows = buckets.map(b => ({ label: b.label, short: b.short, value: 0, _num: 0, _den: 0 }));

    if (metric === 'clients') {
      for (const c of scopedClients) {
        if (!c.createdAt || !inRange(c.createdAt)) continue;
        const i = bIndex(c.createdAt); if (i >= 0) rows[i].value += 1;
      }
    } else {
      for (const o of shopOrders) {
        if (!o.createdAt || !inRange(o.createdAt)) continue;
        const i = bIndex(o.createdAt); if (i < 0) continue;
        if (metric === 'ca') {
          rows[i].value += orderNet(o);
        } else if (metric === 'orders') {
          rows[i].value += 1;
        } else if (metric === 'panier') {
          if (o.status === 'livrée') { rows[i]._num += orderNet(o); rows[i]._den += 1; }
        }
      }
      if (metric === 'panier') {
        for (const r of rows) r.value = r._den > 0 ? Math.round(r._num / r._den) : 0;
      }
    }

    // Total période (résumé header)
    let tot = 0;
    if (metric === 'ca')       tot = rows.reduce((a, r) => a + r.value, 0);
    else if (metric === 'orders')  tot = rows.reduce((a, r) => a + r.value, 0);
    else if (metric === 'clients') tot = rows.reduce((a, r) => a + r.value, 0);
    else if (metric === 'panier') {
      const num = rows.reduce((a, r) => a + r._num, 0);
      const den = rows.reduce((a, r) => a + r._den, 0);
      tot = den > 0 ? Math.round(num / den) : 0;
    }
    return { data: rows, total: tot };
  }, [metric, period, customStart, customEnd, shopOrders, scopedClients]);

  const totalLabel = cfg.unit === 'fcfa' ? fmtFcfa(total) : String(total);
  const totalCaption =
    metric === 'ca'      ? 'CA cumulé'
    : metric === 'orders'  ? 'commandes'
    : metric === 'panier'  ? 'panier moyen (livrées)'
    : 'nouveaux clients';

  return (
    <Modal onClose={onClose} closeOnBackdrop>
      <div className="bg-surface rounded-2xl shadow-xl w-full max-w-2xl">
        {/* Header */}
        <div className="flex items-start justify-between px-5 pt-5 pb-4 border-b border-line/70">
          <div>
            <div className="text-[10px] uppercase tracking-widest text-muted">{shopName}</div>
            <div className="font-semibold text-ink text-lg">{cfg.title}</div>
            <div className="text-sm text-muted mt-0.5">
              <span className="font-semibold text-ink tabular-nums">{totalLabel}</span> · {totalCaption}
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 grid place-items-center rounded-lg hover:bg-sand text-muted"><X size={15} /></button>
        </div>

        {/* Sélecteur période */}
        <div className="px-5 pt-4">
          <div className="flex gap-1.5 flex-wrap">
            {PERIODS.map(p => (
              <button key={p.id} onClick={() => setPeriod(p.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors ${
                  period === p.id ? 'bg-ink text-surface' : 'bg-surface border border-line/70 text-muted hover:bg-sand'
                }`}>
                {p.label}
              </button>
            ))}
          </div>
          {period === 'custom' && (
            <div className="flex items-center gap-2 mt-3 flex-wrap">
              <label className="text-xs text-muted">Du</label>
              <input type="date" value={customStart} max={customEnd} onChange={e => setCustomStart(e.target.value)} className="field-input py-1.5 text-sm w-auto" />
              <label className="text-xs text-muted">au</label>
              <input type="date" value={customEnd} min={customStart} onChange={e => setCustomEnd(e.target.value)} className="field-input py-1.5 text-sm w-auto" />
            </div>
          )}
        </div>

        {/* Graphe */}
        <div className="px-5 py-5">
          <BarChart data={data} accent={cfg.accent} formatValue={fmtVal} />
        </div>

        {/* Notes honnêteté données */}
        <div className="px-5 pb-5 -mt-2 space-y-1">
          {metric === 'panier' && (
            <p className="text-[11px] text-muted">Panier moyen = moyenne des commandes <strong>livrées</strong> sur chaque intervalle.</p>
          )}
          {metric === 'clients' && shopFilter !== 'all' && (
            <p className="text-[11px] text-muted">Nouveaux clients ayant passé au moins une commande chez « {shopName} », par date de création.</p>
          )}
          {metric === 'clients' && shopFilter === 'all' && (
            <p className="text-[11px] text-muted">Nouveaux clients par date de création (tous les clients enregistrés).</p>
          )}
        </div>
      </div>
    </Modal>
  );
}
