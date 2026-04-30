// gestCopta — mock data (FCFA, Sénégal context)

export const currentUser = {
  name: 'Aissa Diop',
  initials: 'AD',
  role: 'Admin',
  shops: 7
};

export const shops = [
  { id: 'plateau',  name: 'Plateau',  color: '#C0392B' },
  { id: 'almadies', name: 'Almadies', color: '#D86B57' },
  { id: 'yoff',     name: 'Yoff',     color: '#E89484' },
  { id: 'liberte6', name: 'Liberté 6',color: '#A82E22' },
  { id: 'autre',    name: 'Autre',    color: '#6B6B6B' }
];

export const products = [
  { id: 'p1', name: 'Riz parfumé 25kg',   sku: 'RIZ-25',   category: 'Céréales', price: 14500, cost: 12000 },
  { id: 'p2', name: 'Huile soja 5L',      sku: 'HUI-5L',   category: 'Huiles',   price: 6800,  cost: 5400 },
  { id: 'p3', name: 'Sucre cristal 50kg', sku: 'SUC-50',   category: 'Épicerie', price: 32000, cost: 27500 },
  { id: 'p4', name: 'Café arabica 200g',  sku: 'CAF-200',  category: 'Boissons', price: 4200,  cost: 3000 },
  { id: 'p5', name: 'Pâtes spaghetti',    sku: 'PAT-500',  category: 'Épicerie', price: 850,   cost: 600 },
  { id: 'p6', name: 'Tomate concentrée',  sku: 'TOM-400',  category: 'Conserves',price: 950,   cost: 650 },
  { id: 'p7', name: 'Lait poudre 900g',   sku: 'LAI-900',  category: 'Laitiers', price: 5200,  cost: 4100 },
  { id: 'p8', name: 'Farine blé 25kg',    sku: 'FAR-25',   category: 'Céréales', price: 11800, cost: 9800 },
  { id: 'p9', name: 'Savon Marseille',    sku: 'SAV-MAR',  category: 'Hygiène',  price: 1500,  cost: 950 },
  { id: 'p10', name: 'Sucre poudre 1kg',  sku: 'SUC-1',    category: 'Épicerie', price: 950,   cost: 700 }
];

// Stock matrix : qty per product per shop
export const stockMatrix = {
  p1: { plateau: 49, almadies: 24, yoff: 18, liberte6: 38, autre: 0,  alert: 'rupture' },
  p2: { plateau: 18, almadies: 4,  yoff: 28, liberte6: 6,  autre: 31, alert: 'bas' },
  p3: { plateau: 36, almadies: 30, yoff: 24, liberte6: 28, autre: 17, alert: null },
  p4: { plateau: 54, almadies: 49, yoff: 28, liberte6: 41, autre: 60, alert: null },
  p5: { plateau: 12, almadies: 6,  yoff: 4,  liberte6: 15, autre: 7,  alert: 'bas' },
  p6: { plateau: 88, almadies: 72, yoff: 65, liberte6: 80, autre: 91, alert: null },
  p7: { plateau: 32, almadies: 25, yoff: 19, liberte6: 14, autre: 24, alert: 'bas' },
  p8: { plateau: 41, almadies: 22, yoff: 30, liberte6: 36, autre: 17, alert: null },
  p9: { plateau: 64, almadies: 58, yoff: 42, liberte6: 50, autre: 38, alert: null },
  p10:{ plateau: 0,  almadies: 8,  yoff: 5,  liberte6: 0,  autre: 12, alert: 'rupture' }
};

