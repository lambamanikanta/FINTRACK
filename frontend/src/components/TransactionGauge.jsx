import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import { useCurrency } from '../context/CurrencyContext.jsx'

const INCOME_COLOR = '#059669'
const EXPENSE_COLOR = '#ea580c'

export default function TransactionGauge({ income, expense, volume }) {
  const { format } = useCurrency()
  const inc = Math.max(0, Number(income) || 0)
  const exp = Math.max(0, Number(expense) || 0)
  const totalFlow = inc + exp
  const data = [
    { name: 'Income', value: totalFlow > 0 ? inc : 1, fill: INCOME_COLOR },
    { name: 'Expense', value: totalFlow > 0 ? exp : 1, fill: EXPENSE_COLOR },
  ]

  const net = inc - exp
  const netLabel = net >= 0 ? 'Net positive' : 'Net spend'

  return (
    <div className="panel gauge-panel gauge-panel-clear">
      <div className="panel-head">
        <h2 className="panel-title">Income vs expense</h2>
      </div>
      <p className="gauge-caption muted small">Arc shows share of income (green) and expense (orange) this month.</p>
      <div className="gauge-wrap gauge-wrap-clear">
        <ResponsiveContainer width="100%" height={220}>
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="85%"
              startAngle={180}
              endAngle={0}
              innerRadius="58%"
              outerRadius="92%"
              paddingAngle={4}
              cornerRadius={4}
              stroke="#ffffff"
              strokeWidth={2}
            >
              {data.map((entry) => (
                <Cell key={entry.name} fill={entry.fill} />
              ))}
            </Pie>
            <Tooltip
              formatter={(val, name) => [format(val), name]}
              contentStyle={{
                background: 'var(--surface-elevated)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 8,
              }}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="gauge-center gauge-center-clear">
          <p className="gauge-net-label">{netLabel}</p>
          <p className="gauge-net">{format(net)}</p>
          <p className="gauge-total-sub muted small">Volume {format(volume || 0)}</p>
        </div>
      </div>
      <ul className="gauge-legend gauge-legend-clear">
        <li>
          <span className="dot" style={{ background: INCOME_COLOR }} /> Income — {format(inc)}
        </li>
        <li>
          <span className="dot" style={{ background: EXPENSE_COLOR }} /> Expense — {format(exp)}
        </li>
      </ul>
    </div>
  )
}
