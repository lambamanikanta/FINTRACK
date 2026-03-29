import { useCallback, useEffect, useMemo, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { transactionsApi } from '../services/api.js'
import TransactionForm from '../components/TransactionForm.jsx'
import TransactionList from '../components/TransactionList.jsx'
import { transactionMatchesSearch } from '../utils/search.js'

export default function TransactionsPage() {
  const { searchQuery = '', refreshKey = 0 } = useOutletContext() || {}
  const [items, setItems] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState(null)
  const [filter, setFilter] = useState('')

  const hasSearch = Boolean(searchQuery.trim())

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      const res = await transactionsApi.list({
        page: hasSearch ? 1 : page,
        limit: hasSearch ? 200 : 20,
        type: filter === 'income' || filter === 'expense' ? filter : undefined,
      })
      setItems(res.items || [])
      setTotal(res.total ?? 0)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [page, filter, hasSearch])

  useEffect(() => {
    refresh()
  }, [refresh, refreshKey])

  useEffect(() => {
    if (hasSearch) setPage(1)
  }, [searchQuery, hasSearch])

  async function handleCreate(payload) {
    await transactionsApi.create(payload)
    await refresh()
  }

  async function handleDelete(id) {
    setBusyId(id)
    try {
      await transactionsApi.remove(id)
      await refresh()
    } finally {
      setBusyId(null)
    }
  }

  const displayItems = useMemo(
    () =>
      hasSearch ? items.filter((t) => transactionMatchesSearch(t, searchQuery)) : items,
    [items, hasSearch, searchQuery]
  )

  const pageSize = hasSearch ? 200 : 20
  const totalPages = Math.max(1, Math.ceil(total / pageSize))

  return (
    <div className="transactions-page">
      <div className="page-head">
        <h1 className="page-title">Transactions</h1>
        <div className="page-filters">
          <select
            className="filter-select"
            value={filter}
            onChange={(e) => {
              setPage(1)
              setFilter(e.target.value)
            }}
            aria-label="Filter by type"
          >
            <option value="">All types</option>
            <option value="income">Income</option>
            <option value="expense">Expense</option>
          </select>
        </div>
      </div>

      {hasSearch && (
        <p className="search-hint muted small" role="status">
          {displayItems.length} match{displayItems.length === 1 ? '' : 'es'} for &quot;{searchQuery.trim()}&quot; (searching
          loaded rows).
        </p>
      )}

      <TransactionForm onCreated={handleCreate} />

      {loading ? (
        <p className="muted">Loading…</p>
      ) : (
        <>
          <TransactionList items={displayItems} onDelete={handleDelete} busyId={busyId} />
          {!hasSearch && (
            <div className="pagination">
              <button type="button" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                Previous
              </button>
              <span className="muted">
                Page {page} of {totalPages} ({total} total)
              </span>
              <button type="button" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
