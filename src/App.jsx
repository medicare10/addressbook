import { useEffect, useMemo, useRef, useState } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { useAuth } from './context/AuthContext.jsx'
import useDebounce from './hooks/useDebounce.js'
import {
  createContact,
  deleteContact,
  listContacts,
  updateContact,
} from './lib/api.js'
import Login from './pages/Login.jsx'
import Signup from './pages/Signup.jsx'
import './Home.css'

function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuth()
  if (!isAuthenticated) return <Navigate to="/login" replace />
  return children
}

const NO_MATCHES = 'No names match that search.'

function mapHrefFor(contact) {
  if (contact.mapLink) return contact.mapLink
  if (contact.address) {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
      contact.address,
    )}`
  }
  return null
}

const EMPTY_FORM = { name: '', phone: '', email: '', address: '', mapLink: '' }

function titleCase(value) {
  if (!value) return ''
  return value
    .toLocaleLowerCase()
    .replace(/(^|[\s'’-])(\p{L})/gu, (_, boundary, letter) => boundary + letter.toLocaleUpperCase())
}

function DetailCard({ contact, token, onClose, onUpdated, onDeleted }) {
  const closeRef = useRef(null)
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({
    address: contact.address || '',
    mapLink: contact.mapLink || '',
  })
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState(null)
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    closeRef.current?.focus()
  }, [])

  useEffect(() => {
    function onKey(event) {
      if (event.key !== 'Escape') return
      if (confirmingDelete) {
        setConfirmingDelete(false)
      } else if (editing) {
        setEditing(false)
        setFormError(null)
      } else {
        onClose()
      }
    }

    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [editing, confirmingDelete, onClose])

  function startEdit() {
    setForm({ address: contact.address || '', mapLink: contact.mapLink || '' })
    setFormError(null)
    setConfirmingDelete(false)
    setEditing(true)
  }

  async function remove() {
    setDeleting(true)
    setFormError(null)

    try {
      await deleteContact(token, contact.id)
      onDeleted(contact.id)
    } catch (err) {
      setFormError(err.message)
      setConfirmingDelete(false)
    } finally {
      setDeleting(false)
    }
  }

  async function save(event) {
    event.preventDefault()
    setSaving(true)
    setFormError(null)

    try {
      const data = await updateContact(token, contact.id, {
        address: form.address,
        mapLink: form.mapLink,
      })
      onUpdated(data.contact)
      setEditing(false)
    } catch (err) {
      setFormError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const mapHref = mapHrefFor(contact)

  return (
    <div
      className="card-overlay"
      role="dialog"
      aria-modal="true"
      aria-label={`Details for ${titleCase(contact.name)}`}
      onClick={onClose}
    >
      <div className="detail-card" onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          ref={closeRef}
          className="card-close"
          aria-label="Close"
          onClick={onClose}
        >
          <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
            <path
              d="M6 6l12 12M18 6L6 18"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </button>
        <span className="card-tab" aria-hidden="true">
          {titleCase(contact.name).charAt(0)}
        </span>
        <h2 className="card-name">{titleCase(contact.name)}</h2>

        {editing ? (
          <form className="card-form" onSubmit={save}>
            {formError && (
              <p className="form-error" role="alert">
                {formError}
              </p>
            )}
            <label className="field">
              <span className="field-label">Address</span>
              <textarea
                rows={2}
                value={form.address}
                placeholder="123 Main St, Springfield"
                onChange={(e) => setForm({ ...form, address: e.target.value })}
              />
            </label>
            <label className="field">
              <span className="field-label">Map link</span>
              <input
                type="url"
                value={form.mapLink}
                placeholder="https://maps.app.goo.gl/…"
                onChange={(e) => setForm({ ...form, mapLink: e.target.value })}
              />
              <span className="field-hint">
                Paste a Google Maps or other map URL for this address.
              </span>
            </label>
            <div className="card-form-actions">
              <button type="submit" className="btn card-save" disabled={saving}>
                {saving ? 'Saving…' : 'Save'}
              </button>
              <button
                type="button"
                className="card-cancel"
                onClick={() => setEditing(false)}
                disabled={saving}
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <>
            <dl className="card-fields">
              <div>
                <dt>Phone</dt>
                <dd>{contact.phone || '—'}</dd>
              </div>
              <div>
                <dt>Email</dt>
                <dd>{contact.email || '—'}</dd>
              </div>
              <div>
                <dt>Address</dt>
                <dd>
                  {contact.address || '—'}
                  {mapHref && (
                    <a
                      className="map-link"
                      href={mapHref}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <svg
                        viewBox="0 0 24 24"
                        width="14"
                        height="14"
                        aria-hidden="true"
                      >
                        <path
                          d="M12 21s7-5.5 7-11a7 7 0 1 0-14 0c0 5.5 7 11 7 11z"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        />
                        <circle
                          cx="12"
                          cy="10"
                          r="2.5"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        />
                      </svg>
                      {contact.mapLink ? 'Open in map' : 'View on map'}
                    </a>
                  )}
                </dd>
              </div>
            </dl>
            <div className="card-actions">
              <button type="button" className="card-edit" onClick={startEdit}>
                Edit address &amp; map link
              </button>

              {confirmingDelete ? (
                <div className="card-delete-confirm" role="alert">
                  <p className="card-delete-text">
                    Delete {titleCase(contact.name)}? This can’t be undone.
                  </p>
                  <div className="card-delete-buttons">
                    <button
                      type="button"
                      className="card-delete-yes"
                      onClick={remove}
                      disabled={deleting}
                    >
                      {deleting ? 'Deleting…' : 'Yes, delete'}
                    </button>
                    <button
                      type="button"
                      className="card-cancel"
                      onClick={() => setConfirmingDelete(false)}
                      disabled={deleting}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  className="card-delete"
                  onClick={() => setConfirmingDelete(true)}
                >
                  Delete contact
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function ContactForm({ token, onClose, onCreated }) {
  const firstRef = useRef(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState(null)

  useEffect(() => {
    firstRef.current?.focus()
  }, [])

  useEffect(() => {
    function onKey(event) {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  function set(field) {
    return (event) => setForm({ ...form, [field]: event.target.value })
  }

  async function submit(event) {
    event.preventDefault()
    if (!form.name.trim()) {
      setFormError('Name is required')
      return
    }

    setSaving(true)
    setFormError(null)

    try {
      const data = await createContact(token, form)
      onCreated(data.contact)
    } catch (err) {
      setFormError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      className="card-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="Add a contact"
      onClick={onClose}
    >
      <div className="detail-card" onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          className="card-close"
          aria-label="Close"
          onClick={onClose}
        >
          <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
            <path
              d="M6 6l12 12M18 6L6 18"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </button>
        <span className="card-tab" aria-hidden="true">
          +
        </span>
        <h2 className="card-name">Add a contact</h2>

        <form className="card-form" onSubmit={submit}>
          {formError && (
            <p className="form-error" role="alert">
              {formError}
            </p>
          )}
          <label className="field">
            <span className="field-label">Name</span>
            <input
              ref={firstRef}
              type="text"
              value={form.name}
              placeholder="Ada Lovelace"
              onChange={set('name')}
            />
          </label>
          <label className="field">
            <span className="field-label">Phone</span>
            <input
              type="tel"
              value={form.phone}
              placeholder="555-0100"
              onChange={set('phone')}
            />
          </label>
          <label className="field">
            <span className="field-label">Email</span>
            <input
              type="email"
              value={form.email}
              placeholder="ada@example.com"
              onChange={set('email')}
            />
          </label>
          <label className="field">
            <span className="field-label">Address</span>
            <textarea
              rows={2}
              value={form.address}
              placeholder="123 Main St, Springfield"
              onChange={set('address')}
            />
          </label>
          <label className="field">
            <span className="field-label">Map link</span>
            <input
              type="url"
              value={form.mapLink}
              placeholder="https://maps.app.goo.gl/…"
              onChange={set('mapLink')}
            />
            <span className="field-hint">
              Paste a Google Maps or other map URL for this address.
            </span>
          </label>
          <div className="card-form-actions">
            <button type="submit" className="btn card-save" disabled={saving}>
              {saving ? 'Saving…' : 'Save'}
            </button>
            <button
              type="button"
              className="card-cancel"
              onClick={onClose}
              disabled={saving}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function Home() {
  const { user, token, signOut } = useAuth()
  const [query, setQuery] = useState('')
  const [result, setResult] = useState({ key: null, contacts: [], error: null })
  const [retryToken, setRetryToken] = useState(0)
  const [selected, setSelected] = useState(null)
  const [adding, setAdding] = useState(false)

  const debouncedQuery = useDebounce(query, 350)
  const trimmedQuery = debouncedQuery.trim()
  const requestKey = `${retryToken}:${trimmedQuery}`

  useEffect(() => {
    let active = true

    listContacts(token, { q: trimmedQuery })
      .then((data) => {
        if (!active) return
        setResult({ key: requestKey, contacts: data.contacts, error: null })
      })
      .catch((err) => {
        if (!active) return
        setResult({ key: requestKey, contacts: [], error: err.message })
      })

    return () => {
      active = false
    }
  }, [token, trimmedQuery, requestKey])

  const sortedContacts = useMemo(
    () =>
      [...result.contacts].sort((a, b) =>
        a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }),
      ),
    [result.contacts],
  )

  const { error } = result
  const contacts = sortedContacts
  const status = result.key === requestKey ? (error ? 'error' : 'ready') : 'loading'
  const isSearching = trimmedQuery.length > 0
  const count = contacts.length

  function handleUpdated(updated) {
    setSelected(updated)
    setResult((prev) => ({
      ...prev,
      contacts: prev.contacts.map((c) => (c.id === updated.id ? updated : c)),
    }))
  }

  function handleCreated(created) {
    setAdding(false)
    setResult((prev) => ({
      ...prev,
      contacts: [...prev.contacts, created],
    }))
  }

  function handleDeleted(id) {
    setSelected(null)
    setResult((prev) => ({
      ...prev,
      contacts: prev.contacts.filter((c) => c.id !== id),
    }))
  }

  const countLabel = useMemo(() => {
    if (status === 'loading') return 'Loading…'
    if (status === 'error') return '—'
    if (isSearching) {
      return count === 1 ? '1 match' : `${count} matches`
    }
    return count === 1 ? '1 name' : `${count} names`
  }, [status, count, isSearching])

  return (
    <div className="home">
      <header className="home-head">
        <p className="kicker">Signed in</p>
        <div className="home-title-row">
          <h1>{user.name}'s book</h1>
          <div className="home-actions">
            <button type="button" className="btn home-add" onClick={() => setAdding(true)}>
              <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
                <path
                  d="M12 5v14M5 12h14"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
              Add contact
            </button>
            <button type="button" className="btn home-signout" onClick={signOut}>
              Sign out
            </button>
          </div>
        </div>
      </header>

      <div className="search">
        <label className="search-label" htmlFor="contact-search">
          Search names
        </label>
        <div className="search-control">
          <svg
            className="search-icon"
            viewBox="0 0 24 24"
            width="18"
            height="18"
            aria-hidden="true"
          >
            <circle cx="11" cy="11" r="7" fill="none" stroke="currentColor" strokeWidth="2" />
            <path d="M20 20l-3.5-3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
          <input
            id="contact-search"
            type="search"
            placeholder="Type a name…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoComplete="off"
          />
          {query && (
            <button
              type="button"
              className="search-clear"
              onClick={() => setQuery('')}
            >
              Clear
            </button>
          )}
        </div>
        <p className="search-count" role="status" aria-live="polite">
          {countLabel}
        </p>
      </div>

      {status === 'loading' && (
        <ul className="contact-list" aria-hidden="true">
          {Array.from({ length: 6 }).map((_, i) => (
            <li className="contact-row skeleton" key={i}>
              <span className="contact-name-skel" />
            </li>
          ))}
        </ul>
      )}

      {status === 'error' && (
        <div className="contact-state error">
          <p>{error}</p>
          <button
            type="button"
            className="btn retry"
            onClick={() => setRetryToken((t) => t + 1)}
          >
            Retry
          </button>
        </div>
      )}

      {status === 'ready' && count === 0 && (
        <div className="contact-state empty">
          <p>{isSearching ? NO_MATCHES : 'Your book is empty.'}</p>
        </div>
      )}

      {status === 'ready' && count > 0 && (
        <ul className="contact-list">
          {contacts.map((contact) => (
            <li key={contact.id}>
              <button
                type="button"
                className="contact-row"
                onClick={() => setSelected(contact)}
              >
                <span className="contact-initial" aria-hidden="true">
                  {titleCase(contact.name).charAt(0)}
                </span>
                <span className="contact-name">{titleCase(contact.name)}</span>
                <svg
                  className="contact-chevron"
                  viewBox="0 0 24 24"
                  width="18"
                  height="18"
                  aria-hidden="true"
                >
                  <path
                    d="M9 6l6 6-6 6"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            </li>
          ))}
        </ul>
      )}

      {selected && (
        <DetailCard
          contact={selected}
          token={token}
          onClose={() => setSelected(null)}
          onUpdated={handleUpdated}
          onDeleted={handleDeleted}
        />
      )}

      {adding && (
        <ContactForm
          token={token}
          onClose={() => setAdding(false)}
          onCreated={handleCreated}
        />
      )}
    </div>
  )
}

function GuestRoute({ children }) {
  const { isAuthenticated } = useAuth()
  if (isAuthenticated) return <Navigate to="/" replace />
  return children
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Home />
            </ProtectedRoute>
          }
        />
        <Route
          path="/login"
          element={
            <GuestRoute>
              <Login />
            </GuestRoute>
          }
        />
        <Route
          path="/signup"
          element={
            <GuestRoute>
              <Signup />
            </GuestRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
