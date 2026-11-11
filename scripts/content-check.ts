import { allSentences, allWords, courseStats, units } from '../src/data/course'

const errors: string[] = []
const warnings: string[] = []

const cyrillicOnly = /^[А-Яа-яЁёӘәӨөҮүҖҗҢңҺһ\s-]+$/
const latinOnly = /^[a-zäöüçñışğ\s-]+$/
const hasLatin = /[A-Za-z]/
const hasCyrillic = /[А-Яа-яЁёӘәӨөҮүҖҗҢңҺһ]/

function fail(message: string): void {
  errors.push(message)
}

function warn(message: string): void {
  warnings.push(message)
}

if (units.length !== 12) fail(`Юнитов ${units.length}, ожидалось 12`)
if (allWords.length !== 300) fail(`Слов ${allWords.length}, ожидалось 300`)
if (allSentences.length !== 96) fail(`Предложений ${allSentences.length}, ожидалось 96`)
if (courseStats.lessons !== 60) fail(`Уроков ${courseStats.lessons}, ожидалось 60`)

const wordIds = new Set<string>()
const sentenceIds = new Set<string>()
const ttSeen = new Map<string, string>()
const latinSeen = new Map<string, string>()

for (const unit of units) {
  if (unit.words.length !== 25) {
    fail(`Юнит ${unit.id}: ${unit.words.length} слов вместо 25`)
  }
  if (unit.sentences.length !== 8) {
    fail(`Юнит ${unit.id}: ${unit.sentences.length} предложений вместо 8`)
  }
  if (!unit.grammar.length) {
    fail(`Юнит ${unit.id}: нет грамматических карточек`)
  }
  if (!unit.titleTt.trim() || !unit.titleRu.trim()) {
    fail(`Юнит ${unit.id}: пустой заголовок`)
  }

  const lessonWords = new Map<number, number>()
  for (const word of unit.words) {
    if (word.unit !== unit.id) fail(`${word.id}: unit=${word.unit} не совпадает с ${unit.id}`)
    if (word.lesson < 1 || word.lesson > 4) fail(`${word.id}: урок ${word.lesson} вне 1..4`)
    lessonWords.set(word.lesson, (lessonWords.get(word.lesson) ?? 0) + 1)

    if (wordIds.has(word.id)) fail(`Дублирующийся id слова: ${word.id}`)
    wordIds.add(word.id)

    if (!word.tt.trim()) fail(`${word.id}: пустое татарское слово`)
    if (!word.latin.trim()) fail(`${word.id}: пустая латиница`)
    if (!word.ru.trim()) fail(`${word.id}: пустой перевод`)
    if (!word.emoji.trim()) fail(`${word.id}: нет эмодзи`)

    if (!cyrillicOnly.test(word.tt)) {
      fail(`${word.id}: в «${word.tt}» недопустимые символы`)
    }
    if (!latinOnly.test(word.latin)) {
      fail(`${word.id}: латиница «${word.latin}» содержит недопустимые символы`)
    }
    if (hasLatin.test(word.tt)) fail(`${word.id}: латиница внутри кириллицы «${word.tt}»`)
    if (hasCyrillic.test(word.latin)) fail(`${word.id}: кириллица внутри латиницы «${word.latin}»`)

    const normalizedTt = word.tt.toLowerCase()
    if (ttSeen.has(normalizedTt)) {
      fail(`Дублирующееся слово «${word.tt}»: ${ttSeen.get(normalizedTt)} и ${word.id}`)
    } else {
      ttSeen.set(normalizedTt, word.id)
    }

    const normalizedLatin = word.latin.toLowerCase()
    if (latinSeen.has(normalizedLatin)) {
      fail(`Дублирующаяся латиница «${word.latin}»: ${latinSeen.get(normalizedLatin)} и ${word.id}`)
    } else {
      latinSeen.set(normalizedLatin, word.id)
    }

    if (word.confidence !== 'high' && word.confidence !== 'medium') {
      fail(`${word.id}: неверный уровень уверенности ${word.confidence}`)
    }
    if (word.confidence === 'medium' && !word.note) {
      warn(`${word.id}: помечено medium без пояснения`)
    }
    if (word.tt.trim() !== word.tt) warn(`${word.id}: лишние пробелы в татарском слове`)
  }

  const lessonSentenceCounts = new Map<number, number>()
  for (const sentence of unit.sentences) {
    if (sentence.unit !== unit.id) fail(`${sentence.id}: unit не совпадает`)
    if (sentence.lesson < 1 || sentence.lesson > 4) {
      fail(`${sentence.id}: урок ${sentence.lesson} вне 1..4`)
    }
    lessonSentenceCounts.set(
      sentence.lesson,
      (lessonSentenceCounts.get(sentence.lesson) ?? 0) + 1,
    )
    if (sentenceIds.has(sentence.id)) fail(`Дублирующийся id предложения: ${sentence.id}`)
    sentenceIds.add(sentence.id)
    if (!sentence.tt.trim() || !sentence.ru.trim()) {
      fail(`${sentence.id}: пустая фраза или перевод`)
    }
    if (hasLatin.test(sentence.tt)) {
      fail(`${sentence.id}: латиница в татарском предложении «${sentence.tt}»`)
    }
    if (!/[.!?…]$/.test(sentence.tt.trim())) {
      warn(`${sentence.id}: предложение без конечной пунктуации «${sentence.tt}»`)
    }
  }

  for (const lesson of [1, 2, 3, 4]) {
    if ((lessonSentenceCounts.get(lesson) ?? 0) !== 2) {
      fail(
        `Юнит ${unit.id}, урок ${lesson}: ${lessonSentenceCounts.get(lesson) ?? 0} фраз вместо 2`,
      )
    }
    if (!lessonWords.get(lesson)) {
      fail(`Юнит ${unit.id}, урок ${lesson}: нет слов`)
    }
  }

  for (const grammar of unit.grammar) {
    if (!grammar.title.trim() || !grammar.body.trim()) {
      fail(`Юнит ${unit.id}: неполная грамматическая карточка`)
    }
    if (!grammar.examples.length) {
      warn(`Юнит ${unit.id}: грамматика «${grammar.title}» без примеров`)
    }
    for (const example of grammar.examples) {
      if (!example.tt.trim() || !example.ru.trim()) {
        fail(`Юнит ${unit.id}: пустой пример в «${grammar.title}»`)
      }
    }
  }
}

