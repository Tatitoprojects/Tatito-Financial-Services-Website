import { useRequestAction } from '../lib/useRequestAction'

const STEPS = [
  { step: '1', title: 'Open an account', text: 'PAN, Aadhaar and bank details' },
  { step: '2', title: 'Complete KYC', text: 'Online e-sign, no paperwork' },
  { step: '3', title: 'Add funds', text: 'Bank transfer or UPI' },
  { step: '4', title: 'Start trading', text: 'Stocks, ETFs and IPOs' },
]

const MARKET = [
  { symbol: 'NIFTY 50', price: 24850, change: '+0.4%' },
  { symbol: 'SENSEX', price: 81420, change: '+0.3%' },
  { symbol: 'BANK NIFTY', price: 53210, change: '-0.2%' },
]

export default function Trading() {
  const request = useRequestAction()

  return (
    <>
      <h1>Trading &amp; demat</h1>
      <p className="lead">Planned through a partner broker. Not live yet.</p>

      <div className="grid">
        {STEPS.map((item) => (
          <article className="card" key={item.step}>
            <span className="badge-soft">Step {item.step}</span>
            <h3 className="card-title">{item.title}</h3>
            <p className="card-text">{item.text}</p>
          </article>
        ))}
      </div>

      <h2>Market watch (sample data)</h2>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Symbol</th>
              <th>Price</th>
              <th>Change</th>
            </tr>
          </thead>
          <tbody>
            {MARKET.map((row) => (
              <tr key={row.symbol}>
                <td>{row.symbol}</td>
                <td>{row.price.toLocaleString('en-IN')}</td>
                <td className={row.change.startsWith('-') ? 'negative' : 'positive'}>{row.change}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="btn-row">
        <button
          className="btn"
          type="button"
          onClick={() => request('Demat account')}
        >
          Open demat account
        </button>
      </div>
    </>
  )
}
