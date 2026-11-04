import { useState } from 'react'
import ServiceCard from '../components/ServiceCard'
import { money } from '../lib/format'
import { useStore } from '../lib/store'
import { useRequestAction } from '../lib/useRequestAction'

const PLANS = [
  { icon: '🌱', name: 'Starter SIP', amount: '₹500 a month' },
  { icon: '📈', name: 'Growth SIP', amount: '₹2,000 a month' },
  { icon: '🏔️', name: 'Wealth SIP', amount: '₹10,000 a month' },
]

export default function Sip() {
  const { notify } = useStore()
  const request = useRequestAction()
  const [monthly, setMonthly] = useState(5000)
  const [years, setYears] = useState(10)
  const [rate, setRate] = useState(12)

  const months = years * 12
  const monthlyRate = rate / 1200
  const futureValue =
    monthlyRate === 0
      ? monthly * months
      : monthly * ((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate) * (1 + monthlyRate)
  const invested = monthly * months

  return (
    <>
      <h1>SIP calculator</h1>
      <p className="lead">
        See how a monthly systematic investment plan could grow. Figures are illustrative only.
      </p>

      <div className="two">
        <div className="panel">
          <label className="field">
            <span className="field-label">
              Monthly SIP <b>{money(monthly)}</b>
            </span>
            <input
              type="range"
              min={500}
              max={100000}
              step={500}
              value={monthly}
              onChange={(event) => setMonthly(Number(event.target.value))}
            />
          </label>

          <label className="field">
            <span className="field-label">
              Years <b>{years} yrs</b>
            </span>
            <input
              type="range"
              min={1}
              max={30}
              value={years}
              onChange={(event) => setYears(Number(event.target.value))}
            />
          </label>

          <label className="field">
            <span className="field-label">
              Expected return <b>{rate}% p.a.</b>
            </span>
            <input
              type="range"
              min={6}
              max={18}
              value={rate}
              onChange={(event) => setRate(Number(event.target.value))}
            />
          </label>
        </div>

        <div className="result">
          You invest {money(invested)}
          <b>{money(futureValue)}</b>
          <p className="muted">
            Estimated value after {years} years · gain of {money(futureValue - invested)}.
            <br />
            Returns are not guaranteed.
          </p>
          <button
            className="btn"
            type="button"
            onClick={() => notify('SIP request received (demo)')}
          >
            Start this SIP
          </button>
        </div>
      </div>

      <h2>Popular plans</h2>
      <div className="grid">
        {PLANS.map((plan) => (
          <ServiceCard
            key={plan.name}
            icon={plan.icon}
            title={plan.name}
            text={plan.amount}
            cta="Start SIP"
            onAction={() => request(plan.name)}
          />
        ))}
      </div>

      <p className="muted small" style={{ marginTop: 18 }}>
        Mutual fund investments are subject to market risks. Read all scheme related documents
        carefully before investing.
      </p>
    </>
  )
}
