const API_PREFIX = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '')

/** Public file path from API (e.g. /uploads/avatars/...) → full URL for <img src>. */
export function assetUrl(relativePath, cacheBust) {
  if (!relativePath) return null
  if (String(relativePath).startsWith('http')) return relativePath
  const base = `${API_PREFIX}${relativePath}`
  if (cacheBust == null || cacheBust === '') return base
  const v =
    typeof cacheBust === 'number' ? cacheBust : new Date(cacheBust).getTime()
  if (Number.isNaN(v)) return base
  return `${base}${base.includes('?') ? '&' : '?'}v=${v}`
}

function buildUrl(path) {
  if (!path.startsWith('/')) return `${API_PREFIX}/${path}`
  return `${API_PREFIX}${path}`
}

function getToken() {
  return localStorage.getItem('token')
}

export function setToken(token) {
  if (token) localStorage.setItem('token', token)
  else localStorage.removeItem('token')
}

export async function api(path, options = {}) {
  const headers = { ...options.headers }
  const hasBody = options.body != null && options.body !== ''
  const isFormData =
    typeof FormData !== 'undefined' && options.body instanceof FormData
  if (hasBody && !headers['Content-Type'] && !isFormData) {
    headers['Content-Type'] = 'application/json'
  }
  const token = getToken()
  if (token) headers.Authorization = `Bearer ${token}`

  const res = await fetch(buildUrl(path), { ...options, headers })

  if (res.status === 204) return null

  const ct = res.headers.get('content-type') || ''
  const data = ct.includes('application/json') ? await res.json() : await res.text()

  if (!res.ok) {
    let msg = typeof data === 'object' && data?.message ? data.message : null
    if (!msg && typeof data === 'object' && Array.isArray(data?.errors) && data.errors.length) {
      msg = data.errors
        .map((e) => (typeof e === 'string' ? e : e.msg || e.message || ''))
        .filter(Boolean)
        .join('; ')
    }
    const err = new Error(msg || 'Request failed')
    err.status = res.status
    err.data = data
    throw err
  }

  return data
}

export const authApi = {
  login: (email, password) =>
    api('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),
  register: (name, email, password) =>
    api('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password }),
    }),
  me: () => api('/api/auth/me'),
  uploadAvatar: (file) => {
    const fd = new FormData()
    fd.append('photo', file)
    return api('/api/auth/avatar', { method: 'POST', body: fd })
  },
  deleteAvatar: () => api('/api/auth/avatar', { method: 'DELETE' }),
}

export const loansApi = {
  list: (params = {}) => {
    const q = new URLSearchParams()
    if (params.status) q.set('status', params.status)
    const s = q.toString()
    return api(`/api/loans${s ? `?${s}` : ''}`)
  },
  summary: () => api('/api/loans/stats/summary'),
  create: (body) => api('/api/loans', { method: 'POST', body: JSON.stringify(body) }),
  update: (id, body) => api(`/api/loans/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  remove: (id) => api(`/api/loans/${id}`, { method: 'DELETE' }),
}

export const transactionsApi = {
  list: (params = {}) => {
    const q = new URLSearchParams()
    Object.entries(params).forEach(([k, v]) => {
      if (v != null && v !== '') q.set(k, String(v))
    })
    const s = q.toString()
    return api(`/api/transactions${s ? `?${s}` : ''}`)
  },
  create: (body) =>
    api('/api/transactions', { method: 'POST', body: JSON.stringify(body) }),
  remove: (id) => api(`/api/transactions/${id}`, { method: 'DELETE' }),
  summary: () => api('/api/transactions/stats/summary'),
  timeseries: (params = {}) => {
    const q = new URLSearchParams()
    Object.entries(params).forEach(([k, v]) => {
      if (v != null && v !== '') q.set(k, String(v))
    })
    const s = q.toString()
    return api(`/api/transactions/stats/timeseries${s ? `?${s}` : ''}`)
  },
}
