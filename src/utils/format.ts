export function formatCurrency(amount: number | string, currency = 'INR'): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
    maximumFractionDigits: 2,
  }).format(Number(amount))
}

/** Quantity display: whole numbers as `1`, halves as `0.5` (never `1.000`). */
export function formatQuantity(value?: number | string | null): string {
  if (value === undefined || value === null || value === '') return '—'
  const n = Number(String(value).trim().replace(',', '.'))
  if (!Number.isFinite(n)) return String(value)
  const rounded = Math.round(n * 10) / 10
  if (Math.abs(rounded - Math.round(rounded)) < 1e-9) {
    return String(Math.round(rounded))
  }
  return rounded.toFixed(1)
}

export function formatLiters(value?: number | string | null): string {
  const qty = formatQuantity(value)
  return qty === '—' ? '—' : `${qty} L`
}

export function formatDate(value?: string | null): string {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date)
}

export function downloadCsv(filename: string, rows: string[][]): void {
  const escape = (cell: string) => `"${cell.replaceAll('"', '""')}"`
  const csv = rows.map((row) => row.map((c) => escape(String(c))).join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}