export const clients = [
  { id: 'c1', name: 'Mamadou Sow',       phone: '+221 77 432 18 90', orders: 12, total: 184_000,    last: 'il y a 3h',   type: 'régulier', favShop: 'plateau' },
  { id: 'c2', name: 'Coumba & Co',       phone: '+221 33 821 44 12', orders: 47, total: 2_400_000,  last: 'aujourd\'hui',type: 'pro',      favShop: 'plateau', vip: true, since: 'mars 2023', months: 25,
    favorites: ['Riz', 'Huile', 'Sucre'], frequency: '2× / semaine' },
  { id: 'c3', name: 'Aissatou Ndiaye',   phone: '+221 76 218 99 41', orders: 8,  total: 92_000,     last: 'hier',         type: 'régulier' },
  { id: 'c4', name: 'Boulang. Sandaga',  phone: '+221 33 822 76 50', orders: 28, total: 1_100_000,  last: '2 jours',      type: 'pro' },
  { id: 'c5', name: 'Fatou Ba',          phone: '+221 78 981 23 45', orders: 3,  total: 34_000,     last: '3 jours',      type: 'nouveau' },
  { id: 'c6', name: 'Ousmane Diop',      phone: '+221 77 654 32 18', orders: 19, total: 218_000,    last: '1 sem.',       type: 'régulier' },
  { id: 'c7', name: 'Marché Tilène',     phone: '+221 33 845 66 21', orders: 15, total: 478_000,    last: '3 jours',      type: 'pro' },
  { id: 'c8', name: 'Astou Fall',        phone: '+221 76 543 21 89', orders: 5,  total: 47_000,     last: '2 sem.',       type: 'régulier' }
];

// Generate a 30-day revenue curve (FCFA), trending up
const baseCurve = [78, 82, 85, 80, 88, 92, 90, 95, 98, 102, 100, 108, 112, 115, 118, 122, 125, 130, 128, 135, 140, 142, 150, 148, 155, 160, 165, 170, 175, 184];
export const revenueCurve = baseCurve.map((v, i) => ({ day: i + 1, value: v * 1000 })); // values in FCFA

export const dashboardKPIs = {
  caMonth: 3_030_000,
  caMonthDelta: '+12%',
  orders: 284,
  ordersDelta: '+8',
  stockGlobal: 82,
  stockDelta: '+1pt',
  alerts: 30,
  alertsDelta: '4 critiques'
};

export const shopPerformance = [
  { shop: 'Plateau',   ca: 947_000, bars: [4,5,3,5,5,4,5], stock: 91, alert: 1 },
  { shop: 'Almadies',  ca: 805_000, bars: [4,4,5,4,5,5,4], stock: 87, alert: 2 },
  { shop: 'Yoff',      ca: 666_000, bars: [3,4,4,5,4,3,5], stock: 74, alert: 4 },
  { shop: 'Liberté 6', ca: 391_000, bars: [3,4,3,4,5,4,3], stock: 79, alert: 3 },
  { shop: 'Pikine',    ca: 280_000, bars: [2,3,3,4,3,4,3], stock: 68, alert: 6 },
  { shop: 'Tatiguine', ca: 250_000, bars: [2,3,2,3,4,3,3], stock: 65, alert: 8 },
  { shop: 'Thiès',     ca: 188_000, bars: [2,2,3,3,2,3,3], stock: 62, alert: 6 }
];

export const stockAlerts = [
  { product: 'Riz parfumé 25kg', shop: 'Plateau',  level: 'rupture' },
  { product: 'Huile soja 5L',    shop: 'Almadies', level: 'bas' },
  { product: 'Sucre poudre 1kg', shop: 'Liberté 6', level: 'rupture' },
  { product: 'Lait poudre 900g', shop: 'Yoff',     level: 'bas' },
  { product: 'Pâtes spaghetti',  shop: 'Almadies', level: 'bas' }
];

export const recentActivity = [
  { time: '14:32', label: 'Plateau · M. Sow',           detail: 'Cmd #2847',  delta: '+45 K',  kind: 'order' },
  { time: '14:28', label: 'Almadies · A. Diop',         detail: 'Cmd #2846',  delta: '+12 K',  kind: 'order' },
  { time: '14:21', label: 'Yoff · F. Ba (att.)',        detail: 'Cmd #2845',  delta: '−8 K',   kind: 'pending' },
  { time: '14:08', label: 'Liberté 6 · Sucre',          detail: 'Stock bas',  delta: 'Alerte', kind: 'alert' },
  { time: '13:54', label: 'Plateau · Coumba & Co',      detail: 'Facture #F-219', delta: '+184 K', kind: 'invoice' },
  { time: '13:31', label: 'Transfert Plateau → Liberté',detail: 'Validé',     delta: '284 K',   kind: 'transfer' }
];

