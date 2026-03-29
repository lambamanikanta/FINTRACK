import { useId } from 'react'
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { useCurrency } from '../context/CurrencyContext.jsx'

const PERIODS = [
  { id: 'daily', label: 'Daily' },
  { id: 'weekly', label: 'Weekly' },
  { id: 'monthly', label: 'Monthly' },
]

export default function AssetChart({
  data,
  loading,
  period = 'daily',
  onPeriodChange,
  title = 'Your Assets',
  onRefresh,
}) {
  const { formatDisplay } = useCurrency()
  const gid = useId().replace(/:/g, '')

  const chartData =
    data?.map((d) => ({
      ...d,
      label:
        period === 'monthly'
          ? d.date
          : period === 'weekly'
            ? String(d.date).replace('-W', ' W')
            : d.date?.slice(5) || d.date,
    })) ?? []

  if (loading) {
    return <div className="panel chart-panel loading-panel">Loading chart…</div>
  }

  return (
    <div className="panel chart-panel">
      <div className="panel-head">
        <h2 className="panel-title">{title}</h2>
        <div className="panel-actions" role="tablist" aria-label="Chart period">
          {PERIODS.map((p) => (
            <button
              key={p.id}
              type="button"
              role="tab"
              aria-selected={period === p.id}
              className={`chip ${period === p.id ? 'chip-active' : ''}`}
              onClick={() => onPeriodChange?.(p.id)}
            >
              {p.label}
            </button>
          ))}
          {onRefresh && (
            <button type="button" className="chart-refresh" onClick={onRefresh} title="Refresh">
              ↻
            </button>
          )}
        </div>
      </div>
      <div className="chart-legend">
        <span className="legend-dot income" /> <span className="legend-label">Income</span>
        <span className="legend-dot expense" /> <span className="legend-label">Expense</span>
      </div>
      <div className="chart-wrap">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id={`gIncome-${gid}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--chart-income)" stopOpacity={0.45} />
                <stop offset="100%" stopColor="var(--chart-income)" stopOpacity={0} />
              </linearGradient>
              <linearGradient id={`gExpense-${gid}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--chart-expense)" stopOpacity={0.45} />
                <stop offset="100%" stopColor="var(--chart-expense)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              interval="preserveStartEnd"
            />
            <YAxis
              tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => formatDisplay(v, { compact: true })}
            />
            <Tooltip
              contentStyle={{
                background: 'var(--surface-elevated)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 8,
              }}
              formatter={(val, name) => [formatDisplay(val), name === 'income' ? 'Income' : 'Expense']}
            />
            <Area
              type="monotone"
              dataKey="income"
              name="income"
              stroke="var(--chart-income)"
              strokeWidth={3}
              fill={`url(#gIncome-${gid})`}
              dot={{ r: 3, fill: 'var(--chart-income)', stroke: '#fff', strokeWidth: 1 }}
            />
            <Area
              type="monotone"
              dataKey="expense"
              name="expense"
              stroke="var(--chart-expense)"
              strokeWidth={3}
              fill={`url(#gExpense-${gid})`}
              dot={{ r: 3, fill: 'var(--chart-expense)', stroke: '#fff', strokeWidth: 1 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
