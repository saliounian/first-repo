import { fmtFcfa } from '../utils/format.js';

// ---------------- Card ----------------
export function Card({ children, className = '', as: Tag = 'div', ...rest }) {
  return (
    <Tag className={`bg-surface border border-line/70 rounded-xl ${className}`} {...rest}>
      {children}
    </Tag>
  );
}

export function CardHeader({ title, subtitle, action }) {
  return (
    <div className="flex items-center justify-between px-5 pt-4 pb-3">
      <div>
        <div className="text-sm font-semibold text-ink">{title}</div>
        {subtitle && <div className="text-xs text-muted mt-0.5">{subtitle}</div>}
      </div>
      {action}
    </div>
  );
}

// ---------------- KPI ----------------
export function KpiCard({ label, value, delta, deltaTone = 'pos', sublabel, accent = false, large = false }) {
  const toneClass =
    deltaTone === 'pos' ? 'text-brick-500'
    : deltaTone === 'neg' ? 'text-amber-600'
    : 'text-muted';
  return (
    <Card className={`${accent ? 'bg-brick-50/70 border-brick-100' : ''} px-5 py-4`}>
      <div className="text-[10px] tracking-[0.14em] text-muted uppercase">{label}</div>
      <div className={`mt-1.5 ${large ? 'text-[28px]' : 'text-[22px]'} font-semibold tabular-nums ${accent ? 'text-brick-600' : 'text-ink'} leading-tight`}>
        {value}
      </div>
      {(delta || sublabel) && (
        <div className="mt-1 flex items-center gap-2 text-xs">
          {delta && <span className={`${toneClass} font-medium`}>{delta}</span>}
          {sublabel && <span className="text-muted">{sublabel}</span>}
        </div>
      )}
    </Card>
  );
}

// ---------------- Badge ----------------
export function Badge({ children, tone = 'neutral', size = 'sm' }) {
  const tones = {
    neutral: 'bg-line/50 text-ink/70',
    success: 'bg-brick-50 text-brick-600',
    warning: 'bg-amber-50 text-amber-700',
    danger:  'bg-rose-50 text-rose-600',
    info:    'bg-blue-50 text-blue-700',
    pro:     'bg-brick-500 text-white',
    vip:     'bg-amber-100 text-amber-800',
    new:     'bg-blue-50 text-blue-700',
    soft:    'bg-bone text-ink/80'
  };
  const sizes = size === 'xs' ? 'text-[10px] px-1.5 py-0.5' : 'text-[11px] px-2 py-0.5';
  return (
    <span className={`inline-flex items-center rounded-full font-medium ${tones[tone]} ${sizes}`}>
      {children}
    </span>
  );
}

export function StatusBadge({ status }) {
  const map = {
    'préparée': { tone: 'info',    label: 'préparée' },
    'attente':  { tone: 'warning', label: 'en attente' },
    'livrée':   { tone: 'success', label: 'livrée' },
    'annulée':  { tone: 'danger',  label: 'annulée' },
    'payée':    { tone: 'success', label: 'payée' },
    'retard':   { tone: 'danger',  label: 'en retard' },
    'rupture':  { tone: 'danger',  label: 'rupture' },
    'bas':      { tone: 'warning', label: 'stock bas' },
    'ok':       { tone: 'success', label: 'ok' },
    'over':     { tone: 'info',    label: 'surplus' },
    'justify':  { tone: 'danger',  label: 'à justifier' }
  };
  const cfg = map[status] || { tone: 'neutral', label: status };
  return <Badge tone={cfg.tone}>{cfg.label}</Badge>;
}

// ---------------- Progress bar ----------------
export function Progress({ value, max = 100, tone = 'brick' }) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  const colors = {
    brick: 'bg-brick-500',
    amber: 'bg-amber-500',
    green: 'bg-brick-500'
  };
  return (
    <div className="h-1 bg-line/60 rounded-full overflow-hidden">
      <div className={`${colors[tone]} h-full rounded-full transition-all`} style={{ width: `${pct}%` }} />
    </div>
  );
}

// Mini bars (sparkline-ish) — for shop performance row
export function MiniBars({ values, color = '#0D5C2E' }) {
  const max = Math.max(...values);
  return (
    <div className="flex items-end gap-1 h-7">
      {values.map((v, i) => (
        <div
          key={i}
          className="w-1.5 rounded-sm"
          style={{ height: `${(v / max) * 100}%`, background: color, opacity: 0.45 + (v / max) * 0.55 }}
        />
      ))}
    </div>
  );
}

