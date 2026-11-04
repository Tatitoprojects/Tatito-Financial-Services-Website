import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <>
      <h1>Page not found</h1>
      <p className="muted">The page you asked for does not exist or has moved.</p>
      <Link className="btn" to="/">
        Go to home
      </Link>
    </>
  )
}
