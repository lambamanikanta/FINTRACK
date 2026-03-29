/** Debt-to-income style health: active loan outstanding vs this month’s income (%). */
export function classifyDebtToIncome(pct) {
  if (pct == null || Number.isNaN(pct)) return { band: 'unknown', label: 'Incomplete data' }
  if (pct < 30) return { band: 'excellent', label: 'Excellent' }
  if (pct <= 50) return { band: 'good', label: 'Good' }
  return { band: 'risky', label: 'Risky' }
}

export default function HealthScoreCard({ outstanding, monthlyIncome, formatMoney }) {
  const hasIncome = monthlyIncome > 0
  const hasDebt = outstanding > 0

  let ratioPct = null
  let subnote = ''

  if (hasIncome) {
    ratioPct = (outstanding / monthlyIncome) * 100
    subnote = `Outstanding loans ${formatMoney(outstanding)} vs this month’s income ${formatMoney(monthlyIncome)}.`
  } else if (hasDebt) {
    subnote =
      'You have outstanding loans but no income recorded this month—add income transactions to see a meaningful ratio.'
  } else {
    subnote = 'No active loan balance. Add loans and income to track your health score.'
  }

  const classification =
    ratioPct != null ? classifyDebtToIncome(ratioPct) : hasDebt ? { band: 'risky', label: 'Risky' } : classifyDebtToIncome(0)

  const { band, label } = classification
  const displayPct =
    ratioPct != null ? Math.min(999, Math.round(ratioPct * 10) / 10) : hasDebt ? null : 0
  const barWidth = ratioPct != null ? Math.min(100, ratioPct) : hasDebt ? 100 : 0

  return (
    <section className="health-score-card" aria-labelledby="health-score-heading">
      <div className="health-score-head">
        <h2 id="health-score-heading" className="health-score-title">
          Financial health score
        </h2>
        <p className="health-score-legend muted small">
          Loan burden vs this month’s income: under 30% is <strong>excellent</strong>, 30–50% is{' '}
          <strong>good</strong>, over 50% is <strong>risky</strong>.
        </p>
      </div>
      <div className={`health-score-body health-score-body--${band}`}>
        <div className="health-score-main">
          <span className="health-score-pct" aria-live="polite">
            {displayPct != null ? `${displayPct}%` : hasDebt ? '—' : '0%'}
          </span>
          <span className={`health-score-badge health-score-badge--${band}`}>{label}</span>
        </div>
        <div className="health-score-bar-track" aria-hidden>
          <div className="health-score-bar-fill" style={{ width: `${barWidth}%` }} />
        </div>
        <p className="health-score-note muted small">{subnote}</p>
      </div>
    </section>
  )
}
