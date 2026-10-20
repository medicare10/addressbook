import { useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import AuthLayout from '../components/AuthLayout.jsx'
import { isEmail, passwordScore, STRENGTH_LABELS } from '../lib/validation.js'
import { signup } from '../lib/api.js'
import { useAuth } from '../context/AuthContext.jsx'

const EMPTY = { name: '', email: '', password: '', confirm: '', terms: false }

export default function Signup() {
  const [values, setValues] = useState(EMPTY)
  const [errors, setErrors] = useState({})
  const [reveal, setReveal] = useState(false)
  const [pending, setPending] = useState(false)
  const [status, setStatus] = useState(null)
  const formRef = useRef(null)
  const { setSession } = useAuth()
  const navigate = useNavigate()

  const score = useMemo(() => passwordScore(values.password), [values.password])

  function update(key, value) {
    setValues((prev) => ({ ...prev, [key]: value }))
    setErrors((prev) => (prev[key] ? { ...prev, [key]: undefined } : prev))
    setStatus(null)
  }

  function validate() {
    const next = {}
    const name = values.name.trim()

    if (!name) next.name = 'Tell us what to put on your cards'
    else if (name.length < 2) next.name = 'Name must be at least 2 characters'

    if (!values.email.trim()) next.email = 'Email is required'
    else if (!isEmail(values.email)) next.email = 'Enter a valid email address'

    if (!values.password) next.password = 'Choose a password'
    else if (values.password.length < 8) next.password = 'Use at least 8 characters'

    if (!values.confirm) next.confirm = 'Confirm your password'
    else if (values.confirm !== values.password) next.confirm = 'Passwords do not match'

    if (!values.terms) next.terms = 'Please accept the terms to continue'

    return next
  }

  function handleSubmit(event) {
    event.preventDefault()
    const next = validate()
    setErrors(next)

    const keys = Object.keys(next)
    if (keys.length) {
      setStatus({
        tone: 'error',
        text:
          keys[0] === 'terms'
            ? 'Accept the terms to open your drawer.'
            : 'Check the highlighted fields and try again.',
      })
      formRef.current?.querySelector(`[name="${keys[0]}"]`)?.focus()
      return
    }

    setPending(true)
    setStatus(null)
    signup({
      name: values.name.trim(),
      email: values.email.trim(),
      password: values.password,
    })
      .then((data) => {
        setSession(data)
        navigate('/', { replace: true })
      })
      .catch((err) => {
        setPending(false)
        setStatus({ tone: 'error', text: err.message })
      })
  }

  return (
    <AuthLayout
      eyebrow="Open a drawer"
      title={
        <>
          Start your
          <br />
          own <em>index.</em>
        </>
      }
      lede="One drawer per person: numbers, notes, the last time you spoke. Set it up in under a minute."
      footer={
        <>
          Already have a drawer? <Link to="/login">Sign in instead</Link>
        </>
      }
    >
      <header className="auth-head">
        <p className="kicker">Create account</p>
        <h2>Get started.</h2>
        <p className="sub">Free while the pilot runs. No card required.</p>
      </header>

      <div className="auth-form">
        <form ref={formRef} onSubmit={handleSubmit} noValidate>
          <div className="field">
            <div className="field-label">
              <label htmlFor="signup-name">Full name</label>
            </div>
            <span className="control">
              <input
                id="signup-name"
                name="name"
                type="text"
                autoComplete="name"
                placeholder="Rosa Adler"
                value={values.name}
                onChange={(e) => update('name', e.target.value)}
                aria-invalid={errors.name ? 'true' : undefined}
                aria-describedby={errors.name ? 'signup-name-error' : undefined}
              />
            </span>
            {errors.name && (
              <p className="field-error" id="signup-name-error">
                {errors.name}
              </p>
            )}
          </div>

          <div className="field">
            <div className="field-label">
              <label htmlFor="signup-email">Email</label>
            </div>
            <span className="control">
              <input
                id="signup-email"
                name="email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                value={values.email}
                onChange={(e) => update('email', e.target.value)}
                aria-invalid={errors.email ? 'true' : undefined}
                aria-describedby={errors.email ? 'signup-email-error' : undefined}
              />
            </span>
            {errors.email && (
              <p className="field-error" id="signup-email-error">
                {errors.email}
              </p>
            )}
          </div>

          <div className="field">
            <div className="field-label">
              <label htmlFor="signup-password">Password</label>
            </div>
            <span className="control has-toggle">
              <input
                id="signup-password"
                name="password"
                type={reveal ? 'text' : 'password'}
                autoComplete="new-password"
                placeholder="At least 8 characters"
                value={values.password}
                onChange={(e) => update('password', e.target.value)}
                aria-invalid={errors.password ? 'true' : undefined}
                aria-describedby={
                  errors.password ? 'signup-password-error' : 'signup-strength'
                }
              />
              <button
                type="button"
                className="reveal"
                onClick={() => setReveal((v) => !v)}
                aria-pressed={reveal}
              >
                {reveal ? 'Hide' : 'Show'}
              </button>
            </span>

            <div className="strength" id="signup-strength" aria-live="polite">
              <div className="strength-bars">
                {[1, 2, 3, 4].map((step) => (
                  <span
                    key={step}
                    data-on={score >= step ? 'true' : 'false'}
                    data-level={score}
                  />
                ))}
              </div>
              <p className="strength-note">
                <span>
                  Strength:{' '}
                  <b>{values.password ? STRENGTH_LABELS[score] : '—'}</b>
                </span>
                <span>8+ characters, mixed case, a number</span>
              </p>
            </div>

            {errors.password && (
              <p className="field-error" id="signup-password-error">
                {errors.password}
              </p>
            )}
          </div>

          <div className="field">
            <div className="field-label">
              <label htmlFor="signup-confirm">Confirm password</label>
            </div>
            <span className="control">
              <input
                id="signup-confirm"
                name="confirm"
                type={reveal ? 'text' : 'password'}
                autoComplete="new-password"
                placeholder="Type it again"
                value={values.confirm}
                onChange={(e) => update('confirm', e.target.value)}
                aria-invalid={errors.confirm ? 'true' : undefined}
                aria-describedby={errors.confirm ? 'signup-confirm-error' : undefined}
              />
            </span>
            {errors.confirm && (
              <p className="field-error" id="signup-confirm-error">
                {errors.confirm}
              </p>
            )}
          </div>

          <div className="options">
            <label className="check">
              <input
                type="checkbox"
                name="terms"
                checked={values.terms}
                onChange={(e) => update('terms', e.target.checked)}
                aria-invalid={errors.terms ? 'true' : undefined}
                aria-describedby={errors.terms ? 'signup-terms-error' : undefined}
              />
              <span>
                I agree to the <a href="#terms">Terms</a> and{' '}
                <a href="#privacy">Privacy Policy</a>.
              </span>
            </label>
          </div>
          {errors.terms && (
            <p className="field-error" id="signup-terms-error">
              {errors.terms}
            </p>
          )}

          {status && (
            <p className="status" data-tone={status.tone} role="status">
              {status.text}
            </p>
          )}

          <button className="btn" type="submit" disabled={pending}>
            {pending && <span className="spinner" aria-hidden="true" />}
            {pending ? 'Opening drawer' : 'Create account'}
          </button>

          <p className="form-note">Your account is stored securely in MongoDB.</p>
        </form>
      </div>
    </AuthLayout>
  )
}
