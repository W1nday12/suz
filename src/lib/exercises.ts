import {
  allWords,
  getLessonSentences,
  getLessonWords,
  getUnit,
  wordById,
} from '../data/course'
import type { Sentence, Word } from '../data/types'

export interface ChooseExercise {
  kind: 'choose'
  id: string
  mode: 'tt-ru' | 'ru-tt' | 'emoji'
  prompt: string
  promptRu: string
  sub?: string
  options: string[]
  answer: string
  answerTt: string
  answerRu: string
  optionLang: 'tt' | 'ru'
  wordId: string
  reinforced?: boolean
}

export interface MatchExercise {
  kind: 'match'
  id: string
  pairs: Array<{ wordId: string; tt: string; ru: string }>
}

export interface BuildExercise {
  kind: 'build'
  id: string
  sentenceId: string
  ru: string
  tokens: string[]
  answer: string[]
  wordIds: string[]
}

export interface BlankExercise {
  kind: 'blank'
  id: string
  sentenceId: string
  before: string
  after: string
  ru: string
  options: string[]
  answer: string
  wordId: string
}

export interface TypeExercise {
  kind: 'type'
  id: string
  ru: string
  answer: string
  latin: string
  emoji: string
  wordId: string
}

export type Exercise =
  | ChooseExercise
  | MatchExercise
  | BuildExercise
  | BlankExercise
  | TypeExercise

function mulberry32(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function shuffle<T>(items: T[], rng: () => number): T[] {
  const out = [...items]
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1))
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}

function valueOf(word: Word, lang: 'tt' | 'ru'): string {
  return lang === 'tt' ? word.tt : word.ru
}

function optionsFor(
  word: Word,
  pool: Word[],
  rng: () => number,
  lang: 'tt' | 'ru',
): string[] {
  const answer = valueOf(word, lang)
  const samePos = pool.filter((item) => item.id !== word.id && item.pos === word.pos)
  const others = pool.filter((item) => item.id !== word.id && item.pos !== word.pos)
  const fallback = allWords.filter((item) => item.id !== word.id)
  const seen = new Set([answer])
  const distractors: string[] = []

  for (const candidate of shuffle([...samePos, ...others, ...fallback], rng)) {
    const value = valueOf(candidate, lang)
    if (!value || seen.has(value)) continue
    seen.add(value)
    distractors.push(value)
    if (distractors.length === 3) break
  }

  return shuffle([answer, ...distractors], rng)
}

function makeChoose(
  word: Word,
  pool: Word[],
  rng: () => number,
  index: number,
  suffix: string,
): ChooseExercise {
  const mode = (['tt-ru', 'ru-tt', 'emoji'] as const)[index % 3]
  const optionLang: 'tt' | 'ru' = mode === 'tt-ru' ? 'ru' : 'tt'
  const answer = mode === 'tt-ru' ? word.ru : word.tt
  const prompt = mode === 'ru-tt' ? word.ru : mode === 'tt-ru' ? word.tt : word.emoji
  const sub =
    mode === 'tt-ru'
      ? 'Выбери перевод'
      : mode === 'ru-tt'
        ? 'Выбери слово по-татарски'
        : 'Что это? Выбери слово по-татарски'

  return {
    kind: 'choose',
    id: `${suffix}-choose-${word.id}-${index}`,
    mode,
    prompt,
    promptRu: word.ru,
    sub,
    options: optionsFor(word, pool, rng, optionLang),
    answer,
    answerTt: word.tt,
    answerRu: word.ru,
    optionLang,
    wordId: word.id,
    reinforced: suffix.startsWith('reinforce'),
  }
}

function makeMatch(words: Word[], rng: () => number, suffix: string): MatchExercise | null {
  if (words.length < 3) return null
  const picked = shuffle(words, rng).slice(0, 5)
  return {
    kind: 'match',
    id: `${suffix}-match`,
    pairs: picked.map((word) => ({ wordId: word.id, tt: word.tt, ru: word.ru })),
  }
}

function sentenceWordIds(sentence: Sentence): string[] {
  const unit = getUnit(sentence.unit)
  const lower = sentence.tt.toLowerCase()
  const matches = unit.words
    .filter((word) => {
      const stem = word.tt.toLowerCase().split(' ')[0]
      return stem.length >= 2 && lower.includes(stem)
    })
    .sort((a, b) => b.tt.length - a.tt.length)

  const ids: string[] = []
  for (const word of matches) {
    if (!ids.includes(word.id)) ids.push(word.id)
    if (ids.length === 4) break
  }
  return ids
}

function makeBuild(
  sentence: Sentence,
  rng: () => number,
  suffix: string,
  unitSentences: Sentence[],
): BuildExercise {
  const answer = sentence.tt.split(/\s+/)
  const distractorPool = unitSentences
    .filter((item) => item.id !== sentence.id)
    .flatMap((item) => item.tt.split(/\s+/))
    .filter((token) => !answer.includes(token))
  const distractors = shuffle([...new Set(distractorPool)], rng).slice(0, 2)
  return {
    kind: 'build',
    id: `${suffix}-build-${sentence.id}`,
    sentenceId: sentence.id,
    ru: sentence.ru,
    tokens: shuffle([...answer, ...distractors], rng),
    answer,
    wordIds: sentenceWordIds(sentence),
  }
}

