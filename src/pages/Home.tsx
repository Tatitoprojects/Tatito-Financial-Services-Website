import { Link } from 'react-router-dom'
import ServiceCard from '../components/ServiceCard'
import { formatDate, money } from '../lib/format'
import { useStore } from '../lib/store'
import { useRequestAction } from '../lib/useRequestAction'

export default function Home() {
  const { db } = useStore()
  const request = useRequestAction()

  const categories = [...new Set(db.services.map((service) => service.cat))].slice(0, 3)
  const latestPosts = [...db.blogs].reverse().slice(0, 3)

  return (
    <>
      <section className="hero">
        <div>
          <h1>{db.site.tag}</h1>
          <p>
            Recharges, bills, loan repayments, loans, SIPs and more. Everything sorted into clear
            sections, so you find what you need in seconds.
          </p>
          <div className="hero-actions">
            <Link className="btn btn-amber" to="/services">
              Pay or repay now
            </Link>
            <Link className="btn btn-ghost" to="/loans">
              See loans
            </Link>
          </div>
        </div>
        <div className="hero-chips">
          {db.services.slice(0, 8).map((service) => (
            <Link className="chip" key={service.id} to="/services">
              {service.icon} {service.name}
            </Link>
          ))}
        </div>
      </section>

      {categories.map((category) => (
        <section key={category}>
          <h2>{category}</h2>
          <div className="grid">
            {db.services
              .filter((service) => service.cat === category)
              .slice(0, 4)
              .map((service) => (
                <ServiceCard
                  key={service.id}
                  icon={service.icon}
                  title={service.name}
                  text={service.desc}
                  onAction={() => request(service.name)}
                />
              ))}
          </div>
        </section>
      ))}

      <h2>Loans for every need</h2>
      <div className="grid">
        {db.loans.map((loan) => (
          <ServiceCard
            key={loan.id}
            icon={loan.icon}
            title={loan.name}
            text={loan.desc}
            meta={`From ${loan.rate}% p.a. · up to ${money(loan.max)}`}
            cta="Apply now"
            onAction={() => request(loan.name)}
          />
        ))}
      </div>

      <h2>Latest from the blog</h2>
      <div className="grid">
        {latestPosts.map((post) => (
          <Link className="card" key={post.id} to={`/blog/${post.id}`}>
            <h3 className="card-title">{post.title}</h3>
            <p className="card-text">{post.body.slice(0, 96)}…</p>
            <p className="card-meta">{formatDate(post.date)}</p>
          </Link>
        ))}
      </div>
    </>
  )
}
