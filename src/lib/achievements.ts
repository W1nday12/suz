import type { Progress } from '../store/types'
import { levelForXp } from './progress'

export interface AchievementDef {
  id: string
  title: string
  description: string
  icon: string
  gems: number
  tier: 'bronze' | 'silver' | 'gold'
  check: (progress: Progress) => boolean
}

const allUnitsDone = (progress: Progress): boolean =>
  Array.from({ length: 12 }, (_, index) => index + 1).every(
    (unit) => !!progress.completed[`u${unit}-l0`],
  )

export const achievements: AchievementDef[] = [
  {
    id: 'first_lesson',
    title: 'Беренче адым',
    description: 'Первый шаг: заверши свой первый урок',
    icon: 'footprints',
    gems: 10,
    tier: 'bronze',
    check: (p) => p.lessonsCompleted >= 1,
  },
  {
    id: 'unit_1',
    title: 'Исәнләшү остасы',
    description: 'Пройди контрольную точку первого юнита',
    icon: 'sparkles',
    gems: 15,
    tier: 'bronze',
    check: (p) => !!p.completed['u1-l0'],
  },
  {
    id: 'words_25',
    title: 'Сүз җыючы',
    description: 'Познакомься с 25 словами',
    icon: 'book',
    gems: 10,
    tier: 'bronze',
    check: (p) => p.seenWords.length >= 25,
  },
  {
    id: 'words_100',
    title: 'Сүз байлыгы',
    description: 'Познакомься с 100 словами',
    icon: 'library',
    gems: 25,
    tier: 'silver',
    check: (p) => p.seenWords.length >= 100,
  },
  {
    id: 'words_300',
    title: 'Бөтен сүзлек',
    description: 'Познакомься со всеми 300 словами курса',
    icon: 'crown',
    gems: 60,
    tier: 'gold',
    check: (p) => p.seenWords.length >= 300,
  },
  {
    id: 'streak_3',
    title: 'Кызыну',
    description: 'Занимайся 3 дня подряд',
    icon: 'flame',
    gems: 15,
    tier: 'bronze',
    check: (p) => p.streak >= 3,
  },
  {
    id: 'streak_7',
    title: 'Атналык стрик',
    description: 'Занимайся 7 дней подряд',
    icon: 'flame',
    gems: 30,
    tier: 'silver',
    check: (p) => p.streak >= 7,
  },
  {
    id: 'streak_30',
    title: 'Айлык стрик',
    description: 'Занимайся 30 дней подряд',
    icon: 'flame',
    gems: 100,
    tier: 'gold',
    check: (p) => p.streak >= 30,
  },
  {
    id: 'xp_500',
    title: 'Энергия',
    description: 'Набери 500 XP',
    icon: 'zap',
    gems: 20,
    tier: 'silver',
    check: (p) => p.xp >= 500,
  },
  {
    id: 'xp_2000',
    title: 'Мастер',
    description: 'Набери 2000 XP',
    icon: 'trophy',
    gems: 50,
    tier: 'gold',
    check: (p) => p.xp >= 2000,
  },
  {
    id: 'perfect_5',
    title: 'Хатасыз',
    description: 'Пройди 5 уроков без ошибок',
    icon: 'target',
    gems: 20,
    tier: 'silver',
    check: (p) => p.perfectLessons >= 5,
  },
  {
    id: 'perfect_20',
    title: 'Педант',
    description: 'Пройди 20 уроков без ошибок',
    icon: 'medal',
    gems: 60,
    tier: 'gold',
    check: (p) => p.perfectLessons >= 20,
  },
  {
    id: 'reviews_25',
    title: 'Кабатлау остасы',
    description: 'Проведи 25 сессий повторения',
    icon: 'repeat',
    gems: 25,
    tier: 'silver',
    check: (p) => p.reviewsCompleted >= 25,
  },
  {
    id: 'level_5',
    title: 'Бишенче дәрәҗә',
    description: 'Достигни 5 уровня',
    icon: 'star',
    gems: 30,
    tier: 'silver',
    check: (p) => levelForXp(p.xp) >= 5,
  },
  {
    id: 'all_units',
    title: 'Сүз остасы',
    description: 'Пройди контрольные точки всех 12 юнитов',
    icon: 'graduation',
    gems: 150,
    tier: 'gold',
    check: allUnitsDone,
  },
  {
    id: 'duel',
    title: 'Дуслар',
    description: 'Добавь результат друга в лигу двоих',
    icon: 'users',
    gems: 15,
    tier: 'bronze',
    check: (p) => p.league.length >= 1,
  },
]

export function checkAchievements(progress: Progress): { progress: Progress; unlocked: AchievementDef[] } {
  const unlocked = achievements.filter(
    (achievement) => !progress.achievements.includes(achievement.id) && achievement.check(progress),
  )
  if (!unlocked.length) return { progress, unlocked }

  const gems = progress.gems + unlocked.reduce((sum, achievement) => sum + achievement.gems, 0)
  return {
    progress: {
      ...progress,
      gems,
      achievements: [...progress.achievements, ...unlocked.map((achievement) => achievement.id)],
    },
    unlocked,
  }
}

export function achievementById(id: string): AchievementDef | undefined {
  return achievements.find((achievement) => achievement.id === id)
}