export const tasks = [
  { code: 'RB',  label: '4 factures en attente de rapprochement',     hint: 'Liberté 6 · Almadies',     action: 'Rapprocher' },
  { code: 'CMD', label: '12 commandes en attente',                    hint: 'À traiter aujourd\'hui',    action: 'Traiter' },
  { code: 'INV', label: '3 ruptures de stock',                        hint: 'Plateau · Liberté 6',       action: 'Réapprovisionner' },
  { code: 'INV', label: 'Inventaire mensuel · Almadies',              hint: '64% complété',              action: 'Reprendre' },
  { code: 'CR',  label: '8 créances à relancer',                      hint: 'Total: 284 K FCFA',         action: 'Relancer' }
];

export const analyticsKPIs = {
  ca: 3_030_000,    caDelta: '+12%',
  margin: 28,       marginDelta: '+1pt',
  cart: 10670,      cartDelta: '+4%',
  orders: 284,      ordersDelta: '+8',
  activeClients: 142, clientsDelta: '+22'
};

export const topShops = [
  { name: 'Plateau',   pct: 31 },
  { name: 'Almadies',  pct: 27 },
  { name: 'Yoff',      pct: 22 },
  { name: 'Liberté 6', pct: 13 },
  { name: 'Pikine',    pct: 7 }
];

export const topProducts = [
  { name: 'Riz parfumé 25kg', pct: 24 },
  { name: 'Huile soja 5L',    pct: 18 },
  { name: 'Sucre 50kg',       pct: 15 },
  { name: 'Lait poudre',      pct: 11 },
  { name: 'Pâtes 500g',       pct: 9 },
  { name: 'Café 200g',        pct: 7 }
];

export const stockHealth = { good: 62, low: 26, out: 12, totalFcfa: 14_800_000 };

export const orders = [
  { id: '#2847', date: '14:32', client: 'Mamadou Sow',    phone: '+221 77 432 18 90', shop: 'Plateau',  qty: 2,  total: 49_400, status: 'préparée' },
  { id: '#2846', date: '14:28', client: 'A. Ndiaye',      phone: '+221 76 218 99 41', shop: 'Almadies', qty: 5,  total: 19_800, status: 'attente' },
  { id: '#2845', date: '13:55', client: 'Coumba & Co',    phone: '+221 33 821 44 12', shop: 'Plateau',  qty: 12, total: 184_000, status: 'livrée' },
  { id: '#2844', date: '13:41', client: 'Boulang. Sandaga',phone: '+221 33 822 76 50',shop: 'Yoff',     qty: 7,  total: 78_500, status: 'livrée' },
  { id: '#2843', date: '12:12', client: 'Fatou Ba',       phone: '+221 78 981 23 45', shop: 'Almadies', qty: 1,  total: 8_400,  status: 'annulée' },
  { id: '#2842', date: '11:47', client: 'O. Diop',        phone: '+221 77 654 32 18', shop: 'Plateau',  qty: 3,  total: 24_600, status: 'livrée' },
  { id: '#2841', date: '10:08', client: 'Marché Tilène',  phone: '+221 33 845 66 21', shop: 'Plateau',  qty: 18, total: 218_000, status: 'préparée' },
  { id: '#2840', date: '09:32', client: 'A. Fall',        phone: '+221 76 543 21 89', shop: 'Liberté 6',qty: 2,  total: 14_500, status: 'attente' }
];

export const orderKPIs = {
  today: 32,
  todayDelta: '+5%',
  pending: 12,
  pendingDelta: 'à < 24h',
  prepared: 8,
  preparedDelta: 'à livrer',
  caToday: 184_000,
  caTodayDelta: 'FCFA'
};

export const clientKPIs = {
  total: 142,
  totalDelta: '+22 ce mois',
  active30: 98,
  active30Pct: 69,
  cart: 10_670,
  cartLabel: 'FCFA · tous clients',
  debt: 284_000,
  debtClients: 8
};

