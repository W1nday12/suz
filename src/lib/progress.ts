import type { Progress } from '../store/types'

export const XP_PER_LEVEL = 150

export function levelForXp(xp: number): number {
  return Math.floor(xp / XP_PER_LEVEL) + 1
}

export function levelInfo(xp: number): {
  level: number
  current: number
  need: number
  percent: number
} {
  const level = levelForXp(xp)
  const current = xp % XP_PER_LEVEL
  return {
    level,
    current,
    need: XP_PER_LEVEL,
    percent: Math.round((current / XP_PER_LEVEL) * 100),
  }
}

export function totalAccuracy(correct: number, total: number): number {
  if (!total) return 0
  return Math.round((correct / total) * 100)
}