// ---------------- Donut ----------------
export function Donut({ data, size = 140, stroke = 18, centerLabel, centerValue }) {
  const total = data.reduce((s, d) => s + d.value, 0) || 1;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  let acc = 0;
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} stroke="#F1EFEA" strokeWidth={stroke} fill="none" />
        {data.map((d, i) => {
          const len = (d.value / total) * c;
          const dasharray = `${len} ${c - len}`;
          const dashoffset = -acc;
          acc += len;
          return (
            <circle
              key={i}
              cx={size / 2}
              cy={size / 2}
              r={r}
              stroke={d.color}
              strokeWidth={stroke}
              fill="none"
              strokeDasharray={dasharray}
              strokeDashoffset={dashoffset}
              strokeLinecap="butt"
            />
          );
        })}
      </svg>
      {(centerLabel || centerValue) && (
        <div className="absolute inset-0 grid place-items-center text-center">
          <div>
            {centerValue && <div className="text-2xl font-semibold tabular-nums text-ink">{centerValue}</div>}
            {centerLabel && <div className="text-[10px] tracking-wider text-muted uppercase mt-0.5">{centerLabel}</div>}
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------- Circular gauge ----------------
export function Gauge({ value, size = 160, stroke = 12, label = 'complété' }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const filled = (value / 100) * c;
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} stroke="#F1EFEA" strokeWidth={stroke} fill="none" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke="#0D5C2E"
          strokeWidth={stroke}
          fill="none"
          strokeDasharray={`${filled} ${c - filled}`}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">
        <div>
          <div className="text-3xl font-semibold tabular-nums text-ink">{value}%</div>
          <div className="text-[11px] text-muted mt-0.5">{label}</div>
        </div>
      </div>
    </div>
  );
}

// ---------------- Line/area chart (SVG, no deps) ----------------
export function LineChart({ data, height = 280, accent = '#0D5C2E', formatY = fmtFcfa, compact = false }) {
  const padding = compact
    ? { top: 6, right: 6, bottom: 6, left: 6 }
    : { top: 16, right: 16, bottom: 28, left: 48 };
  const w = 760, h = height;
  const innerW = w - padding.left - padding.right;
  const innerH = h - padding.top - padding.bottom;
  const max = Math.max(...data.map(d => d.value)) * 1.1;
  const min = 0;
  const x = (i) => padding.left + (i / (data.length - 1)) * innerW;
  const y = (v) => padding.top + innerH - ((v - min) / (max - min)) * innerH;

  const path = data.map((d, i) => `${i === 0 ? 'M' : 'L'} ${x(i)} ${y(d.value)}`).join(' ');
  const area = `${path} L ${x(data.length - 1)} ${padding.top + innerH} L ${x(0)} ${padding.top + innerH} Z`;
  const ticks = [0, 0.5, 1].map(t => Math.round(min + t * (max - min)));

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-auto" preserveAspectRatio="none">
      <defs>
        <linearGradient id="areaGrad" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={accent} stopOpacity="0.16" />
          <stop offset="100%" stopColor={accent} stopOpacity="0" />
        </linearGradient>
      </defs>

      {!compact && ticks.map((t, i) => (
        <g key={i}>
          <line x1={padding.left} x2={padding.left + innerW} y1={y(t)} y2={y(t)} stroke="#F1EFEA" strokeDasharray="2 4" />
          <text x={padding.left - 10} y={y(t) + 3} textAnchor="end" fontSize="10" fill="#9C9C9C">
            {formatY(t)}
          </text>
        </g>
      ))}

      <path d={area} fill="url(#areaGrad)" />
      <path d={path} fill="none" stroke={accent} strokeWidth={compact ? 2 : 1.8} strokeLinecap="round" strokeLinejoin="round" />

      <circle cx={x(data.length - 1)} cy={y(data[data.length - 1].value)} r={compact ? 3 : 4} fill={accent} />
      {!compact && <circle cx={x(data.length - 1)} cy={y(data[data.length - 1].value)} r="8" fill={accent} fillOpacity="0.18" />}

      {!compact && data.map((d, i) => (i % 5 === 0 || i === data.length - 1) && (
        <text key={i} x={x(i)} y={h - 8} textAnchor="middle" fontSize="10" fill="#9C9C9C">
          J{d.day}
        </text>
      ))}
    </svg>
  );
}

// ---------------- Horizontal bars (top list) ----------------
export function HBarRow({ label, pct, color = '#0D5C2E', max = 100, value }) {
  return (
    <div className="flex items-center gap-3 py-1.5">
      <div className="w-32 text-sm text-ink/85 truncate">{label}</div>
      <div className="flex-1 h-1.5 bg-line/60 rounded-full overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${(pct / max) * 100}%`, background: color }} />
      </div>
      <div className="w-12 text-right text-xs tabular-nums text-muted">{value ?? `${pct}%`}</div>
    </div>
  );
}

// ---------------- Tabs ----------------
export function Tabs({ tabs, value, onChange }) {
  return (
    <div className="flex gap-1 bg-sand/80 p-1 rounded-lg w-fit overflow-x-auto no-scrollbar">
      {tabs.map((t) => (
        <button
          key={t.id}
          onClick={() => onChange(t.id)}
          className={`px-3 py-1.5 text-sm rounded-md transition-colors whitespace-nowrap ${
            value === t.id ? 'bg-surface text-ink shadow-sm font-medium' : 'text-muted hover:text-ink'
          }`}
        >
          {t.label} {t.count != null && <span className="text-muted ml-1 tabular-nums">{t.count}</span>}
        </button>
      ))}
    </div>
  );
}
