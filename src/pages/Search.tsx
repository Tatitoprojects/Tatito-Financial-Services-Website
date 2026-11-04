import { Link, useParams } from 'react-router-dom'
import { useStore } from '../lib/store'

type Result = { id: string; label: string; kind: string; to: string }

export default function Search() {
  const { q = '' } = useParams()
  const { db } = useStore()
  const term = q.trim().toLowerCase()

  const matches = (values: Array<string | number>) =>
    values.some((value) => String(value).toLowerCase().includes(term))

  const results: Result[] = term
    ? [
        ...db.services
          .filter((item) => matches([item.name, item.desc, item.cat]))
          .map((item) => ({
            id: item.id,
            label: `${item.icon} ${item.name}`,
            kind: 'Service',
            to: '/services',
          })),
        ...db.loans
          .filter((item) => matches([item.name, item.desc]))
          .map((item) => ({ id: item.id, label: `${item.icon} ${item.name}`, kind: 'Loan', to: '/loans' })),
        ...db.funds
          .filter((item) => matches([item.name, item.cat]))
          .map((item) => ({ id: item.id, label: item.name, kind: 'Mutual fund', to: '/funds' })),
        ...db.blogs
          .filter((item) => matches([item.title, item.body]))
          .map((item) => ({ id: item.id, label: item.title, kind: 'Blog', to: `/blog/${item.id}` })),
      ]
    : []

  return (
    <>
      <h1>Search: {q}</h1>
      {results.length === 0 ? (
        <p className="muted">
          Nothing found. Try &ldquo;recharge&rdquo;, &ldquo;loan&rdquo; or &ldquo;SIP&rdquo;.
        </p>
      ) : (
        <>
          <p className="muted">{results.length} result(s)</p>
          <div style={{ display: 'grid', gap: 10 }}>
            {results.map((result) => (
              <Link className="card" key={`${result.kind}-${result.id}`} to={result.to}>
                <h3 className="card-title">{result.label}</h3>
                <p className="card-meta">{result.kind}</p>
              </Link>
            ))}
          </div>
        </>
      )}
    </>
  )
}
