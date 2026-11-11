import { mkdirSync, writeFileSync } from 'node:fs'
import { allSentences, allWords, units } from '../src/data/course'

const OUT_DIR = 'content-export'

const csvCell = (value: string): string => `"${value.replace(/"/g, '""')}"`

function toCsv(header: string[], rows: string[][]): string {
  const lines = [header, ...rows].map((row) => row.map(csvCell).join(','))
  return `${lines.join('\r\n')}\r\n`
}

mkdirSync(OUT_DIR, { recursive: true })

const wordHeader = ['id', 'tt', 'latin', 'ru', 'pos', 'unit', 'lesson', 'emoji', 'confidence', 'note']
const wordRows = allWords.map((word) => [
  word.id,
  word.tt,
  word.latin,
  word.ru,
  word.pos,
  String(word.unit),
  String(word.lesson),
  word.emoji,
  word.confidence,
  word.note ?? '',
])
writeFileSync(`${OUT_DIR}/words.csv`, toCsv(wordHeader, wordRows))

const sentenceHeader = ['id', 'tt', 'ru', 'unit', 'lesson']
const sentenceRows = allSentences.map((sentence) => [
  sentence.id,
  sentence.tt,
  sentence.ru,
  String(sentence.unit),
  String(sentence.lesson),
])
writeFileSync(`${OUT_DIR}/sentences.csv`, toCsv(sentenceHeader, sentenceRows))

const mediumWords = allWords.filter((word) => word.confidence === 'medium')
const grammarCards = units.flatMap((unit) =>
  unit.grammar.map((grammar) => ({ unit: unit.id, title: grammar.title, body: grammar.body, examples: grammar.examples })),
)

const htmlTable = (head: string[], body: string[][]) => `
<table border="1" cellpadding="6" cellspacing="0">
  <thead><tr>${head.map((cell) => `<th>${cell}</th>`).join('')}</tr></thead>
  <tbody>
    ${body.map((row) => `<tr>${row.map((cell) => `<td>${cell}</td>`).join('')}</tr>`).join('')}
  </tbody>
</table>`

const wordTable = htmlTable(
  wordHeader,
  wordRows.map((row) => row.map((cell) => cell.replace(/"/g, '&quot;'))),
)

const sentenceTable = htmlTable(
  sentenceHeader,
  sentenceRows.map((row) => row.map((cell) => cell.replace(/"/g, '&quot;'))),
)

const mediumTable = htmlTable(
  ['id', 'tt', 'latin', 'ru', 'note'],
  mediumWords.map((word) => [word.id, word.tt, word.latin, word.ru, word.note ?? '']),
)

const html = `<!doctype html>
<html lang="ru">
<head>
<meta charset="utf-8">
<title>Сүз — контент для носителя</title>
<style>
  body { font-family: system-ui, sans-serif; background: #fbf6ea; color: #222; margin: 24px; }
  h1 { font-size: 22px; } h2 { font-size: 17px; margin-top: 32px; }
  table { border-collapse: collapse; width: 100%; background: #fff; }
  th, td { border: 1px solid #999; padding: 6px; text-align: left; vertical-align: top; font-size: 14px; }
  th { background: #0e6b4f; color: #fff; }
  code { background: #eee; padding: 1px 4px; border-radius: 4px; }
</style>
</head>
<body>
<h1>Сүз — контент для носителя языка</h1>
<p>Экспорт контента: ${allWords.length} слов, ${allSentences.length} фраз, ${units.length} юнитов, ${allSentences.length} грамматических карточек проверено.</p>

<h2>Слова</h2>
${wordTable}

<h2>Предложения</h2>
${sentenceTable}

<h2>Слова уровня medium — проверить носителю</h2>
${mediumTable}

<h2>Грамматика</h2>
${htmlTable(
  ['unit', 'title', 'body'],
  grammarCards.map((card) => [String(card.unit), card.title, card.body]),
)}

<h2>CSV</h2>
<p>Слова: content-export/words.csv</p>
<p>Предложения: content-export/sentences.csv</p>
</body>
</html>`

writeFileSync(`${OUT_DIR}/suz-content.html`, html)

console.log(`Контент экспортирован в ${OUT_DIR}`)
console.log(`  words.csv — ${allWords.length} строк`)
console.log(`  sentences.csv — ${allSentences.length} строк`)
console.log(`  suz-content.html — HTML для носителя`)
