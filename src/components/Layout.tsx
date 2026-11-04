import { useEffect, useState, type FormEvent } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useStore } from '../lib/store'

const NAV = [
  { to: '/', label: 'Home', end: true },
  { to: '/services', label: 'Services' },
  { to: '/loans', label: 'Loans' },
  { to: '/sip', label: 'SIP' },
  { to: '/funds', label: 'Funds' },
  { to: '/trading', label: 'Trading' },
  { to: '/blog', label: 'Insights' },
  { to: '/about', label: 'About' },
  { to: '/contact', label: 'Contact' },
]

const FOOTER_PRODUCTS = [
  { to: '/services', label: 'Bills & recharges' },
  { to: '/loans', label: 'Loans & EMI' },
  { to: '/sip', label: 'SIP calculator' },
  { to: '/funds', label: 'Mutual funds' },
  { to: '/trading', label: 'Trading & demat' },
]

const FOOTER_COMPANY = [
  { to: '/about', label: 'About us' },
  { to: '/blog', label: 'Insights' },
  { to: '/contact', label: 'Contact' },
  { to: '/notifications', label: 'Notifications' },
  { to: '/admin', label: 'Admin panel' },
]

export default function Layout() {
  const { db, me, signOut, notify } = useStore()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [email, setEmail] = useState('')
  const navigate = useNavigate()
  const location = useLocation()
  const site = db.site

  useEffect(() => {
    setOpen(false)
    window.scrollTo({ top: 0 })
  }, [location.pathname])

  function search(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const term = query.trim()
    if (!term) return
    navigate(`/search/${encodeURIComponent(term)}`)
    setQuery('')
  }

  function subscribe(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      notify('Enter a valid email address')
      return
    }
    notify('Subscribed to the letter (demo)')
    setEmail('')
  }

  return (
    <>
      <a className="skip-link" href="#main">
        Skip to content
      </a>

      <div className="topbar">
        <div className="topbar-inner">
          <span className="dot" aria-hidden />
          <span>New: one dashboard for every bill, EMI and SIP.</span>
          <Link to="/loans">See how it works</Link>
        </div>
      </div>

      <header className="site-header">
        <div className="header-inner">
          <Link className="brand" to="/">
            <span className="brand-mark">
              {site.logo ? <img src={site.logo} alt="" /> : site.letter}
            </span>
            <span className="brand-text">
              <span className="brand-name">{site.name}</span>
              <span className="brand-sub">Wealth &amp; Lending</span>
            </span>
          </Link>

          <nav className={`main-nav${open ? ' open' : ''}`} aria-label="Main">
            {NAV.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="header-actions">
            <form className="search-form" onSubmit={search} role="search">
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search"
                aria-label="Search services, loans and posts"
              />
            </form>

            <Link className="bell" to="/notifications" aria-label={`Notifications (${db.notes.length})`}>
              🔔
              {db.notes.length > 0 && <span className="badge">{db.notes.length}</span>}
            </Link>

            {me ? (
              <div className="user-area">
                <span className="greeting">Hi, {me.name.split(' ')[0]}</span>
                <button
                  className="link-btn"
                  type="button"
                  onClick={() => {
                    signOut()
                    notify('You are logged out')
                  }}
                >
                  Logout
                </button>
              </div>
            ) : (
              <div className="auth-links">
                <Link className="nav-link" to="/login">
                  Login
                </Link>
                <Link className="btn btn-sm btn-gold" to="/register">
                  Open account
                </Link>
              </div>
            )}
          </div>

          <button
            className="menu-toggle"
            type="button"
            aria-expanded={open}
            aria-label="Toggle navigation"
            onClick={() => setOpen((value) => !value)}
          >
            {open ? '✕' : '☰'}
          </button>
        </div>
      </header>

      <main id="main" className="container">
        <Outlet />
      </main>

      <footer className="site-footer">
        <div className="footer-inner">
          <div className="footer-grid">
            <div>
              <div className="foot-brand">
                <span className="brand-mark">{site.letter}</span>
                <b>{site.name}</b>
              </div>
              <p>{site.tag}</p>
              <p>
                {site.addr}
                <br />
                {site.phone} · {site.email}
              </p>
              <p>
                <Link className="footer-cta" to="/contact">
                  Talk to an advisor →
                </Link>
              </p>
            </div>

            <div className="footer-col">
              <h4>Products</h4>
              {FOOTER_PRODUCTS.map((item) => (
                <Link key={item.to} to={item.to}>
                  {item.label}
                </Link>
              ))}
            </div>

            <div className="footer-col">
              <h4>Company</h4>
              {FOOTER_COMPANY.map((item) => (
                <Link key={item.to} to={item.to}>
                  {item.label}
                </Link>
              ))}
            </div>

            <div>
              <h4>The monthly letter</h4>
              <p>One email a month on borrowing, saving and the markets. No noise.</p>
              <form className="news" onSubmit={subscribe}>
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="you@email.com"
                  aria-label="Email address"
                />
                <button className="btn" type="submit">
                  Join
                </button>
              </form>
              <p className="small muted" style={{ marginTop: 10 }}>
                Demo form — nothing is sent or stored on a server.
              </p>
            </div>
          </div>

          <div className="footer-bottom">
            <span>© {new Date().getFullYear()} {site.name}. All rights reserved.</span>
            <span className="footer-links">
              <Link to="/about">About</Link>
              <Link to="/contact">Support</Link>
              <Link to="/admin">Admin</Link>
            </span>
            <span>Demo build — services shown depend on partner and regulatory approvals.</span>
          </div>
        </div>
      </footer>
    </>
  )
}
