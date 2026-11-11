const frontVowels = new Set(['ә', 'е', 'ө', 'ү', 'и', 'э', 'ю', 'я'])
const backVowels = new Set(['а', 'о', 'у', 'ы'])
const vowels = new Set([...frontVowels, ...backVowels])

function isFrontWord(word: string): boolean {
  const lower = word.toLowerCase()
  for (let i = lower.length - 1; i >= 0; i -= 1) {
    const char = lower[i]
    if (frontVowels.has(char)) return true
    if (backVowels.has(char)) return false
  }
  return true
}

const simple: Record<string, string> = {
  а: 'a',
  ә: 'ä',
  б: 'b',
  д: 'd',
  ж: 'j',
  җ: 'c',
  з: 'z',
  и: 'i',
  й: 'y',
  л: 'l',
  м: 'm',
  н: 'n',
  ң: 'ñ',
  о: 'o',
  ө: 'ö',
  п: 'p',
  р: 'r',
  с: 's',
  т: 't',
  у: 'u',
  ү: 'ü',
  ф: 'f',
  х: 'x',
  һ: 'h',
  ц: 'ts',
  ч: 'ç',
  ш: 'ş',
  щ: 'şç',
  ъ: '',
  ы: 'ı',
  ь: '',
  э: 'e',
}

function transliterateWord(word: string): string {
  const lower = word.toLowerCase()
  const front = isFrontWord(lower)
  let result = ''

  for (let i = 0; i < lower.length; i += 1) {
    const char = lower[i]
    const previous = i > 0 ? lower[i - 1] : ''
    const next = i + 1 < lower.length ? lower[i + 1] : ''

    if (char === 'г') {
      result += next === 'ъ' || next === 'ь' ? 'ğ' : front ? 'g' : 'ğ'
      continue
    }
    if (char === 'к') {
      result += front ? 'k' : 'q'
      continue
    }
    if (char === 'в') {
      result += 'w'
      continue
    }
    if (char === 'е') {
      result += i === 0 || vowels.has(previous) || 'ьъй'.includes(previous) ? 'ye' : 'e'
      continue
    }
    if (char === 'ё') {
      result += 'yo'
      continue
    }
    if (char === 'ю') {
      result += i === 0 || vowels.has(previous) ? 'yu' : 'ü'
      continue
    }
    if (char === 'я') {
      result += i === 0 || vowels.has(previous) ? 'ya' : 'ä'
      continue
    }

    result += simple[char] ?? char
  }

  const first = word[0]
  if (first && first === first.toUpperCase() && first !== first.toLowerCase()) {
    return result.charAt(0).toUpperCase() + result.slice(1)
  }
  return result
}

const cyrillicWord = /[А-Яа-яӘәӨөҮүҖҗҢңҺһЁё]+/g

export function toLatin(text: string): string {
  return text.replace(cyrillicWord, (word) => transliterateWord(word))
}

export function normalizeTyped(value: string): string {
  return value
    .toLowerCase()
    .replace(/[.,!?;:«»"'’]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

export function checkTyped(input: string, tt: string, latin: string): boolean {
  const value = normalizeTyped(input)
  return value === normalizeTyped(tt) || value === normalizeTyped(latin)
}

export const tatarKeyboard = ['ә', 'ө', 'ү', 'җ', 'ң', 'һ', 'ы', 'э', 'ю', 'я']
export const latinKeyboard = ['ä', 'ö', 'ü', 'ç', 'ñ', 'ı', 'ş', 'ğ', 'q', 'ə']
