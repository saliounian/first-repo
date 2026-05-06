/**
 * gestCopta — central data store
 * All initial values are EMPTY — user fills data through the UI.
 */

export const KEYS = {
  shops:       'gc_shops',
  products:    'gc_products',
  stockPoints: 'gc_stock_points',
  stockByPoint:'gc_stock_by_point',
  clients:     'gc_clients',
  orders:      'gc_orders',
  invoices:    'gc_invoices',
  transfers:   'gc_transfers',
  categories:  'gc_categories',   // user-defined product categories
};

export const INIT = {
  shops:        [],
  products:     [],
  stockPoints:  [],
  stockByPoint: {},
  clients:      [],
  orders:       [],
  invoices:     [],
  transfers:    [],
  categories:   [],               // empty — user adds their own
};

export const SHOP_COLORS = [
  '#0D5C2E','#1E7A3E','#3D8253','#6FA681','#9CA8A0',
  '#1A6B8A','#2E86AB','#A23B72','#F18F01','#C73E1D',
];

export const ORDER_STATUSES  = ['attente','préparée','livrée','annulée'];
export const INVOICE_STATUSES = ['attente','payée'];
export const CLIENT_TYPES    = ['régulier','pro','nouveau'];

export function uid() {
  return Math.random().toString(36).slice(2, 10);
}
