import { useEffect, useState, type FormEvent } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useStore } from '../lib/store'

const NAV = [
  { to: '/', label: 'Home', end: true },
  { to: '/services', label: 'Services' },
  { to: '/loans', label: 'Loans' },
  { to: '/sip', label: 'SIP' },
  { to: '/funds', label: 'Mutual funds' },
  { to: '/trading', label: 'Trading' },
  { to: '/blog', label: 'Blog' },
  { to: '/about', label: 'About' },
  { to: '/contact', label: 'Contact' },
]

export default function Layout() {
  const { db, me, signOut, notify } = useStore()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
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

  return (
    <>
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <header className="site-header">
        <div className="header-inner">
          <Link className="brand" to="/">
            <span className="brand-mark">
              {site.logo ? <img src={site.logo} alt="" /> : site.letter}
            </span>
            <span className="brand-name">{site.name}</span>
          </Link>

          <button
            className="menu-toggle"
            type="button"
            aria-expanded={open}
            aria-label="Toggle navigation"
            onClick={() => setOpen((value) => !value)}
          >
            {open ? '✕' : '☰'}
          </button>

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
                <Link className="btn btn-sm" to="/register">
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      <main id="main" className="container">
        <Outlet />
      </main>

      <footer className="site-footer">
        <div className="footer-inner">
          <p>
            <strong>{site.name}</strong>
          </p>
          <p>
            {site.addr} · {site.phone} · {site.email}
          </p>
          <p className="footer-links">
            <Link to="/admin">Admin</Link>
            <Link to="/contact">Contact</Link>
          </p>
          <p className="muted small">
            Demo website. Services shown are planned and depend on partner and regulatory approvals.
          </p>
        </div>
      </footer>
    </>
  )
}
