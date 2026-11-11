import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import { get as idbGet, set as idbSet, del as idbDel } from 'idb-keyval'
import type {
  LessonFinishPayload,
  LessonResult,
  LeagueEntry,
  Profile,
  Progress,
  ReviewFinishPayload,
  Settings,
  WordStat,
} from './types'
import { addDays, dayKey, daysBetween, weekKey } from '../lib/date'
import { answerWordStat, HEART_MAX, normalizeHearts } from '../lib/srs'
import { generateQuests, updateQuests } from '../lib/quests'
import { checkAchievements, type AchievementDef } from '../lib/achievements'
import { totalAccuracy } from '../lib/progress'

const defaultSettings: Settings = {
  theme: 'system',
  script: 'cyrillic',
  immersion: 'gradual',
  heartsEnabled: true,
  dailyGoal: 20,
  reduceMotion: false,
}

export function createProgress(dailyGoal = 20): Progress {
  return {
    xp: 0,
    gems: 20,
    hearts: HEART_MAX,
    heartsUpdatedAt: Date.now(),
    freezes: 0,
    streak: 0,
    bestStreak: 0,
    lastActiveDay: null,
    dailyXp: 0,
    dailyDate: dayKey(),
    completed: {},
    wordStats: {},
    mistakes: {},
    seenWords: [],
    achievements: [],
    history: {},
    quests: { date: dayKey(), items: generateQuests(dayKey()) },
    weekly: {
      weekStart: weekKey(),
      xp: 0,
      lessons: 0,
      reviews: 0,
      correct: 0,
      total: 0,
    },
    league: [],
    settings: { ...defaultSettings, dailyGoal },
    lessonsCompleted: 0,
    reviewsCompleted: 0,
    perfectLessons: 0,
  }
}

const fallbackProgress = createProgress()

export function normalizeProgress(progress: Progress, now = Date.now()): Progress {
  let next = progress
  const today = dayKey(new Date(now))

  const hearts = normalizeHearts(next.hearts, next.heartsUpdatedAt, now)
  if (hearts.hearts !== next.hearts) {
    next = { ...next, hearts: hearts.hearts, heartsUpdatedAt: hearts.heartsUpdatedAt }
  }

  if (next.dailyDate !== today) {
    next = { ...next, dailyDate: today, dailyXp: 0 }
  }

  const currentWeek = weekKey(new Date(now))
  if (next.weekly.weekStart !== currentWeek) {
    next = {
      ...next,
      weekly: {
        weekStart: currentWeek,
        xp: 0,
        lessons: 0,
        reviews: 0,
        correct: 0,
        total: 0,
      },
    }
  }

  if (next.quests.date !== today) {
    next = { ...next, quests: { date: today, items: generateQuests(today) } }
  }

  if (next.lastActiveDay) {
    const diff = daysBetween(next.lastActiveDay, today)
    if (diff > 1) {
      if (diff === 2 && next.freezes > 0) {
        next = {
          ...next,
          freezes: next.freezes - 1,
          lastActiveDay: dayKey(addDays(new Date(now), -1)),
        }
      } else {
        next = { ...next, streak: 0 }
      }
    }
  }

  return next
}

function touchStreak(progress: Progress, now = Date.now()): Progress {
  const today = dayKey(new Date(now))
  const diff = progress.lastActiveDay ? daysBetween(progress.lastActiveDay, today) : null
  let streak = progress.streak
  let freezes = progress.freezes

  if (diff === null || diff > 1) {
    streak = 1
  } else if (diff === 1) {
    streak += 1
  } else if (diff === 0 && streak === 0) {
    streak = 1
  }

  if (streak > 0 && streak % 7 === 0 && freezes < 3) {
    freezes += 1
  }

  return {
    ...progress,
    streak,
    bestStreak: Math.max(progress.bestStreak, streak),
    freezes,
    lastActiveDay: today,
  }
}

