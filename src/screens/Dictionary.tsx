import { useMemo, useState } from 'react'
import { motion } from 'motion/react'
import {
  BookOpen,
  Check,
  ChevronRight,
  CircleAlert,
  Lock,
  Search,
  Sparkles,
  Volume2,
  X,
} from 'lucide-react'
import clsx from 'clsx'
import { allWords, findExampleForWord, getUnit } from '../data/course'
import type { Word } from '../data/types'
import { useActiveProgress } from '../store/useStore'
import { useUiStore } from '../store/useUiStore'
import { useScript } from '../lib/i18n'
import { masteryLabel } from '../lib/srs'
import { toLatin } from '../lib/translit'
import { Sheet } from '../components/Sheet'

type Filter = 'all' | 'learning' | 'mistakes' | 'mastered'

const filters: Array<{ id: Filter; label: string }> = [
  { id: 'all', label: 'Все' },
  { id: 'learning', label: 'Изучаю' },
  { id: 'mistakes', label: 'Ошибки' },
  { id: 'mastered', label: 'Выучено' },
]

const posLabels: Record<Word['pos'], string> = {
  noun: 'существительное',
  verb: 'глагол',
  adj: 'прилагательное',
  num: 'числительное',
  pron: 'местоимение',
  phrase: 'фраза',
  adv: 'наречие',
  interj: 'междометие',
}

