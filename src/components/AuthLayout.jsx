import { Link } from 'react-router-dom'
import '../Auth.css'

function CardStack() {
  return (
    <div className="cardstack" aria-hidden="true">
      <div className="index-card card-back">
        <span className="card-tab">C</span>
        <span className="card-rule" />
        <span className="card-rule" />
        <span className="card-rule" />
      </div>
      <div className="index-card card-mid">
        <span className="card-tab">B</span>
        <span className="card-rule" />
        <span className="card-rule" />
        <span className="card-rule" />
      </div>
      <div className="index-card card-front">
        <span className="card-tab">A</span>
        <span className="card-punch" />
        <span className="card-rule" />
        <span className="card-rule" />
        <span className="card-rule" />
        <span className="card-rule short" />
        <span className="card-name">Adler, Rosa</span>
        <span className="card-meta">14 Cider Lane · 555 0134</span>
      </div>
    </div>
  )
}

export default function AuthLayout({ eyebrow, title, lede, children, footer }) {
  return (
    <div className="auth">
      <aside className="auth-brand">
        <Link to="/login" className="wordmark">
          <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
            <path
              d="M4 3.5h13.5a2 2 0 0 1 2 2v13a2 2 0 0 1-2 2H4z"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
            />
            <path d="M4 7.5h15.5M4 11.5h15.5M4 15.5h15.5" stroke="currentColor" strokeWidth="1.1" opacity=".5" />
            <circle cx="7.5" cy="3.5" r="1.6" fill="currentColor" />
          </svg>
          Addressbook
        </Link>

        <div className="auth-copy">
          <p className="eyebrow">{eyebrow}</p>
          <h1>{title}</h1>
          <p className="lede">{lede}</p>
        </div>

        <CardStack />

        <p className="brand-foot">
          <span>Est. 2026</span>
          <span className="dot" />
          <span>Card index no. 001</span>
        </p>
      </aside>

      <main className="auth-panel">
        <div className="auth-form-wrap">
          <div className="auth-form">{children}</div>
          <p className="auth-switch">{footer}</p>
        </div>
      </main>
    </div>
  )
}
