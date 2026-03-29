import { useState } from 'react'
import { useCurrency } from '../context/CurrencyContext.jsx'

const defaultForm = {
  title: '',
  amount: '',
  type: 'expense',
  date: new Date().toISOString().slice(0, 16),
  medium: 'Visa',
  category: '',
}

export default function TransactionForm({ onCreated }) {
  const { baseCurrency } = useCurrency()
  const [form, setForm] = useState(defaultForm)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const iso = new Date(form.date).toISOString()
      await onCreated({
        title: form.title.trim(),
        amount: Number(form.amount),
        type: form.type,
        date: iso,
        medium: form.medium.trim() || 'Other',
        category: form.category.trim(),
      })
      setForm({
        ...defaultForm,
        date: new Date().toISOString().slice(0, 16),
      })
    } catch (err) {
      setError(err.message || 'Could not save')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form className="tx-form" onSubmit={handleSubmit}>
      <h3 className="tx-form-title">Quick add</h3>
      {error && <p className="form-error">{error}</p>}
      <div className="tx-form-grid">
        <label className="field">
          <span>Title</span>
          <input
            required
            value={form.title}
            onChange={(e) => update('title', e.target.value)}
            placeholder="e.g. Amazon"
          />
        </label>
        <label className="field">
          <span>Amount ({baseCurrency === 'INR' ? '₹ INR' : '$ USD'} — stored)</span>
          <input
            required
            type="number"
            min="0"
            step="0.01"
            value={form.amount}
            onChange={(e) => update('amount', e.target.value)}
          />
        </label>
        <label className="field">
          <span>Type</span>
          <select value={form.type} onChange={(e) => update('type', e.target.value)}>
            <option value="expense">Expense</option>
            <option value="income">Income</option>
          </select>
        </label>
        <label className="field">
          <span>Date</span>
          <input
            type="datetime-local"
            value={form.date}
            onChange={(e) => update('date', e.target.value)}
          />
        </label>
        <label className="field">
          <span>Medium</span>
          <input
            value={form.medium}
            onChange={(e) => update('medium', e.target.value)}
            placeholder="Visa, Paypal…"
          />
        </label>
        <label className="field">
          <span>Category</span>
          <input value={form.category} onChange={(e) => update('category', e.target.value)} placeholder="Optional" />
        </label>
      </div>
      <button type="submit" className="btn-primary" disabled={loading}>
        {loading ? 'Saving…' : 'Add transaction'}
      </button>
    </form>
  )
}
