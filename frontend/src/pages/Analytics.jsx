import { useCallback, useEffect, useMemo, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { transactionsApi } from '../services/api.js'
import AssetChart from '../components/AssetChart.jsx'
import StatCard from '../components/StatCard.jsx'
import { useCurrency } from '../context/CurrencyContext.jsx'

export default function Analytics() {
  const { formatDisplay, toDisplayAmount } = useCurrency()
  const { refreshKey = 0 } = useOutletContext() || {}
  const [summary, setSummary] = useState(null)
  const [period, setPeriod] = useState('daily')
  const [series, setSeries] = useState([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [sum, ts] = await Promise.all([
        transactionsApi.summary(),
        transactionsApi.timeseries({ granularity: period }),
      ])
      setSummary(sum)
      setSeries(ts.series || [])
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [period])

  useEffect(() => {
    load()
  }, [load, refreshKey])

  const inc = summary?.totalIncome?.value ?? 0
  const spend = summary?.totalSpending?.value ?? 0
  const vol = summary?.totalTransactions?.volume ?? 0
  const count = summary?.totalTransactions?.count ?? 0

  const chartSeries = useMemo(
    () =>
      (series || []).map((d) => ({
        ...d,
        income: toDisplayAmount(d.income),
        expense: toDisplayAmount(d.expense),
      })),
    [series, toDisplayAmount]
  )

  const barData =
    chartSeries?.map((d) => ({
      ...d,
      label:
        period === 'monthly'
          ? d.date
          : period === 'weekly'
            ? String(d.date).replace('-W', ' W')
            : d.date?.slice(5) || d.date,
    })) ?? []

  return (
    <div className="analytics-page">
      <h1 className="page-title">Analytics</h1>
      <p className="muted section-lead">Income vs expense trends and monthly comparisons.</p>

      <section className="stat-grid">
        <StatCard title="Total Income" value={inc} changePercent={summary?.totalIncome?.changePercent ?? 0} />
        <StatCard title="Total Spending" value={spend} changePercent={summary?.totalSpending?.changePercent ?? 0} />
        <StatCard
          title="Transaction volume"
          value={vol}
          changePercent={summary?.totalTransactions?.changePercent ?? 0}
        />
        <StatCard title="Transaction count" value={count} changePercent={summary?.totalTransactions?.countChangePercent ?? 0} format="count" />
      </section>

      <section className="analytics-chart-block">
        <AssetChart
          data={chartSeries}
          loading={loading}
          period={period}
          onPeriodChange={setPeriod}
          title="Income vs expense"
          onRefresh={load}
        />
      </section>

      <section className="panel analytics-bar-panel">
        <h2 className="panel-title">Comparison by period</h2>
        <p className="muted small">Green bars: income. Orange bars: expense.</p>
        <div className="chart-wrap analytics-bar-wrap">
          {loading && !barData.length ? (
            <p className="muted">Loading…</p>
          ) : (
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={barData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" vertical={false} />
                <XAxis dataKey="label" tick={{ fill: 'var(--text-muted)', fontSize: 10 }} interval="preserveStartEnd" />
                <YAxis
                  tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
                  tickFormatter={(v) => formatDisplay(v, { compact: true })}
                />
                <Tooltip
                  formatter={(val) => formatDisplay(val)}
                  contentStyle={{
                    background: 'var(--surface-elevated)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 8,
                  }}
                />
                <Legend />
                <Bar dataKey="income" name="Income" fill="var(--chart-income)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="expense" name="Expense" fill="var(--chart-expense)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </section>
    </div>
  )
}
