// Generic API helper for Salih Holding backend (cookies-based auth)

async function req(method, path, body) {
  const res = await fetch(`/api${path}`, {
    method,
    credentials: 'include',
    headers: body ? { 'Content-Type': 'application/json' } : {},
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    let err;
    try { err = (await res.json()).error; } catch {}
    throw new Error(err || `${method} ${path} failed (${res.status})`);
  }
  // Some endpoints return empty body
  const ct = res.headers.get('content-type') || '';
  if (!ct.includes('application/json')) return null;
  return res.json();
}

export const api = {
  get:    (p)    => req('GET',    p),
  post:   (p, b) => req('POST',   p, b),
  put:    (p, b) => req('PUT',    p, b),
  patch:  (p, b) => req('PATCH',  p, b),
  delete: (p)    => req('DELETE', p),
};

// Entity-specific helpers (server-backed)
export const dataApi = {
  list:   (entity)            => api.get(`/data/${entity}`),
  upsert: (entity, item)      => api.post(`/data/${entity}`, item),
  update: (entity, id, item)  => api.put(`/data/${entity}/${id}`, item),
  remove: (entity, id)        => api.delete(`/data/${entity}/${id}`),
  // Stock
  getStock:    ()              => api.get(`/data/stock`),
  putStock:    (map)           => api.put(`/data/stock`, map),
  setStockCell:(productId, pointId, qty) => api.patch(`/data/stock/cell`, { productId, pointId, qty }),
};
