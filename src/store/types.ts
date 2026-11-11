export interface Settings {
  theme: 'light' | 'dark' | 'system'
  script: 'cyrillic' | 'latin'
  immersion: 'off' | 'gradual' | 'full'
  heartsEnabled: boolean
  dailyGoal: number
  reduceMotion: boolean
}

export interface Profile {
  id: string
  name: string
  avatar: string
  createdAt: number
}

export interface WordStat {
  seen: number
  correct: number
  wrong: number
  strength: number
  due: number
  lastSeen: number
}

export interface LessonResult {
  unitId: number
  lesson: number
  bestAccuracy: number
  stars: number
  completedAt: number
  attempts: number
}

export interface DayHistory {
  date: string
  xp: number
  lessons: number
  reviews: number
  correct: number
  total: number
}

export type QuestType = 'xp' | 'lessons' | 'review' | 'perfect'

export interface Quest {
  id: string
  type: QuestType
  title: string
  target: number
  progress: number
  reward: number
  claimed: boolean
}

export interface Weekly {
  weekStart: string
  xp: number
  lessons: number
  reviews: number
  correct: number
  total: number
}

export interface LeagueEntry {
  id: string
  name: string
  avatar: string
  weekStart: string
  xp: number
  streak: number
  lessons: number
  accuracy: number
  importedAt: number
}

export interface Progress {
  xp: number
  gems: number
  hearts: number
  heartsUpdatedAt: number
  freezes: number
  streak: number
  bestStreak: number
  lastActiveDay: string | null
  dailyXp: number
  dailyDate: string
  completed: Record<string, LessonResult>
  wordStats: Record<string, WordStat>
  mistakes: Record<string, number>
  seenWords: string[]
  achievements: string[]
  history: Record<string, DayHistory>
  quests: { date: string; items: Quest[] }
  weekly: Weekly
  league: LeagueEntry[]
  settings: Settings
  lessonsCompleted: number
  reviewsCompleted: number
  perfectLessons: number
}

export interface LessonFinishPayload {
  unitId: number
  lesson: number
  correct: number
  wrong: number
  total: number
  durationSeconds: number
}

export interface ReviewFinishPayload {
  correct: number
  wrong: number
  total: number
}
