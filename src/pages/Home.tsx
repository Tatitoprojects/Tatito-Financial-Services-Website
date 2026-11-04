import { Link } from 'react-router-dom'
import { formatDate, money } from '../lib/format'
import { useStore } from '../lib/store'
import { useRequestAction } from '../lib/useRequestAction'

const QUICK_ACTIONS = [
  { icon: '💳', label: 'Pay bill', request: 'Bill payment' },
  { icon: '🏦', label: 'Repay EMI', request: 'EMI repayment' },
  { icon: '📈', label: 'Invest', request: 'SIP' },
  { icon: '📲', label: 'Transfer', request: 'Money transfer' },
]

const FEATURES = [
  {
    n: '01',
    title: 'One login, every bill',
    text: 'Electricity, water, gas, broadband, card dues and recharges in a single list — no more app-hopping.',
  },
  {
    n: '02',
    title: 'EMIs you can actually read',
    text: 'See what goes to interest and what goes to principal before you sign, not after the first statement.',
  },
  {
    n: '03',
    title: 'Investing without the jargon',
    text: 'SIPs from ₹500 with a plain-language projection and a reminder on a date that suits your salary.',
  },
]

const PLANS = [
  {
    name: 'Essential',
    price: 'Free',
    per: '',
    tag: 'Start here',
    blurb: 'Bills, recharges and EMI tracking for everyday money.',
    features: ['All bill payments', 'EMI tracking', 'Payment reminders', 'Email support'],
    featured: false,
  },
  {
    name: 'Plus',
    price: '₹99',
    per: '/month',
    tag: 'Most popular',
    blurb: 'For households running loans and investments together.',
    features: [
      'Everything in Essential',
      'Loan EMI calculator + amortisation',
      'SIP planner and goal tracking',
      'Priority support on WhatsApp',
    ],
    featured: true,
  },
  {
    name: 'Private',
    price: 'By invite',
    per: '',
    tag: 'Portfolio',
    blurb: 'A named advisor for larger portfolios and business lending.',
    features: ['Everything in Plus', 'Dedicated relationship manager', 'Business loan desk', 'Quarterly portfolio review'],
    featured: false,
  },
]

const QUOTES = [
  {
    quote:
      'I used to keep three reminders for one home loan. Now the EMI, the SIP and the electricity bill all sit on one screen.',
    name: 'Ananya R.',
    role: 'Home loan customer',
    initials: 'AR',
  },
  {
    quote:
      'The EMI breakdown was the first one I understood without calling anybody. That alone made me stay.',
    name: 'Imran S.',
    role: 'Business loan customer',
    initials: 'IS',
  },
  {
    quote:
      'Started a ₹1,000 SIP just to test it. Two years later it is the most boring, most useful habit I have.',
    name: 'Priya M.',
    role: 'SIP investor',
    initials: 'PM',
  },
]

const FAQ = [
  {
    q: 'Is this a real financial service?',
    a: 'No. This is a demo build. Payments, loans and investments are illustrative and do not move real money. Every figure is sample data you can edit from the admin panel.',
  },
  {
    q: 'Where is my data stored?',
    a: 'In this browser only, using localStorage. Nothing is uploaded. Clearing site data resets the demo to its seed content.',
  },
  {
    q: 'How accurate are the EMI and SIP numbers?',
    a: 'The maths is standard reducing-balance EMI and future-value-of-annuity. Rates and returns are assumptions you control with the sliders, not offers.',
  },
  {
    q: 'Can I edit the content?',
    a: 'Yes — open the admin panel from the footer, sign in with the demo password, and change services, loans, funds, posts, notifications and site settings.',
  },
]

