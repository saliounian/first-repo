// CSV + printable HTML helpers — no external deps

export function downloadCSV(filename, headers, rows) {
  const escape = (v) => {
    const s = v == null ? '' : String(v);
    return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const csv = [
    headers.join(';'),
    ...rows.map(r => r.map(escape).join(';'))
  ].join('\n');
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); a.remove();
  URL.revokeObjectURL(url);
}

export function downloadJSON(filename, data) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); a.remove();
  URL.revokeObjectURL(url);
}

const PRINT_STYLES = `
  *{box-sizing:border-box}
  body{font-family:Inter,system-ui,-apple-system,'Segoe UI',sans-serif;color:#1f2421;padding:40px;max-width:720px;margin:0 auto;line-height:1.45;font-size:14px;}
  h1{font-size:24px;margin:0 0 6px;letter-spacing:-0.01em;font-weight:600}
  h2{font-size:13px;margin:24px 0 8px;text-transform:uppercase;letter-spacing:0.1em;color:#7a7e7b;font-weight:500}
  .muted{color:#7a7e7b}
  .header{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:2px solid #0d5c2e;padding-bottom:16px;margin-bottom:24px}
  .brand{font-weight:600;font-size:18px;color:#0d5c2e}
  .meta{text-align:right;font-size:12px}
  table{width:100%;border-collapse:collapse;margin-top:8px}
  td,th{padding:10px 12px;border-bottom:1px solid #ecead4;text-align:left;vertical-align:top}
  th{font-size:11px;text-transform:uppercase;letter-spacing:0.1em;color:#7a7e7b;font-weight:500;background:#f7f6f1}
  .total-row{font-size:18px;font-weight:600;color:#0d5c2e;text-align:right;padding:16px 0;border-top:2px solid #0d5c2e;margin-top:16px}
  .badge{display:inline-block;padding:3px 10px;border-radius:999px;font-size:11px;font-weight:500;background:#dceaca;color:#0d5c2e}
  .badge.warn{background:#fef3c7;color:#92400e}
  .badge.danger{background:#fee2e2;color:#b91c1c}
  .right{text-align:right}
  @media print { body{padding:20px} .no-print{display:none} }
`;

export function printHTML({ title = 'Salih Holding', body }) {
  const w = window.open('', '_blank', 'width=820,height=1000');
  if (!w) return;
  w.document.write(`<!doctype html><html lang="fr"><head><meta charset="utf-8"><title>${title}</title><style>${PRINT_STYLES}</style></head><body>${body}<div class="no-print" style="margin-top:32px;text-align:right"><button onclick="window.print()" style="padding:8px 16px;background:#0d5c2e;color:#fff;border:0;border-radius:8px;cursor:pointer;font-size:14px">Imprimer</button></div></body></html>`);
  w.document.close();
  w.focus();
}

export function fmtDate(d = new Date()) {
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });
}
