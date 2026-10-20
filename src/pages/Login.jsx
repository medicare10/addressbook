import { useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import AuthLayout from '../components/AuthLayout.jsx'
import { isEmail } from '../lib/validation.js'
import { login } from '../lib/api.js'
import { useAuth } from '../context/AuthContext.jsx'

const EMPTY = { email: '', password: '' }

export default function Login() {
  const [values, setValues] = useState(EMPTY)
  const [errors, setErrors] = useState({})
  const [reveal, setReveal] = useState(false)
  const [pending, setPending] = useState(false)
  const [status, setStatus] = useState(null)
  const formRef = useRef(null)
  const { setSession } = useAuth()
  const navigate = useNavigate()

  function update(key, value) {
    setValues((prev) => ({ ...prev, [key]: value }))
    setErrors((prev) => (prev[key] ? { ...prev, [key]: undefined } : prev))
    setStatus(null)
  }

  function validate() {
    const next = {}
    if (!values.email.trim()) next.email = 'Email is required'
    else if (!isEmail(values.email)) next.email = 'Enter a valid email address'
    if (!values.password) next.password = 'Password is required'
    return next
  }

  function handleSubmit(event) {
    event.preventDefault()
    const next = validate()
    setErrors(next)

    const keys = Object.keys(next)
    if (keys.length) {
      setStatus({ tone: 'error', text: 'Check the highlighted fields and try again.' })
      formRef.current?.querySelector(`[name="${keys[0]}"]`)?.focus()
      return
    }

    setPending(true)
    setStatus(null)
    login({ email: values.email.trim(), password: values.password })
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
      eyebrow="Members' entrance"
      title={
        <>
          Every name,
          <br />
          filed in <em>its place.</em>
        </>
      }
      lede="The card index for the people you actually keep in touch with. Sign in to pull your drawer."
      footer={
        <>
          New to the index? <Link to="/signup">Create an account</Link>
        </>
      }
    >
      <header className="auth-head">
        <p className="kicker">Sign in</p>
        <h2>Welcome back.</h2>
        <p className="sub">Use the email you registered the drawer with.</p>
      </header>

      <div className="auth-form">
        <form ref={formRef} onSubmit={handleSubmit} noValidate>
          <div className="field">
            <div className="field-label">
              <label htmlFor="login-email">Email</label>
            </div>
            <span className="control">
              <input
                id="login-email"
                name="email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                value={values.email}
                onChange={(e) => update('email', e.target.value)}
                aria-invalid={errors.email ? 'true' : undefined}
                aria-describedby={errors.email ? 'login-email-error' : undefined}
              />
            </span>
            {errors.email && (
              <p className="field-error" id="login-email-error">
                {errors.email}
              </p>
            )}
          </div>

          <div className="field">
            <div className="field-label">
              <label htmlFor="login-password">Password</label>
              <a className="aside-link" href="#forgot">
                Forgot?
              </a>
            </div>
            <span className="control has-toggle">
              <input
                id="login-password"
                name="password"
                type={reveal ? 'text' : 'password'}
                autoComplete="current-password"
                placeholder="••••••••"
                value={values.password}
                onChange={(e) => update('password', e.target.value)}
                aria-invalid={errors.password ? 'true' : undefined}
                aria-describedby={errors.password ? 'login-password-error' : undefined}
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
            {errors.password && (
              <p className="field-error" id="login-password-error">
                {errors.password}
              </p>
            )}
          </div>

          <div className="options">
            <label className="check">
              <input type="checkbox" name="remember" defaultChecked />
              <span>Keep me signed in on this device</span>
            </label>
          </div>

          {status && (
            <p className="status" data-tone={status.tone} role="status">
              {status.text}
            </p>
          )}

          <button className="btn" type="submit" disabled={pending}>
            {pending && <span className="spinner" aria-hidden="true" />}
            {pending ? 'Signing in' : 'Sign in'}
          </button>

          <p className="form-note">
            Your account is stored securely in MongoDB.
          </p>
        </form>
      </div>
    </AuthLayout>
  )
}
