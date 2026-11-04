import { useStore } from '../lib/store'

export default function About() {
  const { db } = useStore()

  return (
    <>
      <h1>About us</h1>
      <div style={{ maxWidth: 700 }}>
        {db.site.about.split('\n').map((line, index) => (
          <p key={index} className="post-body">
            {line}
          </p>
        ))}
      </div>

      <h2>What we are building</h2>
      <div className="grid">
        <article className="card">
          <span className="card-icon">🧾</span>
          <h3 className="card-title">Everyday payments</h3>
          <p className="card-text">Recharges, electricity, water, gas, broadband and card bills.</p>
        </article>
        <article className="card">
          <span className="card-icon">🏦</span>
          <h3 className="card-title">Borrowing &amp; repayments</h3>
          <p className="card-text">Personal, business, gold, home and vehicle loans with clear EMIs.</p>
        </article>
        <article className="card">
          <span className="card-icon">📈</span>
          <h3 className="card-title">Investing</h3>
          <p className="card-text">SIPs, mutual funds and a demat route through a partner broker.</p>
        </article>
      </div>
    </>
  )
}
