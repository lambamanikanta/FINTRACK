import { useCallback, useEffect, useState } from 'react'
import { loansApi } from '../services/api.js'
import { useCurrency } from '../context/CurrencyContext.jsx'

const defaultForm = {
  title: '',
  lender: '',
  principal: '',
  paidAmount: '0',
  monthlyPayment: '',
  interestRateAnnual: '',
  startDate: new Date().toISOString().slice(0, 10),
  endDate: '',
  notes: '',
}

export default function Loans() {
  const { format } = useCurrency()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState(defaultForm)
  const [error, setError] = useState('')
  const [busyId, setBusyId] = useState(null)
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const listRes = await loansApi.list()
      setItems(listRes.items || [])
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  function update(f, v) {
    setForm((prev) => ({ ...prev, [f]: v }))
  }

  function formatLoanError(err) {
    const d = err.data
    if (d?.errors?.length) {
      return d.errors
        .map((e) => e.msg || e.message || `${e.path || e.type || ''}`.trim())
        .filter(Boolean)
        .join('; ')
    }
    return err.message || 'Could not save loan'
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSaving(true)
    try {
      const body = {
        title: form.title.trim(),
        lender: form.lender.trim(),
        principal: Number(form.principal),
        paidAmount: Number(form.paidAmount || 0),
        monthlyPayment: form.monthlyPayment === '' ? 0 : Number(form.monthlyPayment),
        interestRateAnnual: form.interestRateAnnual === '' ? 0 : Number(form.interestRateAnnual),
        startDate: form.startDate,
        notes: form.notes.trim(),
        status: 'active',
      }
      if (form.endDate) body.endDate = form.endDate
      await loansApi.create(body)
      setForm({ ...defaultForm, startDate: new Date().toISOString().slice(0, 10) })
      await load()
    } catch (err) {
      setError(formatLoanError(err))
    } finally {
      setSaving(false)
    }
  }

  async function recordPayment(loan) {
    const raw = window.prompt(`Add payment toward "${loan.title}" (${format(loan.principal - loan.paidAmount)} remaining)`, '')
    if (raw == null || raw === '') return
    const amt = Number(raw)
    if (!Number.isFinite(amt) || amt <= 0) return
    setBusyId(loan._id)
    try {
      const nextPaid = Math.min(loan.principal, loan.paidAmount + amt)
      const status = nextPaid >= loan.principal ? 'paid_off' : loan.status
      await loansApi.update(loan._id, { paidAmount: nextPaid, status })
      await load()
    } finally {
      setBusyId(null)
    }
  }

  async function markPaidOff(loan) {
    setBusyId(loan._id)
    try {
      await loansApi.update(loan._id, { paidAmount: loan.principal, status: 'paid_off' })
      await load()
    } finally {
      setBusyId(null)
    }
  }

  async function removeLoan(id) {
    if (!window.confirm('Delete this loan record?')) return
    setBusyId(id)
    try {
      await loansApi.remove(id)
      await load()
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="loans-page">
      <h1 className="page-title">Loans</h1>
      <p className="muted section-lead">Track principal, payments, and payoff status. Amounts use your stored currency.</p>

      <section className="loans-section">
        <h2 className="loans-section-title">Add loan</h2>
        <form className="loan-form" onSubmit={handleSubmit}>
          {error && <p className="form-error">{error}</p>}
          <div className="loan-form-grid">
            <label className="field">
              <span>Title</span>
              <input required value={form.title} onChange={(e) => update('title', e.target.value)} placeholder="Home loan" />
            </label>
            <label className="field">
              <span>Lender</span>
              <input value={form.lender} onChange={(e) => update('lender', e.target.value)} placeholder="Bank name" />
            </label>
            <label className="field">
              <span>Principal</span>
              <input required type="number" min="0" step="0.01" value={form.principal} onChange={(e) => update('principal', e.target.value)} />
            </label>
            <label className="field">
              <span>Already paid</span>
              <input type="number" min="0" step="0.01" value={form.paidAmount} onChange={(e) => update('paidAmount', e.target.value)} />
            </label>
            <label className="field">
              <span>Monthly payment</span>
              <input type="number" min="0" step="0.01" value={form.monthlyPayment} onChange={(e) => update('monthlyPayment', e.target.value)} />
            </label>
            <label className="field">
              <span>Interest % (annual)</span>
              <input type="number" min="0" step="0.01" value={form.interestRateAnnual} onChange={(e) => update('interestRateAnnual', e.target.value)} />
            </label>
            <label className="field">
              <span>Start date</span>
              <input type="date" required value={form.startDate} onChange={(e) => update('startDate', e.target.value)} />
            </label>
            <label className="field">
              <span>End date (optional)</span>
              <input type="date" value={form.endDate} onChange={(e) => update('endDate', e.target.value)} />
            </label>
            <label className="field loan-notes">
              <span>Notes</span>
              <input value={form.notes} onChange={(e) => update('notes', e.target.value)} />
            </label>
          </div>
          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? 'Saving…' : 'Add loan'}
          </button>
        </form>
      </section>

      {loading ? (
        <p className="muted">Loading loans…</p>
      ) : (
        <section className="loans-section loans-list-section">
          <h2 className="loans-section-title">Your loans</h2>
          <div className="loans-table-wrap">
            <table className="tx-table loans-table loans-table-responsive">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Lender</th>
                  <th className="num">Principal</th>
                  <th className="num">Paid</th>
                  <th className="num">Outstanding</th>
                  <th>Status</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {items.length ? (
                  items.map((l) => {
                    const out = Math.max(0, l.principal - l.paidAmount)
                    return (
                      <tr key={l._id}>
                        <td className="loan-title" data-label="Title">
                          {l.title}
                        </td>
                        <td className="muted" data-label="Lender">
                          {l.lender || '—'}
                        </td>
                        <td className="num" data-label="Principal">
                          {format(l.principal)}
                        </td>
                        <td className="num" data-label="Paid">
                          {format(l.paidAmount)}
                        </td>
                        <td className="num" data-label="Outstanding">
                          {format(out)}
                        </td>
                        <td data-label="Status">
                          <span className={`loan-status loan-status-${l.status}`}>{l.status.replace('_', ' ')}</span>
                        </td>
                        <td className="loan-actions" data-label="Actions">
                          {l.status === 'active' && out > 0 && (
                            <>
                              <button type="button" className="btn-link" disabled={busyId === l._id} onClick={() => recordPayment(l)}>
                                Pay
                              </button>
                              <button type="button" className="btn-link" disabled={busyId === l._id} onClick={() => markPaidOff(l)}>
                                Mark paid
                              </button>
                            </>
                          )}
                          <button type="button" className="btn-link danger" disabled={busyId === l._id} onClick={() => removeLoan(l._id)}>
                            Delete
                          </button>
                        </td>
                      </tr>
                    )
                  })
                ) : (
                  <tr>
                    <td colSpan={7} className="tx-empty">
                      No loans yet. Add one above.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  )
}
