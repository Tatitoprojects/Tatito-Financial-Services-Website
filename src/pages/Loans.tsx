import { useState } from 'react'
import ServiceCard from '../components/ServiceCard'
import { money } from '../lib/format'
import { useStore } from '../lib/store'
import { useRequestAction } from '../lib/useRequestAction'

function emiFor(principal: number, annualRate: number, months: number): number {
  const monthlyRate = annualRate / 1200
  if (monthlyRate === 0) return principal / months
  const growth = Math.pow(1 + monthlyRate, months)
  return (principal * monthlyRate * growth) / (growth - 1)
}

export default function Loans() {
  const { db } = useStore()
  const request = useRequestAction()
  const [index, setIndex] = useState(0)
  const [amount, setAmount] = useState(500000)
  const [months, setMonths] = useState(36)

  const loan = db.loans[Math.min(index, Math.max(db.loans.length - 1, 0))]

  if (!loan) {
    return (
      <>
        <h1>Loans</h1>
        <p className="lead">No loan products are configured yet. Add some from the admin panel.</p>
      </>
    )
  }

  const principal = Math.min(Math.max(amount, 10000), loan.max)
  const emi = emiFor(principal, loan.rate, months)
  const total = emi * months

  return (
    <>
      <h1>Loans</h1>
      <p className="lead">Compare indicative rates and check what the monthly instalment looks like.</p>

      <div className="grid">
        {db.loans.map((item) => (
          <ServiceCard
            key={item.id}
            icon={item.icon}
            title={item.name}
            text={item.desc}
            meta={`From ${item.rate}% p.a. · up to ${money(item.max)}`}
            cta="Apply now"
            onAction={() => request(item.name)}
          />
        ))}
      </div>

      <h2>EMI calculator</h2>
      <div className="two">
        <div className="panel">
          <label className="field">
            Loan type
            <select
              value={index}
              onChange={(event) => {
                const nextIndex = Number(event.target.value)
                setIndex(nextIndex)
                setAmount(Math.min(500000, db.loans[nextIndex].max))
              }}
            >
              {db.loans.map((item, itemIndex) => (
                <option key={item.id} value={itemIndex}>
                  {item.name} — {item.rate}% p.a.
                </option>
              ))}
            </select>
          </label>

          <label className="field">
            <span className="field-label">
              Loan amount <b>{money(principal)}</b>
            </span>
            <input
              type="range"
              min={10000}
              max={loan.max}
              step={10000}
              value={principal}
              onChange={(event) => setAmount(Number(event.target.value))}
            />
          </label>

          <label className="field">
            <span className="field-label">
              Tenure <b>{months} months</b>
            </span>
            <input
              type="range"
              min={6}
              max={120}
              step={6}
              value={months}
              onChange={(event) => setMonths(Number(event.target.value))}
            />
          </label>
        </div>

        <div className="result">
          Monthly EMI
          <b>{money(emi)}</b>
          <p className="muted">
            Interest {loan.rate}% p.a. · Total payable {money(total)}
            <br />
            {loan.name} up to {money(loan.max)}. Rates shown are examples only.
          </p>
          <button className="btn" type="button" onClick={() => request(`Apply for ${loan.name}`)}>
            Apply for {loan.name}
          </button>
        </div>
      </div>
    </>
  )
}