// Проверяем, что у каждого слова есть пример в предложениях своего юнита.
const wordsWithoutExample: string[] = []
for (const word of allWords) {
  const unit = units.find((item) => item.id === word.unit)
  if (!unit) continue
  const stem = word.tt.toLowerCase().split(' ')[0]
  const found = unit.sentences.some((sentence) =>
    sentence.tt.toLowerCase().includes(stem),
  )
  if (!found) wordsWithoutExample.push(`${word.id} (${word.tt})`)
}

const mediumWords = allWords.filter((word) => word.confidence === 'medium')
const lessonDistribution = units.map((unit) => {
  const counts = [1, 2, 3, 4].map(
    (lesson) => unit.words.filter((word) => word.lesson === lesson).length,
  )
  return {
    Юнит: unit.id,
    Название: unit.titleTt,
    Слова: unit.words.length,
    Фразы: unit.sentences.length,
    '1': counts[0],
    '2': counts[1],
    '3': counts[2],
    '4': counts[3],
  }
})

console.log('\nСүз · проверка контента\n')
console.table(lessonDistribution)
console.log(
  `Всего: ${allWords.length} слов, ${allSentences.length} фраз, ${units.length} юнитов, ${courseStats.lessons} уроков.`,
)
console.log(
  `Примеров в предложениях не найдено: ${wordsWithoutExample.length} слов (это нормально для служебных и редких слов).`,
)
if (wordsWithoutExample.length) {
  console.log(`  ${wordsWithoutExample.slice(0, 20).join(', ')}${wordsWithoutExample.length > 20 ? '…' : ''}`)
}

if (mediumWords.length) {
  console.log(`\nНа проверку носителем (${mediumWords.length}):`)
  for (const word of mediumWords) {
    console.log(`  ${word.id}  ${word.tt} (${word.latin}) — ${word.ru}${word.note ? ` · ${word.note}` : ''}`)
  }
}

if (warnings.length) {
  console.log(`\nПредупреждения (${warnings.length}):`)
  for (const message of warnings) console.log(`  ⚠ ${message}`)
}

if (errors.length) {
  console.error(`\nОшибки (${errors.length}):`)
  for (const message of errors) console.error(`  ✖ ${message}`)
  process.exit(1)
}

console.log('\n✓ Контент прошёл проверку.\n')
