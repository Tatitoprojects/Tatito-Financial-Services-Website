import ServiceCard from '../components/ServiceCard'
import { money } from '../lib/format'
import { useStore } from '../lib/store'
import { useRequestAction } from '../lib/useRequestAction'

export default function Funds() {
  const { db } = useStore()
  const request = useRequestAction()

  return (
    <>
      <h1>Mutual funds</h1>
      <p className="lead">
        Sample data for this demo. Live NAV will come from AMFI once a data feed is connected.
      </p>

      {db.funds.length === 0 ? (
        <p className="muted">No funds configured yet.</p>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Fund</th>
                <th>Category</th>
                <th>NAV</th>
                <th>1Y return</th>
                <th>Risk</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {db.funds.map((fund) => (
                <tr key={fund.id}>
                  <td>{fund.name}</td>
                  <td>{fund.cat}</td>
                  <td>{money(fund.nav)}</td>
                  <td className="positive">{fund.r1}%</td>
                  <td>
                    <span className="badge-soft">{fund.risk}</span>
                  </td>
                  <td>
                    <button className="link-btn" type="button" onClick={() => request(fund.name)}>
                      Invest
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <h2>Why invest through SIP</h2>
      <div className="grid">
        <ServiceCard
          icon="🔁"
          title="Automatic every month"
          text="Set the amount once and let the debit run on a date that suits your salary."
        />
        <ServiceCard
          icon="⚖️"
          title="Rupee cost averaging"
          text="Buying at a fixed amount smooths out market ups and downs over time."
        />
        <ServiceCard
          icon="🧾"
          title="Clear reporting"
          text="Track units, NAV and gains for every folio in one place."
        />
      </div>

      <p className="muted small" style={{ marginTop: 18 }}>
        Mutual fund investments are subject to market risks. Read all scheme related documents
        carefully before investing.
      </p>
    </>
  )
}
