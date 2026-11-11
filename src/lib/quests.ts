import type { Progress, Quest, QuestType } from '../store/types'

function hash(text: string): number {
  let h = 2166136261
  for (let i = 0; i < text.length; i += 1) {
    h ^= text.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return Math.abs(h)
}

const rotating: Array<Omit<Quest, 'progress' | 'claimed'>> = [
  {
    id: 'review10',
    type: 'review',
    title: 'Повтори 10 слов',
    target: 10,
    reward: 5,
  },
  {
    id: 'perfect1',
    type: 'perfect',
    title: 'Пройди урок без ошибок',
    target: 1,
    reward: 8,
  },
]

export function generateQuests(date: string): Quest[] {
  const base: Quest[] = [
    {
      id: 'xp20',
      type: 'xp',
      title: 'Набери 20 XP',
      target: 20,
      reward: 5,
      progress: 0,
      claimed: false,
    },
    {
      id: 'lessons2',
      type: 'lessons',
      title: 'Пройди 2 урока',
      target: 2,
      reward: 5,
      progress: 0,
      claimed: false,
    },
  ]

  const extra = rotating[hash(date) % rotating.length]
  return [...base, { ...extra, progress: 0, claimed: false }]
}

export function updateQuests(progress: Progress, type: QuestType, amount: number): Progress {
  if (amount <= 0) return progress
  let gems = progress.gems
  const items = progress.quests.items.map((quest) => {
    if (quest.type !== type || quest.claimed) return quest
    const next = Math.min(quest.target, quest.progress + amount)
    const done = next >= quest.target
    if (done) gems += quest.reward
    return {
      ...quest,
      progress: next,
      claimed: done,
    }
  })
  return { ...progress, gems, quests: { ...progress.quests, items } }
}
