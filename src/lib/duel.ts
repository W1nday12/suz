import type { Profile, Progress } from '../store/types'
import { totalAccuracy } from './progress'

export interface DuelPayload {
  v: 1
  id: string
  name: string
  avatar: string
  weekStart: string
  xp: number
  streak: number
  lessons: number
  accuracy: number
}

function toBase64Url(text: string): string {
  const bytes = new TextEncoder().encode(text)
  let binary = ''
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte)
  })
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '')
}

function fromBase64Url(code: string): string | null {
  try {
    const normalized = code.replace(/-/g, '+').replace(/_/g, '/')
    const padded = normalized + '==='.slice((normalized.length + 3) % 4)
    const binary = atob(padded)
    const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0))
    return new TextDecoder().decode(bytes)
  } catch {
    return null
  }
}

export function buildDuelPayload(profile: Profile, progress: Progress): DuelPayload {
  return {
    v: 1,
    id: profile.id,
    name: profile.name,
    avatar: profile.avatar,
    weekStart: progress.weekly.weekStart,
    xp: progress.weekly.xp,
    streak: progress.streak,
    lessons: progress.weekly.lessons,
    accuracy: totalAccuracy(progress.weekly.correct, progress.weekly.total),
  }
}

export function encodeDuel(payload: DuelPayload): string {
  return toBase64Url(JSON.stringify(payload))
}

export function decodeDuel(code: string): DuelPayload | null {
  const json = fromBase64Url(code)
  if (!json) return null
  try {
    const parsed = JSON.parse(json) as DuelPayload
    if (parsed.v !== 1 || typeof parsed.name !== 'string' || typeof parsed.xp !== 'number') {
      return null
    }
    return parsed
  } catch {
    return null
  }
}

export function duelLink(payload: DuelPayload): string {
  const url = new URL(window.location.href)
  url.hash = `duel=${encodeDuel(payload)}`
  return url.toString()
}

export function parseDuelFromLocation(): DuelPayload | null {
  if (typeof window === 'undefined') return null
  const hash = window.location.hash
  const marker = '#duel='
  if (!hash.startsWith(marker)) return null
  return decodeDuel(hash.slice(marker.length))
}

export function clearDuelHash(): void {
  if (typeof window === 'undefined') return
  if (window.location.hash.startsWith('#duel=')) {
    history.replaceState(null, '', window.location.pathname + window.location.search)
  }
}
