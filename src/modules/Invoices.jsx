import { useState } from 'react';
import { Plus, Eye, Download, Trash2, X, CheckCircle, Edit2, FileText, ArrowRight, Share2, MessageCircle, Mail, Link2, Check } from 'lucide-react';
import PageHeader from '../components/PageHeader.jsx';
import MobileTopBar from '../components/MobileTopBar.jsx';
import ActionMenu from '../components/ActionMenu.jsx';
import { Card, Badge, Tabs } from '../components/ui.jsx';
import { useStore } from '../context/StoreContext.jsx';
import { INVOICE_STATUSES, ORDER_STATUSES, uid } from '../data/store.js';
import { fmtFcfa } from '../utils/format.js';
import { toast } from '../utils/toast.jsx';

function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));
}

function calcNet(f) {
  const base = f.total || 0;
  const apply = (fr) => fr ? (fr.sens === '+' ? 1 : -1) * (Number(fr.montant) || 0) : 0;
  return base + apply(f.fraisLivraison) + apply(f.fraisInstallation) + apply(f.fraisService);
}

// ─── Build invoice HTML (Niansbusines format) ────────────────────────────────
function buildInvoiceHTML(inv, shop) {
  const fmt = n => `${Number(n || 0).toLocaleString('fr-FR')}F`;

  const itemsRows = (inv.lineItems?.length ? inv.lineItems : []).map(l => `
    <tr>
      <td class="desc">${esc(l.name)}</td>
      <td class="right">${fmt(l.unitPrice)}</td>
      <td class="center">${String(l.qty).padStart(2, '0')}</td>
      <td class="right">${fmt(l.unitPrice * l.qty)}</td>
    </tr>`).join('');

  const fraisRows = [
    ['Frais de livraison',    inv.fraisLivraison],
    ["Frais d'installation",  inv.fraisInstallation],
    ['Frais de service',      inv.fraisService],
  ].filter(([, fr]) => fr?.montant).map(([label, fr]) => `
    <tr>
      <td class="desc">${label}</td>
      <td class="right">${fr.sens === '-' ? '−' : ''}${fmt(fr.montant)}</td>
      <td class="center">01</td>
      <td class="right">${fr.sens === '-' ? '−' : ''}${fmt(fr.montant)}</td>
    </tr>`).join('');

  const reductionRow = inv.lineItems?.length === 0 && inv.description
    ? `<tr><td class="desc">${esc(inv.description)}</td><td class="right">${fmt(inv.total)}</td><td class="center">01</td><td class="right">${fmt(inv.total)}</td></tr>`
    : '';

  const notesLines = inv.note
    ? inv.note.split('\n').map(l => `<div class="info-line">${esc(l)}</div>`).join('')
    : '';

  return `
    <div class="page">
      <!-- Top wave -->
      <svg class="wave-top" viewBox="0 0 800 120" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M0,0 L800,0 L800,80 Q600,120 400,90 Q200,60 0,100 Z" fill="#0d7e4f"/>
      </svg>

      <main>
        <header class="head">
          <div>
            <h1 class="title">Facture</h1>
            <div class="invnum">N° : ${esc(inv.id?.replace('#', '') || '—')}</div>
          </div>
          <div class="date">DATE : ${esc(inv.date || new Date().toLocaleDateString('fr-FR'))}</div>
        </header>

        <section class="parties">
          <div class="party">
            <div class="party-label">ÉMETTEUR :</div>
            <div class="party-name">${esc(shop?.name || 'Boutique')}</div>
            ${shop?.phone ? `<div class="party-info">${esc(shop.phone)}</div>` : ''}
          </div>
          <div class="party right-align">
            <div class="party-label">DESTINATAIRE :</div>
            <div class="party-name">${esc(inv.client)}</div>
            ${inv.phone ? `<div class="party-info">${esc(inv.phone)}</div>` : ''}
            ${inv.adresseLivraison ? `<div class="party-info">${esc(inv.adresseLivraison)}</div>` : ''}
          </div>
        </section>

        <table class="items">
          <thead>
            <tr>
              <th>Description :</th>
              <th class="right">Prix Unitaire :</th>
              <th class="center">Quantité :</th>
              <th class="right">Total :</th>
            </tr>
          </thead>
          <tbody>
            ${itemsRows}
            ${reductionRow}
            ${fraisRows}
          </tbody>
        </table>

        <section class="footer-section">
          ${notesLines ? `
            <div class="info">
              <div class="info-label">Informations supplémentaire</div>
              ${notesLines}
            </div>` : '<div></div>'}
          <div class="net">
            <div class="net-label">Net à payer :</div>
            <div class="net-value">${fmt(inv.net ?? inv.total ?? 0)}</div>
          </div>
        </section>
      </main>

      <!-- Bottom wave -->
      <svg class="wave-bot" viewBox="0 0 800 120" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M0,40 Q200,0 400,30 Q600,60 800,40 L800,120 L0,120 Z" fill="#0d7e4f"/>
      </svg>
    </div>
  `;
}

