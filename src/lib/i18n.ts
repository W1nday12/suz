import { useCallback } from 'react'
import { useStore, activeProgress } from '../store/useStore'
import type { Progress } from '../store/types'
import type { Word } from '../data/types'

export type UiKey =
  | 'learn'
  | 'review'
  | 'friends'
  | 'dictionary'
  | 'me'
  | 'lesson'
  | 'word'
  | 'sentence'
  | 'check'
  | 'correct'
  | 'mistake'
  | 'continue'
  | 'question'
  | 'answer'
  | 'repeat'
  | 'start'
  | 'practice'
  | 'finish'

interface Label {
  ru: string
  tt: string
  word?: string
  unit?: number
}

const labels: Record<UiKey, Label> = {
  learn: { ru: 'Учить', tt: 'Өйрәнү', word: 'u11-w19' },
  review: { ru: 'Повторение', tt: 'Кабатлау', word: 'u12-w15' },
  friends: { ru: 'Друзья', tt: 'Дуслар', word: 'u2-w20' },
  dictionary: { ru: 'Словарь', tt: 'Сүзлек', word: 'u12-w9' },
  me: { ru: 'Профиль', tt: 'Мин', word: 'u1-w17' },
  lesson: { ru: 'Урок', tt: 'Дәрес', word: 'u1-w25' },
  word: { ru: 'Слово', tt: 'Сүз', word: 'u1-w24' },
  sentence: { ru: 'Предложение', tt: 'Җөмлә', word: 'u12-w1' },
  check: { ru: 'Проверить', tt: 'Тикшерү', word: 'u12-w16' },
  correct: { ru: 'Правильно', tt: 'Дөрес', word: 'u12-w13' },
  mistake: { ru: 'Ошибка', tt: 'Хата', word: 'u12-w14' },
  continue: { ru: 'Продолжить', tt: 'Алга', unit: 1 },
  question: { ru: 'Вопрос', tt: 'Сорау', word: 'u12-w3' },
  answer: { ru: 'Ответ', tt: 'Җавап', word: 'u12-w4' },
  repeat: { ru: 'Повторить', tt: 'Кабатлау', word: 'u12-w15' },
  start: { ru: 'Начать', tt: 'Башлау', unit: 1 },
  practice: { ru: 'Практика', tt: 'Эшләү', word: 'u11-w20' },
  finish: { ru: 'Завершить', tt: 'Тәмамлау', unit: 12 },
}

export function labelFor(key: UiKey, progress: Progress): string {
  const label = labels[key]
  if (!label) return key
  const immersion = progress.settings.immersion
  if (immersion === 'off') return label.ru
  if (immersion === 'full') return label.tt
  const unlocked =
    (label.word && progress.seenWords.includes(label.word)) ||
    (label.unit && !!progress.completed[`u${label.unit}-l0`])
  return unlocked ? label.tt : label.ru
}

export function useT() {
  const immersion = useStore((state) => activeProgress(state).settings.immersion)
  const seenWords = useStore((state) => activeProgress(state).seenWords)
  const completed = useStore((state) => activeProgress(state).completed)

  return useCallback(
    (key: UiKey) => {
      const label = labels[key]
      if (!label) return key
      if (immersion === 'off') return label.ru
      if (immersion === 'full') return label.tt
      const unlocked =
        (label.word && seenWords.includes(label.word)) ||
        (label.unit && !!completed[`u${label.unit}-l0`])
      return unlocked ? label.tt : label.ru
    },
    [immersion, seenWords, completed],
  )
}

export function useScript(): 'cyrillic' | 'latin' {
  return useStore((state) => activeProgress(state).settings.script)
}

export function wordText(word: Word, script: 'cyrillic' | 'latin'): string {
  return script === 'latin' ? word.latin : word.tt
}

export function secondaryWordText(word: Word, script: 'cyrillic' | 'latin'): string {
  return script === 'latin' ? word.tt : word.latin
}