export default function Home() {
  const { db } = useStore()
  const request = useRequestAction()

  const categories = [...new Set(db.services.map((service) => service.cat))].slice(0, 3)
  const latestPosts = [...db.blogs].reverse().slice(0, 3)

  return (
    <div className="home">
      <section className="hero">
        <div className="hero-copy">
          <span className="eyebrow">
            <span className="dot" aria-hidden />
            Wealth &amp; lending · India
          </span>
          <h1>
            Money admin,
            <br />
            <em>minus the admin.</em>
          </h1>
          <p className="hero-sub">
            {db.site.tag} One considered place for bills, EMIs, borrowing and investing — instead of
            five apps and a spreadsheet.
          </p>
          <div className="hero-actions">
            <Link className="btn btn-gold" to="/services">
              Start with a bill
            </Link>
            <Link className="btn btn-ghost" to="/loans">
              Calculate your EMI
            </Link>
          </div>
          <dl className="micro">
            <div>
              <dt>Services</dt>
              <dd>{db.services.length}</dd>
            </div>
            <div>
              <dt>Loan products</dt>
              <dd>{db.loans.length}</dd>
            </div>
            <div>
              <dt>SIP from</dt>
              <dd>₹500</dd>
            </div>
          </dl>
        </div>

        <aside className="hero-card" aria-label="Dashboard preview">
          <div className="hc-top">
            <div>
              <span className="hc-kicker">Private client view</span>
              <strong>Good evening, Ananya</strong>
            </div>
            <span className="hc-chip">Demo</span>
          </div>

          <div className="hc-main">
            <div>
              <span className="hc-label">Outgoings this month</span>
              <b className="hc-amount">{money(41260)}</b>
              <span className="hc-note">across 4 payments</span>
            </div>
            <div className="ring">
              <span>
                68%<small>on track</small>
              </span>
            </div>
          </div>

          <ul className="hc-rows">
            <li>
              <span>🏡 Home loan EMI</span>
              <b>{money(28410)}</b>
              <em>5 Nov</em>
            </li>
            <li>
              <span>📈 SIP · Flexi Cap</span>
              <b>{money(5000)}</b>
              <em>7 Nov</em>
            </li>
            <li>
              <span>💡 Electricity</span>
              <b>{money(1850)}</b>
              <em>12 Nov</em>
            </li>
          </ul>

          <div className="hc-actions">
            {QUICK_ACTIONS.map((action) => (
              <button
                className="hc-action"
                key={action.label}
                type="button"
                onClick={() => request(action.request)}
              >
                <span aria-hidden>{action.icon}</span>
                {action.label}
              </button>
            ))}
          </div>
        </aside>
      </section>

      <section className="trust" aria-label="At a glance">
        <div>
          <b>{db.services.length}</b>
          <span>Services ready</span>
        </div>
        <div>
          <b>₹500</b>
          <span>SIP starting point</span>
        </div>
        <div>
          <b>9–6</b>
          <span>Support hours, Mon–Sat</span>
        </div>
        <div>
          <b>1 login</b>
          <span>Bills, loans, investing</span>
        </div>
      </section>

      <section className="section">
        <div className="section-head">
          <div>
            <span className="eyebrow">Everything, sorted</span>
            <h2>Grouped the way you think about money</h2>
            <p>Pay, borrow, grow. Three clear rooms instead of a menu with forty tiles.</p>
          </div>
          <Link className="text-link" to="/services">
            All services →
          </Link>
        </div>

        <div className="cat-grid">
          {categories.map((category) => {
            const items = db.services.filter((service) => service.cat === category)
            return (
              <article className="cat" key={category}>
                <div className="cat-head">
                  <h3>{category}</h3>
                  <span className="cat-count">{items.length} services</span>
                </div>
                <ul className="cat-list">
                  {items.slice(0, 4).map((service) => (
                    <li key={service.id}>
                      <span aria-hidden>{service.icon}</span>
                      {service.name}
                    </li>
                  ))}
                </ul>
                <Link className="cat-link" to="/services">
                  Open {category.toLowerCase()} →
                </Link>
              </article>
            )
          })}
        </div>
      </section>

      <section className="band">
        <span className="eyebrow">The Tatito standard</span>
        <h2>Clear terms, calm interface, no surprises</h2>
        <p className="lead">
          Financial products are usually sold with urgency. We would rather show you the numbers and
          let you decide.
        </p>
        <div className="band-grid">
          {FEATURES.map((feature) => (
            <div className="band-item" key={feature.n}>
              <span>{feature.n}</span>
              <h3>{feature.title}</h3>
              <p>{feature.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="section">
        <div className="section-head">
          <div>
            <span className="eyebrow">Borrowing</span>
            <h2>Rates you can see before you ask</h2>
            <p>Indicative pricing for the demo. The calculator on the loans page does the rest.</p>
          </div>
          <Link className="text-link" to="/loans">
            Full EMI calculator →
          </Link>
        </div>

        <div className="loan-grid">
          {db.loans.map((loan) => (
            <Link className="loan" key={loan.id} to="/loans">
              <span className="card-icon" aria-hidden>
                {loan.icon}
              </span>
              <h3>{loan.name}</h3>
              <p>{loan.desc}</p>
              <div className="loan-foot">
                <b>{loan.rate}%</b>
                <span>p.a. · up to {money(loan.max)}</span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="section">
        <div className="section-head">
          <div>
            <span className="eyebrow">Membership</span>
            <h2>Choose how much help you want</h2>
            <p>Illustrative tiers for this demo. No card is collected and nothing is charged.</p>
          </div>
        </div>

        <div className="plans">
          {PLANS.map((plan) => (
            <div className={`plan${plan.featured ? ' plan-featured' : ''}`} key={plan.name}>
              <div className="plan-top">
                <span className="plan-name">{plan.name}</span>
                <span className="plan-tag">{plan.tag}</span>
              </div>
              <div className="plan-price">
                {plan.price}
                {plan.per && <small>{plan.per}</small>}
              </div>
              <p>{plan.blurb}</p>
              <ul>
                {plan.features.map((feature) => (
                  <li key={feature}>{feature}</li>
                ))}
              </ul>
              <button
                className={`btn${plan.featured ? ' btn-gold' : ' btn-ghost'}`}
                type="button"
                onClick={() => request(`${plan.name} plan`)}
              >
                Choose {plan.name}
              </button>
            </div>
          ))}
        </div>
      </section>

      <section className="section">
        <div className="section-head">
          <div>
            <span className="eyebrow">In their words</span>
            <h2>People who stopped juggling apps</h2>
          </div>
        </div>

        <div className="quotes">
          {QUOTES.map((item) => (
            <figure className="quote" key={item.name} style={{ margin: 0 }}>
              <p>“{item.quote}”</p>
              <figcaption className="quote-who">
                <span className="avatar" aria-hidden>
                  {item.initials}
                </span>
                <span>
                  <b>{item.name}</b>
                  <span>{item.role}</span>
                </span>
              </figcaption>
            </figure>
          ))}
        </div>
        <p className="muted small" style={{ marginTop: 14 }}>
          Illustrative reviews written for this demo build.
        </p>
      </section>

      <section className="section">
        <div className="section-head">
          <div>
            <span className="eyebrow">Reading room</span>
            <h2>Notes worth ten minutes</h2>
            <p>Plain-language pieces on borrowing, investing and everyday money.</p>
          </div>
          <Link className="text-link" to="/blog">
            All insights →
          </Link>
        </div>

        <div className="grid">
          {latestPosts.map((post) => (
            <Link className="card" key={post.id} to={`/blog/${post.id}`}>
              <p className="card-meta">{formatDate(post.date)}</p>
              <h3 className="card-title">{post.title}</h3>
              <p className="card-text">{post.body.slice(0, 96)}…</p>
              <span className="card-action">
                Read note <span aria-hidden>→</span>
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section className="section">
        <div className="section-head">
          <div>
            <span className="eyebrow">Questions</span>
            <h2>Before you start</h2>
          </div>
        </div>

        <div className="faq">
          {FAQ.map((item) => (
            <details className="faq-item" key={item.q}>
              <summary>{item.q}</summary>
              <p>{item.a}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="cta">
        <h2>Money admin, minus the admin.</h2>
        <p>
          Open a demo account and see your bills, EMIs and investments on one page. Takes about a
          minute, and nothing leaves this browser.
        </p>
        <div className="cta-actions">
          <Link className="btn btn-gold" to="/register">
            Open an account
          </Link>
          <Link className="btn btn-ghost" to="/contact">
            Talk to us
          </Link>
        </div>
      </section>
    </div>
  )
}
