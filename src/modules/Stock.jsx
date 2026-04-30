import { useState } from 'react';
import { ArrowRight, ArrowLeftRight, ScanLine, Filter, Plus, Minus, ChevronRight, ArrowLeft, X } from 'lucide-react';
import PageHeader, { HeaderFilter } from '../components/PageHeader.jsx';
import MobileTopBar from '../components/MobileTopBar.jsx';
import { Card, CardHeader, Badge, StatusBadge, Gauge, Progress } from '../components/ui.jsx';
import { products, stockMatrix, shops, inventory } from '../data/mockData.js';
import { fmtFcfa } from '../utils/format.js';

export default function Stock({ initialView = 'multipoints' }) {
  const [view, setView] = useState(initialView);

  return (
    <div className="fade-in">
      {view === 'multipoints' && <MultiPoints onOpenInventory={() => setView('inventory')} onOpenTransfer={() => setView('transfer')} />}
      {view === 'inventory'   && <Inventory onBack={() => setView('multipoints')} />}
      {view === 'transfer'    && <Transfer onBack={() => setView('multipoints')} />}
    </div>
  );
}

// ===================================================================
// VUE MULTI-POINTS
// ===================================================================
function MultiPoints({ onOpenInventory, onOpenTransfer }) {
  const computeStatus = (row) => row.alert === 'rupture' ? 'rupture' : row.alert === 'bas' ? 'bas' : 'ok';
  const totalUnits = products.reduce((s, p) => {
    const row = stockMatrix[p.id];
    return s + shops.reduce((a, sh) => a + (row[sh.id] || 0), 0);
  }, 0);

  return (
    <>
      <div className="hidden lg:block">
        <PageHeader
          breadcrumb="STOCK · TOUS PRODUITS"
          title="Stock — Vue multi-points"
          searchPlaceholder="Produit, SKU, catégorie..."
          filters={
            <>
              <HeaderFilter>Catégorie ▾</HeaderFilter>
              <HeaderFilter>Statut ▾</HeaderFilter>
              <HeaderFilter>Boutique ▾</HeaderFilter>
            </>
          }
          actionLabel="Produit"
          rightExtras={
            <button onClick={onOpenTransfer} className="flex items-center gap-1.5 px-3 py-1.5 text-sm border border-line/70 rounded-lg hover:bg-surface">
              <ArrowLeftRight size={13} /> Transfert
            </button>
          }
        />
      </div>
      <MobileTopBar alerts={3} subtitle="STOCK · MULTI-POINTS" />

      <div className="px-4 lg:px-8 py-5">
        {/* Mobile action row */}
        <div className="lg:hidden flex items-center gap-2 mb-3">
          <button onClick={onOpenInventory} className="flex-1 px-3 py-2.5 text-sm bg-surface border border-line/70 rounded-xl flex items-center justify-center gap-1.5 font-medium">
            <ScanLine size={14} /> Inventaire
          </button>
          <button onClick={onOpenTransfer} className="flex-1 px-3 py-2.5 text-sm bg-surface border border-line/70 rounded-xl flex items-center justify-center gap-1.5 font-medium">
            <ArrowLeftRight size={14} /> Transfert
          </button>
          <button className="flex-1 px-3 py-2.5 text-sm bg-brick-500 text-white rounded-xl flex items-center justify-center gap-1.5 font-medium">
            <Plus size={14} /> Produit
          </button>
        </div>

        <Card>
          <div className="px-4 lg:px-5 pt-4 pb-3 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-muted">
              <Filter size={13} />
              <span>{products.length} produits · {shops.length} boutiques</span>
            </div>
            <button onClick={onOpenInventory} className="text-xs text-brick-500 hover:underline hidden lg:block">démarrer un inventaire →</button>
          </div>

          {/* Mobile cards */}
          <ul className="lg:hidden divide-y divide-line/60 px-2 pb-2">
            {products.map((p) => {
              const row = stockMatrix[p.id];
              const total = shops.reduce((s, sh) => s + (row[sh.id] || 0), 0);
              const status = computeStatus(row);
              return (
                <li key={p.id} className="flex items-center gap-3 px-3 py-3">
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-ink truncate">{p.name}</div>
                    <div className="text-[11px] text-muted mt-0.5">{p.sku} · {fmtFcfa(p.price)} / unité</div>
                    {/* Per-shop mini breakdown */}
                    <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                      {shops.map(s => {
                        const v = row[s.id] || 0;
                        return (
                          <span key={s.id} className={`text-[10px] tabular-nums px-1.5 py-0.5 rounded ${
                            v === 0 ? 'bg-rose-50 text-rose-500' : v < 10 ? 'bg-amber-50 text-amber-700' : 'bg-brick-50 text-brick-600'
                          }`}>
                            {s.name.substring(0, 3)} {v}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-sm font-semibold tabular-nums text-ink">{total} u.</div>
                    <div className="mt-0.5"><StatusBadge status={status} /></div>
                  </div>
                </li>
              );
            })}
          </ul>

          {/* Desktop table */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-y border-line/70 text-[10px] uppercase tracking-[0.1em] text-muted">
                  <th className="text-left py-2 px-5 font-medium w-[28%]">Produit</th>
                  {shops.map(s => (
                    <th key={s.id} className="text-right py-2 px-2 font-medium">{s.name}</th>
                  ))}
                  <th className="text-right py-2 px-3 font-medium">Total</th>
                  <th className="text-right py-2 px-5 font-medium">Statut</th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => {
                  const row = stockMatrix[p.id];
                  const total = shops.reduce((s, sh) => s + (row[sh.id] || 0), 0);
                  const status = computeStatus(row);
                  return (
                    <tr key={p.id} className="border-b border-line/40 last:border-0 hover:bg-brick-50/30 cursor-pointer">
                      <td className="py-3 px-5">
                        <div className="font-medium text-ink">{p.name}</div>
                        <div className="text-xs text-muted">{p.sku} · {p.category}</div>
                      </td>
                      {shops.map(s => {
                        const v = row[s.id] || 0;
                        const tone =
                          v === 0 ? 'text-rose-500 font-semibold'
                          : v < 10 ? 'text-amber-600 font-medium'
                          : 'text-ink';
                        return (
                          <td key={s.id} className={`text-right tabular-nums px-2 ${tone}`}>{v}</td>
                        );
                      })}
                      <td className="text-right tabular-nums px-3 font-semibold text-ink">{total}</td>
                      <td className="text-right px-5"><StatusBadge status={status} /></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="px-4 lg:px-5 py-3 flex items-center justify-between text-xs text-muted border-t border-line/70">
            <span>{totalUnits.toLocaleString('fr-FR')} unités totales</span>
            <span>Valorisation : <span className="text-ink font-semibold tabular-nums">14,8 M FCFA</span></span>
          </div>
        </Card>
      </div>
    </>
  );
}

// ===================================================================
// INVENTAIRE
// ===================================================================
function Inventory({ onBack }) {
  return (
    <>
      <div className="hidden lg:block">
        <PageHeader
          breadcrumb={<button onClick={onBack} className="hover:text-ink">STOCK / VUES PAR BOUTIQUE</button>}
          title={`Inventaire · ${inventory.shop}`}
          searchPlaceholder={null}
          filters={
            <button className="flex items-center gap-1.5 px-3 py-1.5 text-sm border border-line/70 rounded-lg hover:bg-surface">
              <ScanLine size={13} /> Scanner
            </button>
          }
          rightExtras={
            <>
              <button className="px-3 py-1.5 text-sm border border-line/70 rounded-lg hover:bg-surface">Suspendre</button>
              <button className="px-3 py-1.5 bg-brick-500 hover:bg-brick-600 text-white text-sm font-medium rounded-lg">Clôturer</button>
            </>
          }
        />
      </div>

      {/* Mobile header */}
      <div className="lg:hidden px-4 pt-4 pb-3 flex items-center gap-3 bg-bone sticky top-0 z-20 border-b border-line/60">
        <button onClick={onBack} className="w-8 h-8 grid place-items-center -ml-1">
          <ArrowLeft size={18} />
        </button>
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-ink">Inventaire</div>
          <div className="text-[11px] text-muted">{inventory.shop}</div>
        </div>
        <button className="px-3 py-1.5 text-sm border border-line/70 rounded-lg bg-surface">Suspendre</button>
        <button className="px-3 py-1.5 bg-brick-500 text-white text-sm font-medium rounded-lg">Clôturer</button>
      </div>

      <MobileTopBar alerts={3} subtitle={`INVENTAIRE · ${inventory.shop.toUpperCase()}`} />

      <div className="px-4 lg:px-8 py-5 grid grid-cols-1 lg:grid-cols-12 gap-5">

        {/* Progress gauge */}
        <Card className="lg:col-span-3 p-5">
          <CardHeader title="Progression" subtitle="Inventaire en cours" />
          <div className="grid place-items-center py-3">
            <Gauge value={inventory.progress} size={160} />
          </div>
          <div className="mt-3 space-y-2 text-sm">
            <Row label="Total produits" value={inventory.total} />
            <Row label="Comptés" value={inventory.done} />
            <Row label="Restants" value={inventory.remaining} tone="amber" />
          </div>
          <div className="mt-4 pt-3 border-t border-line/70">
            <div className="text-[10px] uppercase tracking-wider text-muted mb-2">Équipe</div>
            <ul className="space-y-1.5 text-sm">
              {[['M. Diallo','rayonnage 1'],['A. Diop','rayonnage 2'],['F. Sarr','frais']].map(([name, zone]) => (
                <li key={name} className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-brick-50 text-brick-600 text-[10px] grid place-items-center font-semibold">
                    {name.split(' ').map(p => p[0]).join('')}
                  </div>
                  <span className="text-ink/85">{name}</span>
                  <span className="ml-auto text-xs text-muted">{zone}</span>
                </li>
              ))}
            </ul>
          </div>
        </Card>

        {/* Main inventory table */}
        <Card className="lg:col-span-6">
          <div className="px-4 lg:px-5 pt-4 pb-3 flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2 flex-1 min-w-[180px]">
              <ScanLine size={13} className="text-muted shrink-0" />
              <input
                placeholder="Scanner ou saisir SKU..."
                className="flex-1 text-sm bg-bone border border-line/70 rounded-lg px-3 py-1.5 focus:outline-none focus:border-brick-300"
              />
            </div>
            <div className="flex items-center gap-2">
              <button className="px-2.5 py-1.5 text-xs border border-line/70 rounded-md hover:bg-surface">Tous</button>
              <button className="px-2.5 py-1.5 text-xs border border-line/70 rounded-md hover:bg-surface bg-surface font-medium">Écarts</button>
            </div>
          </div>

          {/* Mobile cards for inventory rows */}
          <ul className="lg:hidden divide-y divide-line/60 px-2 pb-2">
            {inventory.rows.map((r, i) => (
              <li key={i} className="px-3 py-3">
                <div className="flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-ink truncate">{r.p}</div>
                    <div className="text-xs text-muted mt-0.5">Attendu : {r.expected}</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="text-[10px] text-muted uppercase tracking-wider">Compté</div>
                      <input
                        type="number"
                        defaultValue={r.counted}
                        className="w-16 text-right bg-bone border border-line/70 rounded-lg px-2 py-1.5 text-sm font-semibold focus:outline-none focus:border-brick-300"
                      />
                    </div>
                    <div className="text-right">
                      <div className="text-[10px] text-muted uppercase tracking-wider">Écart</div>
                      <div className={`text-sm font-semibold tabular-nums mt-1 ${
                        r.ecart < 0 ? 'text-rose-500' : r.ecart > 0 ? 'text-blue-600' : 'text-muted'
                      }`}>{r.ecart > 0 ? '+' : ''}{r.ecart}</div>
                    </div>
                    <StatusBadge status={r.status} />
                  </div>
                </div>
              </li>
            ))}
          </ul>

          {/* Desktop table */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-y border-line/70 text-[10px] uppercase tracking-[0.1em] text-muted">
                  <th className="text-left py-2 px-5 font-medium">Produit</th>
                  <th className="text-right py-2 px-3 font-medium">Att.</th>
                  <th className="text-right py-2 px-3 font-medium">Compté</th>
                  <th className="text-right py-2 px-3 font-medium">Écart</th>
                  <th className="text-right py-2 px-5 font-medium">Statut</th>
                </tr>
              </thead>
              <tbody>
                {inventory.rows.map((r, i) => (
                  <tr key={i} className="border-b border-line/40 last:border-0 hover:bg-brick-50/20">
                    <td className="py-3 px-5 font-medium text-ink">{r.p}</td>
                    <td className="text-right tabular-nums px-3">{r.expected}</td>
                    <td className="text-right tabular-nums px-3 font-semibold">
                      <input type="number" defaultValue={r.counted} className="w-14 text-right bg-bone border border-line/70 rounded px-1.5 py-1 focus:outline-none focus:border-brick-300" />
                    </td>
                    <td className={`text-right tabular-nums px-3 font-semibold ${
                      r.ecart < 0 ? 'text-rose-500' : r.ecart > 0 ? 'text-blue-600' : 'text-muted'
                    }`}>
                      {r.ecart > 0 ? '+' : ''}{r.ecart}
                    </td>
                    <td className="text-right px-5"><StatusBadge status={r.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Side panels */}
        <div className="lg:col-span-3 space-y-4">
          <Card className="p-5">
            <CardHeader title="Écarts à justifier" subtitle={`${inventory.toJustify} produits`} action={<Badge tone="danger">{inventory.toJustify}</Badge>} />
            <ul className="px-1 pb-1 space-y-2">
              {inventory.rows.filter(r => r.status === 'justify').map((r, i) => (
                <li key={i} className="flex items-center gap-2 px-2 py-2 hover:bg-bone/60 rounded-lg">
                  <div className="w-1 h-7 rounded-full bg-rose-400 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-ink truncate">{r.p}</div>
                    <div className="text-[11px] text-muted">écart : <span className="text-rose-500 font-semibold">{r.ecart}</span></div>
                  </div>
                  <button className="text-xs text-brick-500 hover:underline shrink-0">justifier</button>
                </li>
              ))}
            </ul>
          </Card>

          <Card className="p-5">
            <CardHeader title="Fournisseurs" />
            <ul className="space-y-1 text-sm">
              {inventory.suppliers.map((s, i) => (
                <li key={i} className="flex items-center justify-between px-2 py-1.5 hover:bg-bone/60 rounded">
                  <span className="text-ink/85">{s}</span>
                  <ChevronRight size={13} className="text-muted" />
                </li>
              ))}
            </ul>
          </Card>

          <Card className="p-5 bg-rose-50/60">
            <div className="text-[10px] uppercase tracking-wider text-muted">Écart total estimé</div>
            <div className="text-2xl font-semibold tabular-nums text-rose-600 mt-1">{fmtFcfa(inventory.ecartTotal)}</div>
            <div className="text-xs text-muted mt-1">FCFA · au prix de revient</div>
          </Card>
        </div>
      </div>
    </>
  );
}

function Row({ label, value, tone = 'ink' }) {
  const toneCls = tone === 'amber' ? 'text-amber-600' : 'text-ink';
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted">{label}</span>
      <span className={`tabular-nums font-medium ${toneCls}`}>{value}</span>
    </div>
  );
}

// ===================================================================
// TRANSFERT
// ===================================================================
function Transfer({ onBack }) {
  const [items, setItems] = useState([
    { id: 1, name: 'Riz parfumé 25kg',  source: 24, dest: 6,  qty: 15 },
    { id: 2, name: 'Huile soja 5L',     source: 41, dest: 4,  qty: 10 },
    { id: 3, name: 'Café arabica 200g', source: 18, dest: 8,  qty: 8 },
    { id: 4, name: 'Riz parfumé 25kg',  source: 30, dest: 12, qty: 20 }
  ]);

  const updateQty = (id, delta) =>
    setItems(items.map(it => it.id === id ? { ...it, qty: Math.max(0, it.qty + delta) } : it));
  const remove = (id) => setItems(items.filter(it => it.id !== id));

  const total = 284_000;

  return (
    <>
      <div className="hidden lg:block">
        <PageHeader
          breadcrumb={<button onClick={onBack} className="hover:text-ink">STOCK / TRANSFERT</button>}
          title="Nouveau transfert"
          searchPlaceholder={null}
          rightExtras={
            <>
              <button onClick={onBack} className="px-3 py-1.5 text-sm border border-line/70 rounded-lg hover:bg-surface">Annuler</button>
              <button className="px-3 py-1.5 bg-brick-500 hover:bg-brick-600 text-white text-sm font-medium rounded-lg">Valider</button>
            </>
          }
        />
      </div>

      {/* Mobile header */}
      <div className="lg:hidden px-4 pt-4 pb-3 flex items-center gap-3 bg-bone sticky top-0 z-20 border-b border-line/60">
        <button onClick={onBack} className="w-8 h-8 grid place-items-center -ml-1">
          <ArrowLeft size={18} />
        </button>
        <div className="flex-1 font-semibold text-ink">Nouveau transfert</div>
      </div>

      <MobileTopBar alerts={3} subtitle="NOUVEAU TRANSFERT" />

      <div className="px-4 lg:px-8 py-5 space-y-4">
        {/* Source → Destination */}
        <Card className="p-4 lg:p-5">
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-3 lg:gap-4">
            <div className="flex-1">
              <div className="text-[10px] uppercase tracking-wider text-muted mb-1.5">Source</div>
              <button className="w-full flex items-center gap-3 px-4 py-3 border border-line/70 rounded-lg bg-bone/60 hover:border-brick-200">
                <span className="px-2 py-0.5 rounded-md bg-surface border border-line/70 text-xs font-semibold tracking-wider">PLA</span>
                <span className="font-medium text-ink">Plateau</span>
                <span className="text-xs text-muted ml-auto">10 av. Pompidou</span>
              </button>
            </div>
            <div className="hidden lg:grid w-12 h-12 mt-5 place-items-center rounded-full bg-brick-50 shrink-0">
              <ArrowRight size={18} className="text-brick-500" />
            </div>
            <div className="lg:hidden flex justify-center text-brick-500 font-bold text-lg">↓</div>
            <div className="flex-1">
              <div className="text-[10px] uppercase tracking-wider text-muted mb-1.5">Destination</div>
              <button className="w-full flex items-center gap-3 px-4 py-3 border border-line/70 rounded-lg bg-bone/60 hover:border-brick-200">
                <span className="px-2 py-0.5 rounded-md bg-surface border border-line/70 text-xs font-semibold tracking-wider">LB6</span>
                <span className="font-medium text-ink">Liberté 6</span>
                <span className="text-xs text-muted ml-auto">12 sicap rue 68</span>
              </button>
            </div>
          </div>
        </Card>

        {/* Articles */}
        <Card>
          <div className="px-4 lg:px-5 pt-4 pb-3 flex items-center justify-between">
            <div className="text-sm font-semibold text-ink">Articles à transférer</div>
            <button className="text-xs text-brick-500 hover:underline flex items-center gap-1">
              <Plus size={13} /> Ajouter
            </button>
          </div>

          {/* Mobile cards for articles */}
          <div className="lg:hidden divide-y divide-line/60 px-2 pb-2">
            {items.map((it) => (
              <div key={it.id} className="px-3 py-3">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="text-sm font-medium text-ink truncate flex-1">{it.name}</div>
                  <button onClick={() => remove(it.id)} className="text-muted hover:text-rose-500 shrink-0">
                    <X size={14} />
                  </button>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 text-xs text-muted">
                    <span>Stock : <span className="text-ink font-medium tabular-nums">{it.source}</span></span>
                    <span>→</span>
                    <span>Dest : <span className="text-amber-600 font-medium tabular-nums">{it.dest}</span></span>
                  </div>
                  <div className="inline-flex items-center gap-1 border border-line/70 rounded-lg bg-bone/40">
                    <button onClick={() => updateQty(it.id, -1)} className="w-8 h-8 grid place-items-center hover:bg-surface rounded-l-lg">
                      <Minus size={12} />
                    </button>
                    <span className="w-10 text-center font-semibold tabular-nums text-sm">×{it.qty}</span>
                    <button onClick={() => updateQty(it.id, +1)} className="w-8 h-8 grid place-items-center hover:bg-surface rounded-r-lg">
                      <Plus size={12} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop table */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-y border-line/70 text-[10px] uppercase tracking-[0.1em] text-muted">
                  <th className="text-left py-2 px-5 font-medium">Produit</th>
                  <th className="text-right py-2 px-3 font-medium">Source</th>
                  <th className="text-right py-2 px-3 font-medium">Dest.</th>
                  <th className="text-center py-2 px-4 font-medium">Qté</th>
                  <th className="w-10"></th>
                </tr>
              </thead>
              <tbody>
                {items.map((it) => (
                  <tr key={it.id} className="border-b border-line/40 last:border-0 hover:bg-brick-50/20">
                    <td className="py-3 px-5 font-medium text-ink">{it.name}</td>
                    <td className="text-right tabular-nums px-3">{it.source}</td>
                    <td className="text-right tabular-nums px-3 text-amber-600 font-medium">{it.dest}</td>
                    <td className="text-center px-4">
                      <div className="inline-flex items-center gap-1 border border-line/70 rounded-md bg-bone/40">
                        <button onClick={() => updateQty(it.id, -1)} className="w-7 h-7 grid place-items-center hover:bg-surface rounded-l-md"><Minus size={11} /></button>
                        <span className="w-9 text-center font-semibold tabular-nums">{it.qty}</span>
                        <button onClick={() => updateQty(it.id, +1)} className="w-7 h-7 grid place-items-center hover:bg-surface rounded-r-md"><Plus size={11} /></button>
                      </div>
                    </td>
                    <td><button onClick={() => remove(it.id)} className="text-muted hover:text-rose-500 text-xs px-2"><X size={13} /></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="px-4 lg:px-5 py-4 flex items-end justify-between border-t border-line/70 bg-bone/40">
            <div className="text-xs text-muted hidden lg:block">
              Plateau → Liberté 6 · {items.length} articles
            </div>
            <div className="text-right ml-auto">
              <div className="text-[10px] uppercase tracking-wider text-muted">Total valorisé</div>
              <div className="text-2xl font-semibold tabular-nums text-brick-600">{fmtFcfa(total)}</div>
              <div className="text-xs text-muted">FCFA</div>
            </div>
          </div>
        </Card>

        {/* Mobile footer actions */}
        <div className="lg:hidden flex gap-3 pb-2">
          <button onClick={onBack} className="flex-1 py-3 text-sm border border-line/70 rounded-xl bg-surface font-medium">Annuler</button>
          <button className="flex-1 py-3 text-sm bg-brick-500 text-white font-semibold rounded-xl">Valider le transfert</button>
        </div>
      </div>
    </>
  );
}