function makeBlank(
  sentence: Sentence,
  rng: () => number,
  suffix: string,
  unitWords: Word[],
): BlankExercise | null {
  const tokens = sentence.tt.split(/\s+/)
  const candidates = tokens
    .map((token, index) => ({ token, index }))
    .filter(({ token, index }) => index > 0 && token.length >= 2 && !/[.,!?;:]/.test(token))
  if (!candidates.length) return null

  const matched = candidates.filter(({ token }) => {
    const clean = token.replace(/[.,!?;:]+$/g, '')
    return unitWords.some(
      (word) => clean === word.tt || (word.tt.length >= 4 && clean.startsWith(word.tt)),
    )
  })
  const pool = matched.length ? matched : candidates
  const picked = pool[Math.floor(rng() * pool.length)]
  const clean = picked.token.replace(/[.,!?;:]+$/g, '')
  const targetWord =
    unitWords.find((word) => word.tt === clean) ??
    unitWords.find((word) => word.tt.length >= 4 && clean.startsWith(word.tt)) ??
    unitWords[0]

  const distractors = shuffle(
    unitWords
      .filter((word) => word.id !== targetWord.id && word.pos === targetWord.pos)
      .map((word) => word.tt),
    rng,
  ).slice(0, 3)

  const options = shuffle([clean, ...distractors.filter((item) => item !== clean)], rng).slice(0, 4)

  return {
    kind: 'blank',
    id: `${suffix}-blank-${sentence.id}-${picked.index}`,
    sentenceId: sentence.id,
    before: tokens.slice(0, picked.index).join(' '),
    after: tokens.slice(picked.index + 1).join(' '),
    ru: sentence.ru,
    options,
    answer: clean,
    wordId: targetWord.id,
  }
}

function makeType(word: Word, suffix: string): TypeExercise {
  return {
    kind: 'type',
    id: `${suffix}-type-${word.id}`,
    ru: word.ru,
    answer: word.tt,
    latin: word.latin,
    emoji: word.emoji,
    wordId: word.id,
  }
}

export function generateLesson(unitId: number, lesson: number, seed = 1): Exercise[] {
  const unit = getUnit(unitId)
  const isCheckpoint = lesson === 0
  const rng = mulberry32(unitId * 10_007 + lesson * 101 + seed)
  const lessonWords = getLessonWords(unitId, lesson)
  const lessonSentences = getLessonSentences(unitId, lesson)
  const words = isCheckpoint ? shuffle(lessonWords, rng).slice(0, 8) : lessonWords
  const sentences = isCheckpoint ? shuffle(lessonSentences, rng).slice(0, 3) : lessonSentences
  const suffix = `u${unitId}-l${lesson}`

  const exercises: Exercise[] = []
  words.forEach((word, index) => {
    exercises.push(makeChoose(word, unit.words, rng, index, suffix))
  })

  const match = makeMatch(words.slice(0, 5), rng, suffix)
  if (match) exercises.push(match)

  sentences.forEach((sentence) => {
    exercises.push(makeBuild(sentence, rng, suffix, unit.sentences))
  })

  sentences.slice(0, isCheckpoint ? 2 : 2).forEach((sentence) => {
    const blank = makeBlank(sentence, rng, suffix, unit.words)
    if (blank) exercises.push(blank)
  })

  shuffle(words, rng)
    .slice(0, isCheckpoint ? 2 : 2)
    .forEach((word) => exercises.push(makeType(word, suffix)))

  const choose = exercises.filter((exercise) => exercise.kind === 'choose')
  const rest = exercises.filter((exercise) => exercise.kind !== 'choose')
  const intro = choose.slice(0, 3)
  const mixed = shuffle([...choose.slice(3), ...rest], rng)
  return [...intro, ...mixed]
}

export function generateReview(wordIds: string[], seed = 1): Exercise[] {
  const rng = mulberry32(seed)
  const words = wordIds.map((id) => wordById.get(id)).filter((word): word is Word => !!word)
  if (!words.length) return []

  const exercises: Exercise[] = []
  words.slice(0, 8).forEach((word, index) => {
    exercises.push(makeChoose(word, allWords, rng, index, `review-${seed}`))
  })

  const typeWords = shuffle(words, rng).slice(0, 2)
  typeWords.forEach((word) => exercises.push(makeType(word, `review-${seed}`)))

  const sentence = allWords
    .filter((word) => words.some((item) => item.id === word.id))
    .map((word) => word.unit)
    .map((unitId) => getUnit(unitId).sentences)
    .flat()
    .find((item) => words.some((word) => item.tt.includes(word.tt.split(' ')[0])))

  if (sentence) {
    exercises.push(makeBuild(sentence, rng, `review-${seed}`, getUnit(sentence.unit).sentences))
    const blank = makeBlank(sentence, rng, `review-${seed}`, getUnit(sentence.unit).words)
    if (blank) exercises.push(blank)
  }

  return shuffle(exercises, rng)
}

function hashString(value: string): number {
  let hash = 7
  for (const char of value) hash = (hash * 31 + char.charCodeAt(0)) >>> 0
  return hash
}

/** Небольшое упражнение на слово, в котором была ошибка. */
export function makeReinforcementExercise(wordId: string, seed = 1): Exercise | null {
  const word = wordById.get(wordId)
  if (!word) return null
  const rng = mulberry32(hashString(wordId) + seed * 997)
  return makeChoose(word, allWords, rng, 1, `reinforce-${wordId}-${seed}`)
}