const INVOICE_CSS = `
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:Inter,system-ui,'Segoe UI',sans-serif;color:#1f2421;background:#fff;font-size:13px;line-height:1.5}
  .page{position:relative;width:794px;min-height:1123px;margin:0 auto;background:#fff;overflow:hidden}
  .wave-top,.wave-bot{position:absolute;left:0;right:0;width:100%;height:120px;display:block}
  .wave-top{top:0}
  .wave-bot{bottom:0}
  main{position:relative;padding:160px 80px 160px}
  .head{display:flex;justify-content:space-between;align-items:flex-end;margin-bottom:60px}
  .title{font-size:42px;font-weight:700;color:#1f2421;letter-spacing:-0.02em}
  .invnum{font-size:18px;font-weight:600;margin-top:6px;color:#1f2421}
  .date{font-size:14px;color:#1f2421}
  .parties{display:flex;justify-content:space-between;margin-bottom:60px;gap:40px}
  .party{flex:1}
  .party.right-align{text-align:right}
  .party-label{font-size:11px;font-weight:700;letter-spacing:0.05em;color:#1f2421;margin-bottom:10px}
  .party-name{font-size:15px;font-weight:600;color:#0d7e4f;margin-bottom:6px}
  .party-info{font-size:13px;color:#1f2421;margin-bottom:2px;line-height:1.4}
  .items{width:100%;border-collapse:collapse;margin-bottom:60px}
  .items thead th{font-size:12px;font-weight:600;color:#1f2421;padding:14px 8px;border-bottom:1px solid #d4d4d4;text-align:left}
  .items tbody td{font-size:13px;padding:18px 8px;border-bottom:1px solid #ecebe6;vertical-align:middle}
  .items td.desc{color:#1f2421}
  .items th.right,.items td.right{text-align:right}
  .items th.center,.items td.center{text-align:center}
  .footer-section{display:flex;justify-content:space-between;align-items:flex-start;gap:40px;margin-top:30px}
  .info{flex:1}
  .info-label{font-size:12px;font-weight:700;color:#1f2421;margin-bottom:10px}
  .info-line{font-size:12px;color:#5a5e5b;line-height:1.6}
  .net{text-align:right;flex-shrink:0}
  .net-label{font-size:18px;font-weight:700;color:#1f2421;display:inline-block;margin-right:8px;vertical-align:middle}
  .net-value{font-size:28px;font-weight:700;color:#1f2421;display:inline-block;vertical-align:middle}
  @media print{body{margin:0}.page{margin:0;box-shadow:none}}
  @page{size:A4;margin:0}
`;

// Construit le HTML doc complet (utilisable iframe srcDoc + popup)
function buildInvoiceDoc(inv, shop) {
  return `<!doctype html><html lang="fr"><head><meta charset="utf-8"><title>Facture ${esc(inv.id)}</title><style>${INVOICE_CSS}</style></head><body>${buildInvoiceHTML(inv, shop)}</body></html>`;
}

// ─── Invoice Preview Modal (iframe inline + PDF download) ────────────────────
function InvoicePreviewModal({ inv, shop, onShare, onClose }) {
  const doc = buildInvoiceDoc(inv, shop);
  const [busy, setBusy] = useState(false);

  function printIt() {
    const iframe = document.getElementById('invoice-preview-iframe');
    if (!iframe?.contentWindow) { toast.error('Erreur impression'); return; }
    iframe.contentWindow.focus();
    iframe.contentWindow.print();
  }

  async function downloadPDF() {
    const iframe = document.getElementById('invoice-preview-iframe');
    if (!iframe) return;
    setBusy(true);
    try {
      const { iframeToPDFBlob, downloadPDFBlob } = await import('../utils/invoicePDF.js');
      const blob = await iframeToPDFBlob(iframe);
      await downloadPDFBlob(blob, `Facture-${(inv.id || '').replace('#', '')}.pdf`);
      toast.success('PDF téléchargé');
    } catch (e) {
      console.error(e);
      toast.error('Erreur génération PDF');
    } finally { setBusy(false); }
  }

  async function sharePDF() {
    const iframe = document.getElementById('invoice-preview-iframe');
    if (!iframe) return;
    setBusy(true);
    try {
      const { iframeToPDFBlob, sharePDFFile, downloadPDFBlob } = await import('../utils/invoicePDF.js');
      const blob = await iframeToPDFBlob(iframe);
      const filename = `Facture-${(inv.id || '').replace('#', '')}.pdf`;
      const text     = `Facture ${inv.id} — ${shop?.name || ''} — Net à payer : ${fmtFcfa(inv.net ?? inv.total ?? 0)}`;
      const ok = await sharePDFFile(blob, filename, `Facture ${inv.id}`, text);
      if (!ok) {
        // Fallback : download + open share modal text
        await downloadPDFBlob(blob, filename);
        toast.success('PDF téléchargé — joignez-le au message');
        onShare(inv);
      }
    } catch (e) {
      console.error(e);
      toast.error('Erreur partage PDF');
    } finally { setBusy(false); }
  }

  return (
    <div className="fixed inset-0 bg-black/60 z-[55] overflow-y-auto py-4 px-2 lg:px-4 flex items-start lg:items-center justify-center" onClick={onClose}>
      <div onClick={e => e.stopPropagation()} className="bg-surface rounded-2xl shadow-xl w-full max-w-3xl my-auto flex flex-col" style={{ maxHeight: '95vh' }}>
        <div className="flex items-center justify-between px-5 py-3 border-b border-line/70 gap-2 flex-wrap">
          <div className="min-w-0">
            <div className="font-semibold text-ink truncate">Aperçu facture {inv.id}</div>
            <div className="text-xs text-muted truncate">{inv.client} · {fmtFcfa(inv.net ?? inv.total ?? 0)}</div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button disabled={busy} onClick={downloadPDF}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm border border-line/70 rounded-lg hover:bg-bone disabled:opacity-50">
              <Download size={13}/> {busy ? 'PDF…' : 'PDF'}
            </button>
            <button onClick={printIt} className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-sm border border-line/70 rounded-lg hover:bg-bone">
              <FileText size={13}/> Imprimer
            </button>
            <button disabled={busy} onClick={sharePDF}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-brick-500 hover:bg-brick-600 disabled:opacity-50 text-white rounded-lg">
              <Share2 size={13}/> Partager
            </button>
            <button onClick={onClose} className="w-8 h-8 grid place-items-center rounded-lg hover:bg-sand text-muted"><X size={15}/></button>
          </div>
        </div>
        <div className="flex-1 overflow-auto bg-bone p-2 lg:p-4 grid place-items-start">
          <iframe id="invoice-preview-iframe" srcDoc={doc} title="Facture"
            className="bg-white shadow-lg" style={{ width: '794px', maxWidth: '100%', height: '1123px', border: '0' }}/>
        </div>
      </div>
    </div>
  );
}