function bumpHistory(
  progress: Progress,
  patch: { xp?: number; lessons?: number; reviews?: number; correct?: number; total?: number },
): Progress {
  const today = dayKey()
  const existing = progress.history[today] ?? {
    date: today,
    xp: 0,
    lessons: 0,
    reviews: 0,
    correct: 0,
    total: 0,
  }
  return {
    ...progress,
    history: {
      ...progress.history,
      [today]: {
        ...existing,
        xp: existing.xp + (patch.xp ?? 0),
        lessons: existing.lessons + (patch.lessons ?? 0),
        reviews: existing.reviews + (patch.reviews ?? 0),
        correct: existing.correct + (patch.correct ?? 0),
        total: existing.total + (patch.total ?? 0),
      },
    },
  }
}

export interface LessonReward {
  xp: number
  gems: number
  stars: number
  accuracy: number
  perfect: boolean
  firstCompletion: boolean
  passed: boolean
  unlocked: AchievementDef[]
}

export interface ReviewReward {
  xp: number
  gems: number
  accuracy: number
  unlocked: AchievementDef[]
}

interface AppState {
  profiles: Profile[]
  activeProfileId: string | null
  progressById: Record<string, Progress>
  createProfile: (name: string, avatar: string, dailyGoal?: number) => string
  selectProfile: (id: string) => void
  updateSettings: (patch: Partial<Settings>) => void
  tick: () => void
  answerWord: (wordId: string, correct: boolean) => void
  loseHeart: () => void
  refillHearts: (cost?: number) => boolean
  spendGems: (amount: number) => boolean
  finishLesson: (payload: LessonFinishPayload) => LessonReward
  finishReview: (payload: ReviewFinishPayload) => ReviewReward
  importOpponent: (entry: Omit<LeagueEntry, 'importedAt'>) => void
  removeOpponent: (id: string) => void
  resetProgress: () => void
  addProfile: (name: string, avatar: string) => string
}

const storage = createJSONStorage(() => ({
  getItem: async (name: string) => (await idbGet<string>(name)) ?? null,
  setItem: async (name: string, value: string) => {
    await idbSet(name, value)
  },
  removeItem: async (name: string) => {
    await idbDel(name)
  },
}))

