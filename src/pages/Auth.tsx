import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { hashPassword } from '../lib/format'
import { useStore } from '../lib/store'

export function Login() {
  const { db, signIn, notify } = useStore()
  const navigate = useNavigate()
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const user = db.users.find(
      (item) =>
        (item.email.toLowerCase() === identifier.trim().toLowerCase() || item.mobile === identifier.trim()) &&
        item.pw === hashPassword(password),
    )
    if (!user) {
      setError('No account matches these details.')
      return
    }
    setError('')
    signIn(user)
    notify(`Welcome back, ${user.name.split(' ')[0]}`)
    navigate('/')
  }

  return (
    <form className="auth-box" onSubmit={submit} noValidate>
      <h1>Login</h1>
      <p className="muted">Sign in with the mobile number or email you registered with.</p>

      <label className="field">
        Mobile or email
        <input
          value={identifier}
          onChange={(event) => setIdentifier(event.target.value)}
          autoComplete="username"
          required
        />
      </label>
      <label className="field">
        Password
        <input
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          autoComplete="current-password"
          required
        />
      </label>

      <p className="error">{error}</p>
      <button className="btn" type="submit" style={{ width: '100%' }}>
        Login
      </button>
      <p className="muted small" style={{ marginTop: 14 }}>
        New here?{' '}
        <Link className="link-btn" to="/register">
          Create an account
        </Link>
      </p>
    </form>
  )
}

export function Register() {
  const { db, update, signIn, notify } = useStore()
  const navigate = useNavigate()
  const [values, setValues] = useState({ name: '', mobile: '', email: '', pw: '' })
  const [error, setError] = useState('')

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const mobile = values.mobile.trim()
    const email = values.email.trim().toLowerCase()

    if (values.name.trim().length < 2) {
      setError('Please enter your full name.')
      return
    }
    if (!/^\d{10}$/.test(mobile)) {
      setError('Enter a 10-digit mobile number.')
      return
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Enter a valid email address.')
      return
    }
    if (values.pw.length < 6) {
      setError('Password needs 6 or more characters.')
      return
    }
    if (db.users.some((user) => user.mobile === mobile || user.email.toLowerCase() === email)) {
      setError('This mobile or email is already registered.')
      return
    }

    const user = {
      id: `usr_${Date.now().toString(36)}`,
      name: values.name.trim(),
      mobile,
      email,
      pw: hashPassword(values.pw),
    }

    update((draft) => {
      draft.users.push(user)
    })
    setError('')
    signIn(user)
    notify('Account created. Welcome to Tatito.')
    navigate('/')
  }

  return (
    <form className="auth-box" onSubmit={submit} noValidate>
      <h1>Register</h1>
      <p className="muted">Create a demo account to try the request flows.</p>

      <label className="field">
        Full name
        <input
          value={values.name}
          onChange={(event) => setValues({ ...values, name: event.target.value })}
          autoComplete="name"
          required
        />
      </label>
      <label className="field">
        Mobile (10 digits)
        <input
          inputMode="numeric"
          value={values.mobile}
          onChange={(event) => setValues({ ...values, mobile: event.target.value })}
          autoComplete="tel"
          required
        />
      </label>
      <label className="field">
        Email
        <input
          type="email"
          value={values.email}
          onChange={(event) => setValues({ ...values, email: event.target.value })}
          autoComplete="email"
          required
        />
      </label>
      <label className="field">
        Password (6+ characters)
        <input
          type="password"
          value={values.pw}
          onChange={(event) => setValues({ ...values, pw: event.target.value })}
          autoComplete="new-password"
          required
        />
      </label>

      <p className="error">{error}</p>
      <button className="btn" type="submit" style={{ width: '100%' }}>
        Create account
      </button>
      <p className="muted small" style={{ marginTop: 14 }}>
        Already registered?{' '}
        <Link className="link-btn" to="/login">
          Login
        </Link>
      </p>
      <p className="muted small">
        Demo only: accounts are stored in this browser, never on a server.
      </p>
    </form>
  )
}