// Client history (for fiche)
export const clientHistory = [
  { date: '28 AVR 2026', items: [
    { time: '14:32', kind: 'order',   id: '#2847', label: 'Riz 25kg ×4 · Sucre 50kg ×1', total: 184_000, status: 'préparée' },
    { time: '13:08', kind: 'invoice', id: '#F-219', label: 'Facture · règlement comptant', total: 184_000, status: 'payée' }
  ]},
  { date: '26 AVR 2026', items: [
    { time: '16:34', kind: 'order',   id: '#2811', label: 'Lait poudre ×3 · Café arab ×2', total: 78_000, status: 'livrée' },
    { time: '08:47', kind: 'invoice', id: '#F-208', label: 'Facture · 30 jours',           total: 142_000, status: 'payée' }
  ]},
  { date: '24 AVR 2026', items: [
    { time: '09:47', kind: 'order',   id: '#2792', label: 'Riz 25kg ×4 · Huile 5L ×6',      total: 142_000, status: 'livrée' }
  ]},
  { date: '21 AVR 2026', items: [
    { time: '15:22', kind: 'order',   id: '#2761', label: 'Sucre 50kg ×2 · Café 200g ×8',   total: 67_000,  status: 'livrée' }
  ]}
];

export const inventory = {
  shop: 'Almadies',
  progress: 64,
  total: 280,
  done: 178,
  remaining: 102,
  ecartTotal: -42_800,
  rows: [
    { p: 'Riz parfumé 25kg',  expected: 24, counted: 24, ecart: 0,  status: 'ok' },
    { p: 'Huile soja 5L',     expected: 14, counted: 11, ecart: -3, status: 'justify' },
    { p: 'Sucre cristal 50kg',expected: 30, counted: 31, ecart: 1,  status: 'over' },
    { p: 'Lait poudre 900g',  expected: 12, counted: 13, ecart: 1,  status: 'over' },
    { p: 'Café arabica 200g', expected: 49, counted: 49, ecart: 0,  status: 'ok' },
    { p: 'Pâtes spaghetti',   expected: 72, counted: 75, ecart: 3,  status: 'over' },
    { p: 'Tomate concentrée', expected: 28, counted: 28, ecart: 0,  status: 'ok' },
    { p: 'Sucre poudre 1kg',  expected: 8,  counted: 0,  ecart: -8, status: 'justify' }
  ],
  toJustify: 4,
  suppliers: ['SAR Sénégal', 'GMS Dakar', 'CSS', 'Patisen']
};

export const invoices = [
  { id: '#F-219', date: '28 AVR', client: 'Coumba & Co',     total: 184_000, due: 'comptant', status: 'payée' },
  { id: '#F-218', date: '28 AVR', client: 'Mamadou Sow',     total: 49_400,  due: 'comptant', status: 'payée' },
  { id: '#F-217', date: '27 AVR', client: 'Marché Tilène',   total: 218_000, due: '30 jours', status: 'attente' },
  { id: '#F-216', date: '26 AVR', client: 'Boulang. Sandaga',total: 142_000, due: '15 jours', status: 'payée' },
  { id: '#F-215', date: '24 AVR', client: 'O. Diop',         total: 24_600,  due: 'comptant', status: 'payée' },
  { id: '#F-214', date: '22 AVR', client: 'A. Ndiaye',       total: 19_800,  due: '30 jours', status: 'retard' },
  { id: '#F-213', date: '20 AVR', client: 'Fatou Ba',        total: 8_400,   due: 'comptant', status: 'payée' },
  { id: '#F-212', date: '18 AVR', client: 'A. Fall',         total: 47_000,  due: '15 jours', status: 'attente' },
  { id: '#F-211', date: '15 AVR', client: 'Coumba & Co',     total: 312_000, due: '30 jours', status: 'retard' }
];

export const invoiceKPIs = {
  total: 1_004_200,
  paid: 685_400,
  pending: 265_000,
  overdue: 53_800
};
