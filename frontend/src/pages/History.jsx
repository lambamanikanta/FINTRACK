import { useCallback, useEffect, useMemo, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { transactionsApi } from '../services/api.js'
import { useCurrency } from '../context/CurrencyContext.jsx'
import { transactionMatchesSearch } from '../utils/search.js'

function formatWhen(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function initials(title) {
  const parts = (title || '?').trim().split(/\s+/)
  return (parts[0]?.[0] || '?') + (parts[1]?.[0] || '')
}

const mediumClass = (m) => {
  const x = (m || '').toLowerCase()
  if (x.includes('visa')) return 'visa'
  if (x.includes('paypal')) return 'paypal'
  if (x.includes('payoneer')) return 'payoneer'
  if (x.includes('plaid')) return 'plaid'
  return 'default'
}

export default function History() {
  const { format } = useCurrency()
  const { searchQuery = '', refreshKey = 0 } = useOutletContext() || {}
  const today = useMemo(() => new Date().toISOString().slice(0, 10), [])
  const monthAgo = useMemo(() => {
    const d = new Date()
    d.setMonth(d.getMonth() - 3)
    return d.toISOString().slice(0, 10)
  }, [])

  const [from, setFrom] = useState(monthAgo)
  const [to, setTo] = useState(today)
  const [items, setItems] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const start = new Date(from)
      start.setHours(0, 0, 0, 0)
      const end = new Date(to)
      end.setHours(23, 59, 59, 999)
      const res = await transactionsApi.list({
        limit: 500,
        from: start.toISOString(),
        to: end.toISOString(),
      })
      const list = res.items || []
      setItems(list.sort((a, b) => new Date(b.date) - new Date(a.date)))
      setTotal(res.total ?? list.length)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [from, to])

  useEffect(() => {
    load()
  }, [load, refreshKey])

  const filteredItems = useMemo(
    () => items.filter((t) => transactionMatchesSearch(t, searchQuery)),
    [items, searchQuery]
  )

  function exportCsv() {
    const headers = ['Title', 'Type', 'Date', 'Medium', 'Category', 'Amount']
    const rows = items.map((t) => [
      `"${(t.title || '').replace(/"/g, '""')}"`,
      t.type,
      new Date(t.date).toISOString(),
      `"${(t.medium || '').replace(/"/g, '""')}"`,
      `"${(t.category || '').replace(/"/g, '""')}"`,
      t.amount,
    ])
    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `fintrack-history-${from}-to-${to}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="history-page">
      <div className="page-head">
        <div>
          <h1 className="page-title">History</h1>
          <p className="muted section-lead">Complete transaction log for the selected period.</p>
        </div>
        <button type="button" className="btn-secondary" onClick={exportCsv} disabled={!items.length}>
          Export CSV
        </button>
      </div>

      <div className="history-filters panel">
        <label className="field inline">
          <span>From</span>
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
        </label>
        <label className="field inline">
          <span>To</span>
          <input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
        </label>
        <button type="button" className="btn-primary" onClick={load} disabled={loading}>
          Apply
        </button>
        <span className="muted small">{total} records</span>
      </div>

      {searchQuery.trim() && (
        <p className="search-hint muted small" role="status">
          Table filter: {filteredItems.length} visible ({items.length} loaded in range).
        </p>
      )}

      {loading ? (
        <p className="muted">Loading history…</p>
      ) : (
        <div className="panel history-table-wrap">
          <table className="tx-table history-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Type</th>
                <th>Date</th>
                <th>Medium</th>
                <th>Category</th>
                <th className="num">Amount</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.length ? (
                filteredItems.map((t) => (
                  <tr key={t._id}>
                    <td>
                      <div className="tx-user">
                        <span className="tx-avatar">{initials(t.title)}</span>
                        <span className="tx-title">{t.title}</span>
                      </div>
                    </td>
                    <td>
                      <span className={`tx-type tx-type-${t.type}`}>{t.type}</span>
                    </td>
                    <td className="tx-date">{formatWhen(t.date)}</td>
                    <td>
                      <span className={`tx-tag tx-tag-${mediumClass(t.medium)}`}>{t.medium || 'Other'}</span>
                    </td>
                    <td className="muted">{t.category || '—'}</td>
                    <td className={`tx-amount num ${t.type === 'income' ? 'in' : 'out'}`}>
                      {t.type === 'income' ? '+' : '-'}
                      {format(t.amount)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="tx-empty">
                    {items.length ? 'No transactions match your search.' : 'No transactions in this range.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
