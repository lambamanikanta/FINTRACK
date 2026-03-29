/** Client-side match for transaction title, medium, category, or amount text. */
export function transactionMatchesSearch(t, query) {
  const s = query.trim().toLowerCase()
  if (!s) return true
  return (
    (t.title || '').toLowerCase().includes(s) ||
    (t.medium || '').toLowerCase().includes(s) ||
    (t.category || '').toLowerCase().includes(s) ||
    String(t.amount ?? '').includes(s) ||
    (t.type || '').toLowerCase().includes(s)
  )
}
