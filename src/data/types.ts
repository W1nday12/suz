export type Pos = 'noun' | 'verb' | 'adj' | 'num' | 'pron' | 'phrase' | 'adv' | 'interj'

export type Confidence = 'high' | 'medium'

export interface Word {
  id: string
  tt: string
  latin: string
  ru: string
  pos: Pos
  unit: number
  lesson: number
  emoji: string
  confidence: Confidence
  note?: string
}

export interface Sentence {
  id: string
  tt: string
  ru: string
  unit: number
  lesson: number
}

export interface GrammarExample {
  tt: string
  ru: string
}

export interface GrammarCard {
  title: string
  body: string
  examples: GrammarExample[]
}

export interface Unit {
  id: number
  titleTt: string
  titleRu: string
  subtitle: string
  color: string
  words: Word[]
  sentences: Sentence[]
  grammar: GrammarCard[]
}

export type WordSeed = [
  tt: string,
  latin: string,
  ru: string,
  pos: Pos,
  emoji: string,
  confidence?: Confidence,
  note?: string,
]

export type SentenceSeed = [tt: string, ru: string]

export interface UnitSeed {
  id: number
  titleTt: string
  titleRu: string
  subtitle: string
  color: string
  words: WordSeed[]
  sentences: SentenceSeed[]
  grammar: GrammarCard[]
}
