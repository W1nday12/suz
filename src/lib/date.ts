export function dayKey(date = new Date()): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function weekKey(date = new Date()): string {
  const copy = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  const day = copy.getDay() || 7
  copy.setDate(copy.getDate() - day + 1)
  return dayKey(copy)
}

export function parseDay(key: string): Date {
  const [y, m, d] = key.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function addDays(date: Date, days: number): Date {
  const copy = new Date(date)
  copy.setDate(copy.getDate() + days)
  return copy
}

export function daysBetween(a: string, b: string): number {
  const first = parseDay(a).getTime()
  const second = parseDay(b).getTime()
  return Math.round((second - first) / 86_400_000)
}

export function humanDay(key: string): string {
  const date = parseDay(key)
  return new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'long' }).format(date)
}

export function weekdayShort(key: string): string {
  const date = parseDay(key)
  return new Intl.DateTimeFormat('ru-RU', { weekday: 'short' }).format(date)
}

export function lastDays(count: number, end = new Date()): string[] {
  const out: string[] = []
  for (let i = count - 1; i >= 0; i -= 1) {
    out.push(dayKey(addDays(end, -i)))
  }
  return out
}

export function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = Math.round(seconds % 60)
  return m > 0 ? `${m} мин ${s} с` : `${s} с`
}