export function DictionaryScreen() {
  const progress = useActiveProgress()
  const script = useScript()
  const startReview = useUiStore((state) => state.startReview)
  const setScreen = useUiStore((state) => state.setScreen)
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<Filter>('all')
  const [detail, setDetail] = useState<Word | null>(null)

  const seen = new Set(progress.seenWords)
  const mastered = progress.seenWords.filter((id) => (progress.wordStats[id]?.strength ?? 0) >= 4).length
  const mistakeCount = Object.keys(progress.mistakes).length

  const words = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    return allWords.filter((word) => {
      if (filter === 'learning') {
        if (!seen.has(word.id)) return false
        if ((progress.wordStats[word.id]?.strength ?? 0) >= 4) return false
      }
      if (filter === 'mistakes' && !(progress.mistakes[word.id] > 0)) return false
      if (filter === 'mastered' && (progress.wordStats[word.id]?.strength ?? 0) < 4) return false
      if (!normalized) return true
      return (
        word.tt.toLowerCase().includes(normalized) ||
        word.latin.toLowerCase().includes(normalized) ||
        word.ru.toLowerCase().includes(normalized) ||
        word.emoji.includes(normalized)
      )
    })
  }, [query, filter, seen, progress.wordStats, progress.mistakes])

  const trainWord = (word: Word) => {
    startReview('due', [word.id])
    setScreen('review')
    setDetail(null)
  }

  return (
    <div className="page dictionary-page">
      <motion.section className="dictionary-hero card" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}>
        <div>
          <p className="eyebrow">Сүзлек</p>
          <h1>Твой словарь</h1>
          <p className="lead">
            300 слов курса с переводом, латиницей и примерами. Изученные слова отмечаются
            автоматически.
          </p>
        </div>
        <div className="dictionary-stats">
          <div>
            <strong>{progress.seenWords.length}</strong>
            <span>из {allWords.length}</span>
          </div>
          <div>
            <strong>{mastered}</strong>
            <span>выучено</span>
          </div>
          <div>
            <strong>{mistakeCount}</strong>
            <span>в ошибках</span>
          </div>
        </div>
      </motion.section>

      <div className="dictionary-toolbar card">
        <label className="search-box">
          <Search size={18} />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Слово по-татарски, по-русски или латиницей…"
            aria-label="Поиск по словарю"
          />
          {query && (
            <button type="button" className="icon-btn subtle" onClick={() => setQuery('')} aria-label="Очистить поиск">
              <X size={15} />
            </button>
          )}
        </label>
        <div className="filter-row" role="tablist" aria-label="Фильтр словаря">
          {filters.map((item) => (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={filter === item.id}
              className={clsx('filter-chip', filter === item.id && 'active')}
              onClick={() => setFilter(item.id)}
            >
              {item.label}
              {item.id === 'mistakes' && mistakeCount > 0 && <span>{mistakeCount}</span>}
            </button>
          ))}
        </div>
      </div>

      <div className="dictionary-count">
        <span>Найдено: {words.length}</span>
        <span className="muted">Кириллица + Zamanälif</span>
      </div>

      <div className="word-list">
        {words.map((word) => {
          const stat = progress.wordStats[word.id]
          const learned = seen.has(word.id)
          return (
            <button
              key={word.id}
              type="button"
              className={clsx('word-row card', learned && 'learned', !learned && 'unseen')}
              onClick={() => setDetail(word)}
            >
              <span className="word-emoji">{word.emoji}</span>
              <span className="word-main">
                <span className="word-tt">
                  {script === 'latin' ? word.latin : word.tt}
                  {word.confidence === 'medium' && <span className="word-flag" title="Проверяется носителем">≈</span>}
                </span>
                <span className="word-secondary">
                  {script === 'latin' ? word.tt : word.latin}
                </span>
              </span>
              <span className="word-ru">{word.ru}</span>
              <span className={clsx('word-status', stat && stat.strength >= 4 && 'high')}>
                {learned ? masteryLabel(stat?.strength ?? 0) : 'Новое'}
                {!learned && <Lock size={12} />}
              </span>
              <ChevronRight size={16} className="word-chevron" />
            </button>
          )
        })}
      </div>

      {!words.length && (
        <div className="empty-state card">
          <span className="empty-emoji">🔍</span>
          <h2>Ничего не нашлось</h2>
          <p className="muted">
            {filter === 'mistakes'
              ? 'В банке ошибок пока пусто — это хорошо.'
              : 'Попробуй другое написание или сбрось фильтр.'}
          </p>
          <button
            type="button"
            className="btn btn-soft"
            onClick={() => {
              setQuery('')
              setFilter('all')
            }}
          >
            Показать все слова
          </button>
        </div>
      )}

      <Sheet
        open={!!detail}
        onClose={() => setDetail(null)}
        title={detail ? (script === 'latin' ? detail.latin : detail.tt) : undefined}
      >
        {detail && (
          <div className="word-detail">
            <div className="word-detail-head">
              <span className="word-detail-emoji">{detail.emoji}</span>
              <div>
                <h3>{script === 'latin' ? detail.latin : detail.tt}</h3>
                <p>{script === 'latin' ? detail.tt : detail.latin}</p>
                <span className="word-ru-big">{detail.ru}</span>
              </div>
            </div>

            <div className="chips-row">
              <span className="mini-chip">{posLabels[detail.pos]}</span>
              <span className="mini-chip">Юнит {detail.unit}</span>
              <span className="mini-chip">Урок {detail.lesson}</span>
              {detail.confidence === 'medium' && (
                <span className="mini-chip warning">на проверке у носителя</span>
              )}
            </div>

            <div className="mastery-block">
              <div className="mastery-head">
                <span>Уровень памяти</span>
                <strong>{masteryLabel(progress.wordStats[detail.id]?.strength ?? 0)}</strong>
              </div>
              <div className="mastery-track">
                {[1, 2, 3, 4, 5].map((level) => (
                  <span
                    key={level}
                    className={clsx(
                      (progress.wordStats[detail.id]?.strength ?? 0) >= level && 'filled',
                    )}
                  />
                ))}
              </div>
              <div className="word-detail-stats">
                <span>Повторений: <b>{progress.wordStats[detail.id]?.seen ?? 0}</b></span>
                <span>Верно: <b>{progress.wordStats[detail.id]?.correct ?? 0}</b></span>
                <span>Ошибок: <b>{progress.wordStats[detail.id]?.wrong ?? 0}</b></span>
              </div>
            </div>

            {(() => {
              const example = findExampleForWord(detail)
              if (!example) return null
              return (
                <div className="example-card">
                  <p className="eyebrow">Мисал</p>
                  <p className="example-tt">{example.tt}</p>
                  <p className="example-ru">{example.ru}</p>
                </div>
              )
            })()}

            {detail.note && (
              <p className="word-note">
                <CircleAlert size={15} /> {detail.note}
              </p>
            )}

            <div className="word-detail-actions">
              <button type="button" className="btn btn-primary" onClick={() => trainWord(detail)}>
                <Sparkles size={16} /> Тренировать слово
              </button>
              <button type="button" className="btn btn-ghost" disabled title="Нейросетевое аудио появится позже">
                <Volume2 size={16} /> Аудио скоро
              </button>
            </div>

            <p className="fine-print">
              <BookOpen size={14} /> Латиница хранится для каждого слова отдельно — это надёжнее
              автоматической транслитерации.
            </p>
          </div>
        )}
      </Sheet>
    </div>
  )
}