// ─── Share invoice (Web Share API + fallback channels) ───────────────────────
function buildShareText(inv, shop) {
  const fmt = n => `${Number(n || 0).toLocaleString('fr-FR')}F`;
  const lines = [
    `*Facture ${inv.id}*`,
    shop?.name ? `Émetteur : ${shop.name}` : null,
    shop?.phone ? `Tél : ${shop.phone}` : null,
    '',
    `Destinataire : ${inv.client}`,
    inv.phone ? `Tél : ${inv.phone}` : null,
    inv.adresseLivraison ? `Adresse : ${inv.adresseLivraison}` : null,
    '',
    'Articles :',
    ...(inv.lineItems || []).map(l => `• ${l.name} ×${l.qty} = ${fmt(l.unitPrice * l.qty)}`),
    inv.description ? `• ${inv.description} = ${fmt(inv.total)}` : null,
    inv.fraisLivraison?.montant    ? `• Livraison : ${inv.fraisLivraison.sens}${fmt(inv.fraisLivraison.montant)}` : null,
    inv.fraisInstallation?.montant ? `• Installation : ${inv.fraisInstallation.sens}${fmt(inv.fraisInstallation.montant)}` : null,
    inv.fraisService?.montant      ? `• Service : ${inv.fraisService.sens}${fmt(inv.fraisService.montant)}` : null,
    '',
    `*Net à payer : ${fmt(inv.net ?? inv.total ?? 0)}*`,
    inv.note ? `\nNote : ${inv.note}` : null,
  ].filter(l => l !== null);
  return lines.join('\n');
}

async function shareInvoiceNative(inv, shop) {
  const text = buildShareText(inv, shop);
  const title = `Facture ${inv.id}`;
  if (navigator.share) {
    try {
      await navigator.share({ title, text });
      return true;
    } catch (e) {
      if (e.name !== 'AbortError') toast.error('Partage annulé');
      return false;
    }
  }
  return false;
}

// ─── Share modal (fallback channels) ─────────────────────────────────────────
function ShareModal({ inv, shop, onClose }) {
  const text  = buildShareText(inv, shop);
  const title = `Facture ${inv.id}`;
  const [copied, setCopied] = useState(false);

  function copy() {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true); toast.success('Texte copié');
      setTimeout(() => setCopied(false), 2000);
    });
  }

  const enc = encodeURIComponent(text);
  const channels = [
    { label: 'WhatsApp', icon: MessageCircle, color: '#25D366', href: `https://wa.me/?text=${enc}` },
    { label: 'Email',    icon: Mail,          color: '#3B82F6', href: `mailto:?subject=${encodeURIComponent(title)}&body=${enc}` },
    { label: 'SMS',      icon: MessageCircle, color: '#F59E0B', href: `sms:?body=${enc}` },
  ];

  return (
    <div className="fixed inset-0 bg-black/40 z-50 overflow-y-auto py-4 px-4 flex items-start lg:items-center justify-center" onClick={onClose}>
      <div onClick={e => e.stopPropagation()} className="bg-surface rounded-2xl shadow-xl w-full max-w-md my-auto">
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-line/70">
          <div>
            <div className="font-semibold text-ink">Partager la facture</div>
            <div className="text-xs text-muted">{inv.id} · {fmtFcfa(inv.net ?? inv.total ?? 0)}</div>
          </div>
          <button onClick={onClose} className="w-8 h-8 grid place-items-center rounded-lg hover:bg-sand text-muted"><X size={15}/></button>
        </div>
        <div className="px-5 py-4 space-y-3">
          <div className="grid grid-cols-3 gap-2">
            {channels.map(({ label, icon: Icon, color, href }) => (
              <a key={label} href={href} target="_blank" rel="noopener noreferrer" onClick={onClose}
                className="flex flex-col items-center gap-2 py-4 rounded-xl border border-line/70 hover:border-brick-300 transition-colors">
                <div className="w-11 h-11 rounded-full grid place-items-center" style={{ background: color + '20' }}>
                  <Icon size={20} style={{ color }}/>
                </div>
                <span className="text-xs font-medium text-ink">{label}</span>
              </a>
            ))}
          </div>
          <button onClick={copy}
            className="w-full flex items-center justify-center gap-2 py-3 border border-line/70 rounded-xl text-sm font-medium hover:bg-bone">
            {copied ? <><Check size={14}/> Copié</> : <><Link2 size={14}/> Copier le texte</>}
          </button>
          {typeof navigator !== 'undefined' && navigator.share && (
            <button onClick={async () => {
              try { await navigator.share({ title, text }); onClose(); } catch {}
            }} className="w-full flex items-center justify-center gap-2 py-3 bg-brick-500 hover:bg-brick-600 text-white rounded-xl text-sm font-medium">
              <Share2 size={14}/> Plus d'options (système)
            </button>
          )}
          <div className="text-[11px] text-muted text-center pt-1">
            WhatsApp, email, SMS ou copier le texte
          </div>
        </div>
      </div>
    </div>
  );
}

