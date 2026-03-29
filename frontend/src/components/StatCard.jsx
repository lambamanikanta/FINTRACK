import { useCurrency } from '../context/CurrencyContext.jsx'

function formatPct(p) {
  if (p == null || Number.isNaN(p)) return '0%'
  const sign = p >= 0 ? '+' : ''
  return `${sign}${p.toFixed(1)}%`
}

function formatCount(n) {
  if (n == null || Number.isNaN(n)) return '0'
  return new Intl.NumberFormat('en-IN').format(n)
}

export default function StatCard({ title, value, changePercent, format = 'currency', subtitle }) {
  const { format: fmt } = useCurrency()
  const positive = changePercent >= 0
  const display =
    format === 'currency' ? fmt(value) : format === 'count' ? formatCount(value) : String(value)
  return (
    <article className="stat-card">
      <p className="stat-card-title">{title}</p>
      <p className="stat-card-value">{display}</p>
      {subtitle && <p className="stat-card-sub">{subtitle}</p>}
      <p className={`stat-card-change ${positive ? 'up' : 'down'}`}>
        {formatPct(changePercent)} <span className="stat-card-vs">vs last month</span>
      </p>
    </article>
  )
}
