import type { WordStat } from '../store/types'

const DAY = 86_400_000
const MINUTE = 60_000

export const MAX_STRENGTH = 5
export const HEART_MAX = 5
export const HEART_REGEN_MS = 20 * MINUTE

export function emptyWordStat(): WordStat {
  return {
    seen: 0,
    correct: 0,
    wrong: 0,
    strength: 0,
    due: 0,
    lastSeen: 0,
  }
}

export function answerWordStat(
  previous: WordStat | undefined,
  correct: boolean,
  now = Date.now(),
): WordStat {
  const stat = previous ? { ...previous } : emptyWordStat()
  stat.seen += 1
  stat.lastSeen = now

  if (correct) {
    stat.correct += 1
    stat.strength = Math.min(MAX_STRENGTH, stat.strength + 1)
    const days = [0, 1, 2, 4, 7, 14, 30][stat.strength] ?? 30
    stat.due = now + days * DAY
  } else {
    stat.wrong += 1
    stat.strength = Math.max(1, stat.strength - 1)
    stat.due = now + 10 * MINUTE
  }

  return stat
}

export function isDue(stat: WordStat | undefined, now = Date.now()): boolean {
  return !!stat && stat.seen > 0 && stat.due <= now
}

export function pickReviewWords(
  wordStats: Record<string, WordStat>,
  limit: number,
  now = Date.now(),
): string[] {
  const entries = Object.entries(wordStats).filter(([, stat]) => stat.seen > 0)
  const due = entries
    .filter(([, stat]) => stat.due <= now)
    .sort((a, b) => a[1].due - b[1].due)
    .map(([id]) => id)

  if (due.length >= limit) return due.slice(0, limit)

  const rest = entries
    .filter(([id]) => !due.includes(id))
    .sort((a, b) => {
      if (a[1].strength !== b[1].strength) return a[1].strength - b[1].strength
      return a[1].lastSeen - b[1].lastSeen
    })
    .map(([id]) => id)

  return [...due, ...rest].slice(0, limit)
}

export function normalizeHearts(
  hearts: number,
  heartsUpdatedAt: number,
  now = Date.now(),
): { hearts: number; heartsUpdatedAt: number } {
  if (hearts >= HEART_MAX) return { hearts: HEART_MAX, heartsUpdatedAt: now }
  const regen = Math.floor((now - heartsUpdatedAt) / HEART_REGEN_MS)
  if (regen <= 0) return { hearts, heartsUpdatedAt }
  return {
    hearts: Math.min(HEART_MAX, hearts + regen),
    heartsUpdatedAt: now - ((now - heartsUpdatedAt) % HEART_REGEN_MS),
  }
}

export function masteryLabel(strength: number): string {
  if (strength <= 1) return 'Новое'
  if (strength <= 3) return 'В процессе'
  if (strength === 4) return 'Хорошо'
  return 'Выучено'
}
