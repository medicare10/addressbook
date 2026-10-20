const API_BASE = '/api'

function extractError(payload, fallback) {
  return payload && typeof payload.error === 'string' ? payload.error : fallback
}

async function request(path, { method = 'GET', body, token } = {}) {
  const headers = {}
  if (body !== undefined) headers['Content-Type'] = 'application/json'
  if (token) headers.Authorization = `Bearer ${token}`

  let res
  try {
    res = await fetch(`${API_BASE}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    })
  } catch {
    throw new Error('Could not reach the server. Is the API running?')
  }

  let payload = null
  try {
    payload = await res.json()
  } catch {
    /* non-JSON response */
  }

  if (!res.ok) {
    throw new Error(extractError(payload, `Request failed (${res.status})`))
  }
  return payload
}

export function signup({ name, email, password }) {
  return request('/auth/signup', { method: 'POST', body: { name, email, password } })
}

export function login({ email, password }) {
  return request('/auth/login', { method: 'POST', body: { email, password } })
}

export function listContacts(token, { q = '' } = {}) {
  const params = new URLSearchParams()
  if (q) params.set('q', q)
  const qs = params.toString()
  return request(`/contacts${qs ? `?${qs}` : ''}`, { token })
}

export function updateContact(token, id, patch) {
  return request(`/contacts/${id}`, { method: 'PATCH', body: patch, token })
}

export function deleteContact(token, id) {
  return request(`/contacts/${id}`, { method: 'DELETE', token })
}

export function createContact(token, body) {
  return request('/contacts', { method: 'POST', body, token })
}