function FraisRow({ label, value, sens, onChange }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-muted w-28 shrink-0">{label}</span>
      <div className="flex rounded-lg overflow-hidden border border-line/70">
        {['+', '-'].map(s => (
          <button key={s} type="button" onClick={() => onChange('sens', s)}
            className={`w-7 h-7 text-sm font-bold transition-colors ${sens === s ? 'bg-brick-500 text-white' : 'bg-surface text-muted hover:bg-bone'}`}>{s}</button>
        ))}
      </div>
      <input type="number" min="0" value={value} onChange={e => onChange('montant', +e.target.value)}
        placeholder="0" className="field-input flex-1 py-1.5 text-sm"/>
    </div>
  );
}

// ─── Sélecteur commande ───────────────────────────────────────────────────────
function OrderPickerModal({ orders, onPick, onClose }) {
  const [search, setSearch] = useState('');
  const filtered = orders.filter(o =>
    !search || o.client?.toLowerCase().includes(search.toLowerCase()) || o.id?.includes(search)
  );
  return (
    <div className="fixed inset-0 bg-black/60 z-[60] overflow-y-auto py-4 px-4 flex items-start lg:items-center justify-center" onClick={onClose}>
      <div onClick={e => e.stopPropagation()} className="bg-surface rounded-2xl shadow-xl w-full max-w-md my-auto max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-line/70">
          <div className="font-semibold text-ink">Choisir une commande</div>
          <button onClick={onClose} className="w-8 h-8 grid place-items-center rounded-lg hover:bg-sand text-muted"><X size={15}/></button>
        </div>
        <div className="px-4 py-3">
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Client, N° commande…"
            className="field-input w-full"/>
        </div>
        <ul className="flex-1 overflow-y-auto divide-y divide-line/40 px-2 pb-3">
          {filtered.length === 0 && <li className="py-8 text-center text-muted text-sm">Aucune commande.</li>}
          {filtered.map(o => (
            <li key={o.id}>
              <button onClick={() => { onPick(o); onClose(); }}
                className="w-full flex items-center justify-between px-3 py-3 hover:bg-bone/60 rounded-xl text-left">
                <div>
                  <div className="font-medium text-sm text-ink">{o.client}</div>
                  <div className="text-xs text-muted">{o.id} · {o.shop} · {o.date}</div>
                  {o.items && <div className="text-xs text-muted truncate max-w-[260px]">{o.items}</div>}
                </div>
                <div className="text-right shrink-0 ml-3">
                  <div className="font-semibold tabular-nums text-sm">{fmtFcfa(o.net ?? o.total ?? 0)}</div>
                  <div className="text-[10px] text-muted">{o.status}</div>
                </div>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

// ─── Formulaire facture (= composantes commande + description) ────────────────
function InvoiceModal({ invoice, clients, shops, products, stockPoints, stockByPoint, orders, onClose, onSave }) {
  const isEdit = !!invoice;
  const blank = { montant: '', sens: '+' };

  const [f, setF] = useState({
    client:           invoice?.client           || '',
    clientId:         invoice?.clientId         || '',
    phone:            invoice?.phone            || '',
    shop:             invoice?.shop             || '',
    shopId:           invoice?.shopId           || '',
    lineItems:        invoice?.lineItems        || [],
    description:      invoice?.description      || '',
    total:            invoice?.total            || 0,
    status:           invoice?.status           || 'attente',
    note:             invoice?.note             || '',
    adresseLivraison: invoice?.adresseLivraison || '',
    fraisLivraison:   invoice?.fraisLivraison   || { ...blank },
    fraisInstallation:invoice?.fraisInstallation|| { ...blank },
    fraisService:     invoice?.fraisService     || { ...blank },
    fromOrderId:      invoice?.fromOrderId      || null,
  });
  const [newProd, setNewProd]     = useState({ productId: '', qty: 1 });
  const [pickOrder, setPickOrder] = useState(false);
  const [done, setDone]           = useState(false);
  const set = (k, v) => setF(p => ({ ...p, [k]: v }));
  const setFrais = (key, field, val) => setF(p => ({ ...p, [key]: { ...p[key], [field]: val } }));
  const net = calcNet(f);

  function loadFromOrder(o) {
    setF(p => ({
      ...p,
      client:    o.client || '', clientId: o.clientId || '',
      phone:     o.phone  || '', shop: o.shop || '', shopId: o.shopId || '',
      lineItems: o.lineItems || [],
      total:     o.total  || 0,
      note:      o.note   || '',
      adresseLivraison: o.adresseLivraison || '',
      fraisLivraison:   o.fraisLivraison   || { ...blank },
      fraisInstallation:o.fraisInstallation|| { ...blank },
      fraisService:     o.fraisService     || { ...blank },
      fromOrderId: o.id,
    }));
  }

  if (done) return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
      <div className="bg-surface rounded-2xl p-8 text-center shadow-xl">
        <CheckCircle size={44} className="text-brick-500 mx-auto mb-2"/>
        <div className="font-semibold text-ink">{isEdit ? 'Facture modifiée' : 'Facture créée'}</div>
      </div>
    </div>
  );

  const shopProducts = f.shopId
    ? products.filter(p => stockPoints.filter(sp => sp.shopId === f.shopId).some(sp => (stockByPoint[p.id] || {})[sp.id] > 0))
    : products;

  return (
    <>
      {pickOrder && <OrderPickerModal orders={orders} onPick={loadFromOrder} onClose={() => setPickOrder(false)}/>}
      <div className="fixed inset-0 bg-black/40 z-50 overflow-y-auto py-4 px-4 flex items-start lg:items-center justify-center">
        <div className="bg-surface rounded-2xl shadow-xl w-full max-w-lg my-auto">
          <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-line/70 sticky top-0 bg-surface z-10">
            <div className="font-semibold text-ink">{isEdit ? 'Modifier la facture' : 'Nouvelle facture'}</div>
            <button onClick={onClose} className="w-8 h-8 grid place-items-center rounded-lg hover:bg-sand text-muted"><X size={15}/></button>
          </div>

          <div className="px-5 py-4 space-y-3">
            {/* Import depuis commande */}
            {!isEdit && (
              <button type="button" onClick={() => setPickOrder(true)}
                className="w-full flex items-center justify-center gap-2 py-2.5 border border-brick-200 bg-brick-50/50 text-brick-600 rounded-xl text-sm font-medium hover:bg-brick-50">
                <ArrowRight size={14}/> Générer depuis une commande existante
              </button>
            )}
            {f.fromOrderId && (
              <div className="text-xs text-brick-600 bg-brick-50 px-3 py-1.5 rounded-lg">
                Liée à la commande {f.fromOrderId}
              </div>
            )}

            {/* Client */}
            <div>
              <label className="text-[10px] uppercase tracking-widest text-muted block mb-1.5">Client *</label>
              {clients.length > 0 ? (
                <select value={f.clientId} onChange={e => {
                  const c = clients.find(c => c.id === e.target.value);
                  set('clientId', e.target.value); set('client', c?.name || '');
                  if (c?.phone) set('phone', c.phone);
                }} className="field-input">
                  <option value="">Choisir un client…</option>
                  {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              ) : (
                <input value={f.client} onChange={e => set('client', e.target.value)} placeholder="Nom du client" className="field-input"/>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] uppercase tracking-widest text-muted block mb-1.5">Téléphone</label>
                <input value={f.phone} onChange={e => set('phone', e.target.value)} placeholder="+221 77 xxx xx xx" className="field-input"/>
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-widest text-muted block mb-1.5">Boutique</label>
                {shops.length > 0 ? (
                  <select value={f.shopId} onChange={e => {
                    const s = shops.find(s => s.id === e.target.value);
                    set('shopId', e.target.value); set('shop', s?.name || '');
                  }} className="field-input">
                    <option value="">Choisir…</option>
                    {shops.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                ) : (
                  <input value={f.shop} onChange={e => set('shop', e.target.value)} placeholder="Boutique" className="field-input"/>
                )}
              </div>
            </div>

            <div>
              <label className="text-[10px] uppercase tracking-widest text-muted block mb-1.5">Adresse de livraison</label>
              <input value={f.adresseLivraison} onChange={e => set('adresseLivraison', e.target.value)} placeholder="Quartier, Ville" className="field-input"/>
            </div>

            {/* Articles (dropdown) */}
            <div>
              <label className="text-[10px] uppercase tracking-widest text-muted block mb-1.5">Articles</label>
              <div className="flex gap-2 mb-2">
                <select value={newProd.productId} onChange={e => setNewProd(p => ({ ...p, productId: e.target.value }))}
                  className="field-input flex-1 py-2 text-sm">
                  <option value="">Choisir un produit…</option>
                  {shopProducts.map(p => (
                    <option key={p.id} value={p.id}>{p.name}{p.price ? ` — ${p.price.toLocaleString('fr-FR')} F` : ''}</option>
                  ))}
                </select>
                <input type="number" min="1" value={newProd.qty} onChange={e => setNewProd(p => ({ ...p, qty: +e.target.value }))}
                  className="field-input w-16 py-2 text-sm text-center" placeholder="Qté"/>
                <button type="button" onClick={() => {
                  const prod = products.find(p => p.id === newProd.productId);
                  if (!prod) return;
                  const item = { productId: prod.id, name: prod.name, qty: newProd.qty || 1, unitPrice: prod.price || 0 };
                  const idx = f.lineItems.findIndex(l => l.productId === prod.id);
                  const updated = idx >= 0
                    ? f.lineItems.map((l, i) => i === idx ? { ...l, qty: l.qty + item.qty } : l)
                    : [...f.lineItems, item];
                  const t = updated.reduce((s, l) => s + l.unitPrice * l.qty, 0);
                  set('lineItems', updated); set('total', t);
                  setNewProd({ productId: '', qty: 1 });
                }} className="px-3 py-2 bg-brick-500 hover:bg-brick-600 text-white text-sm font-medium rounded-xl shrink-0">+</button>
              </div>
              {f.lineItems.length > 0 && (
                <div className="border border-line/50 rounded-xl overflow-hidden mb-1">
                  {f.lineItems.map((item, i) => (
                    <div key={item.productId} className="flex items-center gap-2 px-3 py-2 border-b border-line/40 last:border-0">
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-ink truncate">{item.name}</div>
                        <div className="text-xs text-muted">{item.unitPrice.toLocaleString('fr-FR')} F × {item.qty} = {(item.unitPrice * item.qty).toLocaleString('fr-FR')} F</div>
                      </div>
                      <button type="button" onClick={() => {
                        const u = f.lineItems.filter((_, j) => j !== i);
                        set('lineItems', u); set('total', u.reduce((s, l) => s + l.unitPrice * l.qty, 0));
                      }} className="w-6 h-6 rounded border border-rose-200 text-rose-400 grid place-items-center"><X size={10}/></button>
                    </div>
                  ))}
                  <div className="px-3 py-2 bg-bone/50 flex justify-between text-sm font-semibold">
                    <span className="text-muted">Sous-total articles</span>
                    <span className="tabular-nums">{fmtFcfa(f.total)}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Description libre */}
            <div>
              <label className="text-[10px] uppercase tracking-widest text-muted block mb-1.5">Description complémentaire</label>
              <textarea value={f.description} onChange={e => set('description', e.target.value)}
                placeholder="Détails supplémentaires, prestations…" className="field-input resize-none" rows={2}/>
            </div>

            {/* Frais */}
            <div className="border-t border-line/50 pt-3 space-y-2">
              <div className="text-xs font-semibold text-ink uppercase tracking-wider mb-1">Frais <span className="font-normal normal-case text-muted">(+ ajout / − déduction)</span></div>
              <FraisRow label="Livraison"    value={f.fraisLivraison.montant}    sens={f.fraisLivraison.sens}    onChange={(field, val) => setFrais('fraisLivraison', field, val)}/>
              <FraisRow label="Installation" value={f.fraisInstallation.montant} sens={f.fraisInstallation.sens} onChange={(field, val) => setFrais('fraisInstallation', field, val)}/>
              <FraisRow label="Service"      value={f.fraisService.montant}      sens={f.fraisService.sens}      onChange={(field, val) => setFrais('fraisService', field, val)}/>
            </div>

            {/* Net à payer */}
            <div className="bg-brick-50/60 border border-brick-100 rounded-xl px-4 py-3 flex items-center justify-between">
              <span className="text-sm font-semibold text-ink">Net à payer</span>
              <span className="text-xl font-bold tabular-nums text-brick-600">{fmtFcfa(net)}</span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] uppercase tracking-widest text-muted block mb-1.5">Statut</label>
                <select value={f.status} onChange={e => set('status', e.target.value)} className="field-input">
                  {INVOICE_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className="text-[10px] uppercase tracking-widest text-muted block mb-1.5">Note</label>
              <input value={f.note} onChange={e => set('note', e.target.value)} placeholder="Remarque, instructions…" className="field-input"/>
            </div>
          </div>

          <div className="flex gap-3 px-5 pb-5">
            <button onClick={onClose} className="flex-1 py-2.5 border border-line/70 rounded-xl text-sm font-medium hover:bg-sand">Annuler</button>
            <button disabled={!f.client && !f.clientId} onClick={() => {
              const clientObj = clients.find(c => c.id === f.clientId);
              onSave({
                id:               invoice?.id || `#F-${Date.now().toString(36).toUpperCase().slice(-5)}`,
                client:           clientObj?.name || f.client,
                clientId:         f.clientId,
                phone:            f.phone,
                shop:             shops.find(s => s.id === f.shopId)?.name || f.shop,
                shopId:           f.shopId,
                lineItems:        f.lineItems,
                description:      f.description,
                total:            f.total || 0,
                net,
                status:           f.status,
                note:             f.note,
                adresseLivraison: f.adresseLivraison,
                fraisLivraison:   f.fraisLivraison,
                fraisInstallation:f.fraisInstallation,
                fraisService:     f.fraisService,
                fromOrderId:      f.fromOrderId,
                date:             invoice?.date || new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' }).toUpperCase(),
                createdAt:        invoice?.createdAt || new Date().toISOString(),
              });
              setDone(true); setTimeout(() => { setDone(false); onClose(); }, 900);
            }} className="flex-1 py-2.5 bg-brick-500 hover:bg-brick-600 disabled:opacity-40 text-white rounded-xl text-sm font-medium">
              {isEdit ? 'Enregistrer' : 'Créer la facture'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function Invoices() {
  const { invoices, setInvoices, clients, shops, allShops, products, stockPoints, stockByPoint, orders } = useStore();
  const [modal, setModal]       = useState(null);
  const [toDelete, setToDelete] = useState(null);
  const [shareInv, setShareInv] = useState(null);
  const [previewInv, setPreviewInv] = useState(null);
  const [search, setSearch]     = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  // Lookup shop by invoice's shopId (use allShops to find even outside filter)
  function shopFor(inv) {
    return (allShops || shops).find(s => s.id === inv.shopId);
  }

  function handleShare(inv) {
    // Toujours montrer modal avec options (WhatsApp/email/SMS/copy)
    // L'utilisateur peut aussi appeler Web Share natif depuis le modal
    setShareInv(inv);
  }

  function save(inv) {
    setInvoices(prev => {
      const i = prev.findIndex(x => x.id === inv.id);
      if (i >= 0) { const n = [...prev]; n[i] = inv; return n; }
      return [inv, ...prev];
    });
  }

  function remove(id) { setInvoices(prev => prev.filter(i => i.id !== id)); setToDelete(null); }
  function changeStatus(id, status) { setInvoices(prev => prev.map(i => i.id === id ? { ...i, status } : i)); }

  let filtered = invoices;
  if (search.trim()) {
    const q = search.toLowerCase();
    filtered = filtered.filter(i => i.client?.toLowerCase().includes(q) || i.id?.toLowerCase().includes(q));
  }
  if (filterStatus) filtered = filtered.filter(i => i.status === filterStatus);

  const totalNet   = invoices.reduce((s, i) => s + (i.net ?? i.total ?? 0), 0);
  const totalPayee = invoices.filter(i => i.status === 'payée').reduce((s, i) => s + (i.net ?? i.total ?? 0), 0);
  const nbAttente  = invoices.filter(i => i.status === 'attente').length;

  const STATUS_TONE = { payée: 'success', attente: 'warning' };

  return (
    <div className="fade-in">
      {modal !== null && (
        <InvoiceModal
          invoice={modal === 'add' ? null : modal}
          clients={clients} shops={shops} products={products}
          stockPoints={stockPoints} stockByPoint={stockByPoint} orders={orders}
          onClose={() => setModal(null)} onSave={save}
        />
      )}
      {shareInv && <ShareModal inv={shareInv} shop={shopFor(shareInv)} onClose={() => setShareInv(null)}/>}
      {previewInv && <InvoicePreviewModal inv={previewInv} shop={shopFor(previewInv)} onShare={(i) => { setShareInv(i); }} onClose={() => setPreviewInv(null)}/>}
      {toDelete && (
        <div className="fixed inset-0 bg-black/40 z-50 overflow-y-auto py-4 px-4 flex items-start lg:items-center justify-center">
          <div className="bg-surface rounded-2xl shadow-xl w-full max-w-sm p-6 text-center">
            <Trash2 size={36} className="text-rose-500 mx-auto mb-3"/>
            <div className="font-semibold text-ink mb-1">Supprimer {toDelete.id} ?</div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setToDelete(null)} className="flex-1 py-2.5 border border-line/70 rounded-xl text-sm font-medium hover:bg-sand">Annuler</button>
              <button onClick={() => remove(toDelete.id)} className="flex-1 py-2.5 bg-rose-500 hover:bg-rose-600 text-white rounded-xl text-sm font-medium">Supprimer</button>
            </div>
          </div>
        </div>
      )}

      <div className="hidden lg:block">
        <PageHeader breadcrumb="FACTURES" title="Factures" actionLabel="Nouvelle facture" onAction={() => setModal('add')}/>
      </div>
      <MobileTopBar subtitle="FACTURES"/>

      <div className="px-4 lg:px-8 py-5 space-y-4">
        {/* Mobile add */}
        <div className="lg:hidden">
          <button onClick={() => setModal('add')} className="w-full py-2.5 bg-brick-500 text-white rounded-xl text-sm font-medium flex items-center justify-center gap-2">
            <Plus size={14}/> Nouvelle facture
          </button>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-surface border border-line/70 rounded-xl px-4 py-3">
            <div className="text-[10px] uppercase tracking-widest text-muted">Total émis</div>
            <div className="text-xl font-semibold tabular-nums text-ink mt-1">{fmtFcfa(totalNet)}</div>
          </div>
          <div className="bg-surface border border-line/70 rounded-xl px-4 py-3">
            <div className="text-[10px] uppercase tracking-widest text-muted">Payées</div>
            <div className="text-xl font-semibold tabular-nums text-brick-600 mt-1">{fmtFcfa(totalPayee)}</div>
          </div>
          <div className="bg-surface border border-line/70 rounded-xl px-4 py-3">
            <div className="text-[10px] uppercase tracking-widest text-muted">En attente</div>
            <div className="text-xl font-semibold tabular-nums text-amber-600 mt-1">{nbAttente}</div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2 items-center">
          <div className="relative flex-1 min-w-[160px]">
            <FileText size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted"/>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Client, N° facture…"
              className="w-full pl-8 pr-3 py-2 text-sm bg-surface border border-line/70 rounded-xl focus:outline-none focus:border-brick-300"/>
          </div>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
            className="px-3 py-2 text-sm bg-surface border border-line/70 rounded-xl focus:outline-none focus:border-brick-300">
            <option value="">Tous statuts</option>
            {INVOICE_STATUSES.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
          </select>
          <span className="text-xs text-muted">{filtered.length} facture(s)</span>
        </div>

        {invoices.length === 0 ? (
          <div className="text-center py-16 space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-bone border border-line/50 grid place-items-center mx-auto"><FileText size={22} className="text-muted"/></div>
            <div className="text-muted text-sm">Aucune facture émise.</div>
            <button onClick={() => setModal('add')} className="inline-flex items-center gap-2 px-4 py-2 bg-brick-500 hover:bg-brick-600 text-white text-sm font-medium rounded-xl">
              <Plus size={14}/> Nouvelle facture
            </button>
          </div>
        ) : (
          <Card>
            {/* Desktop */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-line/70 text-[10px] uppercase tracking-[0.12em] text-muted">
                    <th className="text-left py-2.5 px-5 font-medium">N°</th>
                    <th className="text-left py-2.5 px-3 font-medium">Client</th>
                    <th className="text-left py-2.5 px-3 font-medium">Boutique</th>
                    <th className="text-left py-2.5 px-3 font-medium">Articles</th>
                    <th className="text-right py-2.5 px-3 font-medium">Net à payer</th>
                    <th className="text-left py-2.5 px-3 font-medium">Statut</th>
                    <th className="text-left py-2.5 px-3 font-medium">Date</th>
                    <th className="w-12 py-2.5 px-5"></th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(inv => (
                    <tr key={inv.id} className="border-b border-line/40 last:border-0 hover:bg-bone/50">
                      <td className="py-3 px-5 font-mono text-xs text-brick-500 font-semibold">{inv.id}</td>
                      <td className="px-3 font-medium text-ink">{inv.client}</td>
                      <td className="px-3 text-muted text-xs">{inv.shop || '—'}</td>
                      <td className="px-3 text-muted text-xs max-w-[160px] truncate">{inv.lineItems?.map(l => `${l.name} ×${l.qty}`).join(', ') || inv.description || '—'}</td>
                      <td className="px-3 text-right tabular-nums font-semibold text-brick-600">{fmtFcfa(inv.net ?? inv.total ?? 0)}</td>
                      <td className="px-3">
                        <select value={inv.status} onChange={e => changeStatus(inv.id, e.target.value)}
                          className="text-xs border border-line/50 rounded-lg px-2 py-1 bg-surface focus:outline-none">
                          {INVOICE_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </td>
                      <td className="px-3 text-muted text-xs">{inv.date}</td>
                      <td className="px-5">
                        <ActionMenu actions={[
                          { label: 'Modifier',   icon: Edit2,     onClick: () => setModal(inv) },
                          { label: 'Voir / Imprimer', icon: Eye,  onClick: () => setPreviewInv(inv) },
                          { label: 'Partager',   icon: Share2,    onClick: () => handleShare(inv) },
                          'divider',
                          { label: 'Supprimer',  icon: Trash2,    onClick: () => setToDelete(inv), danger: true },
                        ]}/>
                      </td>
                    </tr>
                  ))}
                  {filtered.length === 0 && <tr><td colSpan={8} className="py-8 text-center text-muted text-sm">Aucun résultat.</td></tr>}
                </tbody>
              </table>
            </div>

            {/* Mobile */}
            <ul className="lg:hidden divide-y divide-line/50">
              {filtered.map(inv => (
                <li key={inv.id} className="px-4 py-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-xs text-brick-500 font-semibold">{inv.id}</span>
                        <span className="font-medium text-ink">{inv.client}</span>
                      </div>
                      {inv.shop && <div className="text-xs text-muted mt-0.5">{inv.shop}</div>}
                      <div className="flex items-center gap-3 mt-1.5">
                        <span className="font-bold tabular-nums text-brick-600">{fmtFcfa(inv.net ?? inv.total ?? 0)}</span>
                        <Badge tone={STATUS_TONE[inv.status] || 'soft'} size="xs">{inv.status}</Badge>
                      </div>
                    </div>
                    <ActionMenu actions={[
                      { label: 'Modifier',       icon: Edit2,    onClick: () => setModal(inv) },
                      { label: 'Voir / Imprimer', icon: Eye, onClick: () => setPreviewInv(inv) },
                      { label: 'Partager',       icon: Share2,   onClick: () => handleShare(inv) },
                      { label: 'Marquer payée',   icon: null, onClick: () => changeStatus(inv.id, 'payée'),   disabled: inv.status === 'payée' },
                      { label: 'Marquer attente', icon: null, onClick: () => changeStatus(inv.id, 'attente'), disabled: inv.status === 'attente' },
                      'divider',
                      { label: 'Supprimer', icon: Trash2, onClick: () => setToDelete(inv), danger: true },
                    ]}/>
                  </div>
                </li>
              ))}
              {filtered.length === 0 && <li className="py-8 text-center text-muted text-sm">Aucun résultat.</li>}
            </ul>
          </Card>
        )}
      </div>
    </div>
  );
}
