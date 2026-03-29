import { Link } from 'react-router-dom'
import { useCurrency } from '../context/CurrencyContext.jsx'

const mediumClass = (m) => {
  const x = (m || '').toLowerCase()
  if (x.includes('visa')) return 'visa'
  if (x.includes('paypal')) return 'paypal'
  if (x.includes('payoneer')) return 'payoneer'
  if (x.includes('plaid')) return 'plaid'
  return 'default'
}

function formatDate(iso) {
  if (!iso) return '—'
  const d = new Date(iso)
  return d.toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
}

function initials(title) {
  const parts = (title || '?').trim().split(/\s+/)
  return (parts[0]?.[0] || '?') + (parts[1]?.[0] || '')
}

export default function TransactionList({ items, onDelete, busyId }) {
  const { format } = useCurrency()
  return (
    <div className="panel tx-table-panel">
      <div className="panel-head">
        <h2 className="panel-title">Latest Transaction</h2>
        <Link to="/transactions" className="panel-link">
          See All
        </Link>
      </div>
      <div className="tx-table-wrap">
        <table className="tx-table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Date</th>
              <th>Medium</th>
              <th className="num">Amount</th>
              {onDelete && <th className="num" />}
            </tr>
          </thead>
          <tbody>
            {items?.length ? (
              items.map((t) => (
                <tr key={t._id}>
                  <td>
                    <div className="tx-user">
                      <span className="tx-avatar">{initials(t.title)}</span>
                      <span className="tx-title">{t.title}</span>
                    </div>
                  </td>
                  <td className="tx-date">{formatDate(t.date)}</td>
                  <td>
                    <span className={`tx-tag tx-tag-${mediumClass(t.medium)}`}>{t.medium || 'Other'}</span>
                  </td>
                  <td className={`tx-amount num ${t.type === 'income' ? 'in' : 'out'}`}>
                    {t.type === 'income' ? '+' : '-'}
                    {format(t.amount)}
                  </td>
                  <td>
                    {onDelete && (
                      <button
                        type="button"
                        className="tx-delete"
                        disabled={busyId === t._id}
                        onClick={() => onDelete(t._id)}
                        aria-label={`Delete ${t.title}`}
                      >
                        ×
                      </button>
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={onDelete ? 5 : 4} className="tx-empty">
                  No transactions yet. Add one below.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