export const useStore = create<AppState>()(
  persist(
    (set, get) => {
      const withActive = (fn: (progress: Progress) => Progress): void => {
        const state = get()
        const id = state.activeProfileId
        if (!id) return
        const current = state.progressById[id]
        if (!current) return
        const next = fn(normalizeProgress(current))
        set((s) => ({ progressById: { ...s.progressById, [id]: next } }))
      }

      return {
        profiles: [],
        activeProfileId: null,
        progressById: {},

        createProfile: (name, avatar, dailyGoal = 20) => {
          const id =
            typeof crypto !== 'undefined' && 'randomUUID' in crypto
              ? crypto.randomUUID()
              : `p-${Date.now()}`
          const profile: Profile = { id, name, avatar, createdAt: Date.now() }
          set((state) => ({
            profiles: [...state.profiles, profile],
            activeProfileId: id,
            progressById: { ...state.progressById, [id]: createProgress(dailyGoal) },
          }))
          return id
        },

        addProfile: (name, avatar) => {
          return get().createProfile(name, avatar, get().profiles.length ? 20 : 20)
        },

        selectProfile: (id) => {
          if (get().profiles.some((profile) => profile.id === id)) {
            set({ activeProfileId: id })
          }
        },

        updateSettings: (patch) => {
          withActive((progress) => ({
            ...progress,
            settings: { ...progress.settings, ...patch },
          }))
        },

        tick: () => {
          withActive((progress) => progress)
        },

        answerWord: (wordId, correct) => {
          withActive((progress) => {
            const stat = answerWordStat(progress.wordStats[wordId], correct)
            const seenWords = progress.seenWords.includes(wordId)
              ? progress.seenWords
              : [...progress.seenWords, wordId]
            const mistakeCount = progress.mistakes[wordId] ?? 0
            const mistakes = { ...progress.mistakes }
            if (correct) {
              if (mistakeCount > 0) mistakes[wordId] = mistakeCount - 1
              if (mistakes[wordId] === 0) delete mistakes[wordId]
            } else {
              mistakes[wordId] = mistakeCount + 1
            }
            return {
              ...progress,
              wordStats: { ...progress.wordStats, [wordId]: stat },
              seenWords,
              mistakes,
            }
          })
        },

        loseHeart: () => {
          withActive((progress) => {
            if (!progress.settings.heartsEnabled) return progress
            return {
              ...progress,
              hearts: Math.max(0, progress.hearts - 1),
              heartsUpdatedAt: progress.hearts >= HEART_MAX ? Date.now() : progress.heartsUpdatedAt,
            }
          })
        },

        refillHearts: (cost = 50) => {
          const state = get()
          const id = state.activeProfileId
          if (!id) return false
          const progress = state.progressById[id]
          if (!progress || progress.gems < cost || progress.hearts >= HEART_MAX) return false
          set((s) => ({
            progressById: {
              ...s.progressById,
              [id]: {
                ...progress,
                gems: progress.gems - cost,
                hearts: HEART_MAX,
                heartsUpdatedAt: Date.now(),
              },
            },
          }))
          return true
        },

        spendGems: (amount) => {
          const state = get()
          const id = state.activeProfileId
          if (!id) return false
          const progress = state.progressById[id]
          if (!progress || progress.gems < amount) return false
          set((s) => ({
            progressById: {
              ...s.progressById,
              [id]: { ...progress, gems: progress.gems - amount },
            },
          }))
          return true
        },

        finishLesson: (payload) => {
          const state = get()
          const id = state.activeProfileId
          const baseProgress = id ? state.progressById[id] : undefined
          if (!id || !baseProgress) {
            return {
              xp: 0,
              gems: 0,
              stars: 0,
              accuracy: 0,
              perfect: false,
              firstCompletion: false,
              passed: false,
              unlocked: [],
            }
          }

          let progress = normalizeProgress(baseProgress)
          const accuracy = totalAccuracy(payload.correct, payload.total)
          const perfect = payload.wrong === 0 && payload.total > 0
          const isCheckpoint = payload.lesson === 0
          const passed = !isCheckpoint || accuracy >= 80
          const stars = perfect ? 3 : accuracy >= 80 ? 2 : 1
          const key = `u${payload.unitId}-l${payload.lesson}`
          const previous = progress.completed[key]
          const firstCompletion = !previous

          let xp = passed ? 10 + (perfect ? 5 : 0) + Math.min(5, Math.floor(payload.correct / 3)) : 3
          if (isCheckpoint && passed) xp = 20 + (perfect ? 10 : 0)
          const gems = passed
            ? (firstCompletion ? 3 : 1) + (perfect ? 2 : 0) + (isCheckpoint ? 5 : 0)
            : 0

          if (passed) {
            const result: LessonResult = {
              unitId: payload.unitId,
              lesson: payload.lesson,
              bestAccuracy: Math.max(previous?.bestAccuracy ?? 0, accuracy),
              stars: Math.max(previous?.stars ?? 0, stars),
              completedAt: Date.now(),
              attempts: (previous?.attempts ?? 0) + 1,
            }
            progress = {
              ...progress,
              completed: { ...progress.completed, [key]: result },
              lessonsCompleted: progress.lessonsCompleted + (firstCompletion ? 1 : 0),
              perfectLessons: progress.perfectLessons + (perfect ? 1 : 0),
            }
          }

          progress = {
            ...progress,
            xp: progress.xp + xp,
            gems: progress.gems + gems,
            dailyXp: progress.dailyXp + xp,
            weekly: {
              ...progress.weekly,
              xp: progress.weekly.xp + xp,
              lessons: progress.weekly.lessons + (passed ? 1 : 0),
              correct: progress.weekly.correct + payload.correct,
              total: progress.weekly.total + payload.total,
            },
          }

          progress = bumpHistory(progress, {
            xp,
            lessons: passed ? 1 : 0,
            correct: payload.correct,
            total: payload.total,
          })

          progress = updateQuests(progress, 'xp', xp)
          if (passed) progress = updateQuests(progress, 'lessons', 1)
          if (perfect) progress = updateQuests(progress, 'perfect', 1)

          if (passed) progress = touchStreak(progress)

          const checked = checkAchievements(progress)
          progress = checked.progress

          set((s) => ({ progressById: { ...s.progressById, [id]: progress } }))
          return {
            xp,
            gems,
            stars,
            accuracy,
            perfect,
            firstCompletion,
            passed,
            unlocked: checked.unlocked,
          }
        },

        finishReview: (payload) => {
          const state = get()
          const id = state.activeProfileId
          const baseProgress = id ? state.progressById[id] : undefined
          if (!id || !baseProgress) {
            return { xp: 0, gems: 0, accuracy: 0, unlocked: [] }
          }

          let progress = normalizeProgress(baseProgress)
          const accuracy = totalAccuracy(payload.correct, payload.total)
          const xp = 5 + Math.min(5, payload.correct)
          const gems = 1 + (payload.wrong === 0 ? 1 : 0)

          progress = {
            ...progress,
            xp: progress.xp + xp,
            gems: progress.gems + gems,
            dailyXp: progress.dailyXp + xp,
            reviewsCompleted: progress.reviewsCompleted + 1,
            weekly: {
              ...progress.weekly,
              xp: progress.weekly.xp + xp,
              reviews: progress.weekly.reviews + 1,
              correct: progress.weekly.correct + payload.correct,
              total: progress.weekly.total + payload.total,
            },
          }
          progress = bumpHistory(progress, {
            xp,
            reviews: 1,
            correct: payload.correct,
            total: payload.total,
          })
          progress = updateQuests(progress, 'xp', xp)
          progress = updateQuests(progress, 'review', payload.total)
          progress = touchStreak(progress)
          const checked = checkAchievements(progress)
          progress = checked.progress

          set((s) => ({ progressById: { ...s.progressById, [id]: progress } }))
          return { xp, gems, accuracy, unlocked: checked.unlocked }
        },

        importOpponent: (entry) => {
          withActive((progress) => {
            const filtered = progress.league.filter(
              (item) => !(item.id === entry.id && item.weekStart === entry.weekStart),
            )
            const next = {
              ...progress,
              league: [...filtered, { ...entry, importedAt: Date.now() }],
            }
            return checkAchievements(next).progress
          })
        },

        removeOpponent: (opponentId) => {
          withActive((progress) => ({
            ...progress,
            league: progress.league.filter((item) => item.id !== opponentId),
          }))
        },

        resetProgress: () => {
          const state = get()
          const id = state.activeProfileId
          if (!id) return
          set((s) => ({
            progressById: { ...s.progressById, [id]: createProgress() },
          }))
        },
      }
    },
    {
      name: 'suz-progress-v1',
      version: 1,
      storage,
      partialize: (state) => ({
        profiles: state.profiles,
        activeProfileId: state.activeProfileId,
        progressById: state.progressById,
      }),
    },
  ),
)

export function activeProgress(state: Pick<AppState, 'activeProfileId' | 'progressById'>): Progress {
  if (!state.activeProfileId) return fallbackProgress
  return state.progressById[state.activeProfileId] ?? fallbackProgress
}

export function useActiveProgress(): Progress {
  return useStore((state) => activeProgress(state))
}

export function useSettings(): Settings {
  return useStore((state) => activeProgress(state).settings)
}

export function currentLevelWordStat(
  progress: Progress,
  wordId: string,
): WordStat | undefined {
  return progress.wordStats[wordId]
}

export type { AchievementDef }
