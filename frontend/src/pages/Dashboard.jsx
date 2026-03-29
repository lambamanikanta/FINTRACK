import { useCallback, useEffect, useMemo, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { loansApi, transactionsApi } from '../services/api.js'
import AssetChart from '../components/AssetChart.jsx'
import HealthScoreCard from '../components/HealthScoreCard.jsx'
import StatCard from '../components/StatCard.jsx'
import TransactionForm from '../components/TransactionForm.jsx'
import TransactionGauge from '../components/TransactionGauge.jsx'
import TransactionList from '../components/TransactionList.jsx'
import { useCurrency } from '../context/CurrencyContext.jsx'
import { transactionMatchesSearch } from '../utils/search.js'

export default function Dashboard() {
  const { toDisplayAmount, format } = useCurrency()
  const { searchQuery = '', refreshKey = 0 } = useOutletContext() || {}
  const [summary, setSummary] = useState(null)
  const [loanSummary, setLoanSummary] = useState(null)
  const [series, setSeries] = useState([])
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [chartLoading, setChartLoading] = useState(true)
  const [busyId, setBusyId] = useState(null)
  const [goal] = useState(() => Number(localStorage.getItem('spendingGoal')) || 9254)
  const [chartPeriod, setChartPeriod] = useState('daily')

  const refresh = useCallback(async () => {
    setLoading(true)
    setChartLoading(true)
    try {
      const [sum, ts, list, loanSum] = await Promise.all([
        transactionsApi.summary(),
        transactionsApi.timeseries({ granularity: chartPeriod }),
        transactionsApi.list({ limit: 60 }),
        loansApi.summary().catch((e) => {
          console.error(e)
          return { outstanding: 0, activeCount: 0, totalPrincipal: 0, totalPaid: 0 }
        }),
      ])
      setSummary(sum)
      setLoanSummary(loanSum)
      setSeries(ts.series || [])
      setItems(list.items || [])
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
      setChartLoading(false)
    }
  }, [chartPeriod])

  useEffect(() => {
    refresh()
  }, [refresh, refreshKey])

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

  const inc = summary?.totalIncome?.value ?? 0
  const spend = summary?.totalSpending?.value ?? 0
  const vol = summary?.totalTransactions?.volume ?? 0

  const chartSeries = useMemo(
    () =>
      (series || []).map((d) => ({
        ...d,
        income: toDisplayAmount(d.income),
        expense: toDisplayAmount(d.expense),
      })),
    [series, toDisplayAmount]
  )

  const filteredItems = useMemo(
    () => items.filter((t) => transactionMatchesSearch(t, searchQuery)),
    [items, searchQuery]
  )

  const outstanding = loanSummary?.outstanding ?? 0

  return (
    <div className="dashboard">
      <HealthScoreCard outstanding={outstanding} monthlyIncome={inc} formatMoney={format} />

      <section className="stat-grid">
        <StatCard
          title="Total Income"
          value={inc}
          changePercent={summary?.totalIncome?.changePercent ?? 0}
        />
        <StatCard
          title="Total Spending"
          value={spend}
          changePercent={summary?.totalSpending?.changePercent ?? 0}
        />
        <StatCard title="Spending Goal" value={goal} changePercent={1.15} />
        <StatCard
          title="Total Transactions"
          value={vol}
          changePercent={summary?.totalTransactions?.changePercent ?? 0}
        />
      </section>

      <section className="dash-mid">
        <AssetChart
          data={chartSeries}
          loading={chartLoading}
          period={chartPeriod}
          onPeriodChange={setChartPeriod}
          onRefresh={refresh}
        />
      </section>

      <section className="dash-bottom">
        {searchQuery.trim() && (
          <p className="search-hint muted small" role="status">
            Showing {filteredItems.length} match{filteredItems.length === 1 ? '' : 'es'} for &quot;{searchQuery.trim()}&quot;
            in recent activity.
          </p>
        )}
        <TransactionList items={filteredItems} onDelete={handleDelete} busyId={busyId} />
        <div className="dash-bottom-right">
          <TransactionGauge income={inc} expense={spend} volume={vol} />
          <TransactionForm onCreated={handleCreate} />
        </div>
      </section>

      {loading && !summary && <p className="dash-loading">Loading dashboard…</p>}
    </div>
  )
}
