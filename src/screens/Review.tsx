import { useMemo, useState } from 'react'
import { motion } from 'motion/react'
import {
  ArrowRight,
  Check,
  ChevronRight,
  CircleAlert,
  Flame,
  Repeat,
  Shuffle,
  Sparkles,
  Target,
} from 'lucide-react'
import clsx from 'clsx'
import { wordById } from '../data/course'
import { generateReview } from '../lib/exercises'
import { masteryLabel, pickReviewWords } from '../lib/srs'
import { totalAccuracy } from '../lib/progress'
import { useActiveProgress, useStore } from '../store/useStore'
import { useUiStore } from '../store/useUiStore'
import { useScript } from '../lib/i18n'
import { toLatin } from '../lib/translit'
import { SessionView } from '../components/SessionView'
import { Mascot } from '../components/Mascot'
import { ProgressRing } from '../components/ProgressRing'
import type { WordStat } from '../store/types'

function strengthBuckets(wordStats: Record<string, WordStat>) {
  const entries = Object.values(wordStats).filter((stat) => stat.seen > 0)
  return {
    learning: entries.filter((stat) => stat.strength <= 2).length,
    good: entries.filter((stat) => stat.strength === 3 || stat.strength === 4).length,
    mastered: entries.filter((stat) => stat.strength >= 5).length,
    total: entries.length,
  }
}

function ReviewSessionView({
  mode,
  seed,
  onSeed,
}: {
  mode: 'due' | 'mistakes'
  seed: number
  onSeed: () => void
}) {
  const session = useUiStore((state) => state.reviewSession)
  const closeReview = useUiStore((state) => state.closeReview)
  const finishReview = useStore((state) => state.finishReview)

  const exercises = useMemo(
    () => (session ? generateReview(session.wordIds, seed + 7) : []),
    [session, seed],
  )

  if (!session) return null

  return (
    <SessionView
      key={`${session.mode}-${seed}`}
      kind="review"
      title={mode === 'mistakes' ? 'Банк ошибок' : 'Кабатлау'}
      subtitle={
        mode === 'mistakes'
          ? 'Слова, в которых ты ошибался, возвращаются чаще.'
          : 'Интервальное повторение: вспомни слово до того, как оно забудется.'
      }
      exercises={exercises}
      onExit={closeReview}
      onRepeat={onSeed}
      onFinish={(summary) =>
        finishReview({
          correct: summary.correct,
          wrong: summary.wrong,
          total: summary.total,
        })
      }
      onContinue={closeReview}
    />
  )
}

export function ReviewScreen() {
  const progress = useActiveProgress()
  const script = useScript()
  const startReview = useUiStore((state) => state.startReview)
  const reviewSession = useUiStore((state) => state.reviewSession)
  const closeReview = useUiStore((state) => state.closeReview)
  const setScreen = useUiStore((state) => state.setScreen)
  const [seed, setSeed] = useState(0)

  const now = Date.now()
  const stats = Object.entries(progress.wordStats).filter(([, stat]) => stat.seen > 0)
  const dueCount = stats.filter(([, stat]) => stat.due <= now).length
  const dueIds = pickReviewWords(progress.wordStats, 12, now)
  const mistakeIds = Object.entries(progress.mistakes)
    .filter(([, count]) => count > 0)
    .sort((a, b) => b[1] - a[1])
    .map(([id]) => id)
  const mistakeCount = mistakeIds.length
  const buckets = strengthBuckets(progress.wordStats)
  const accuracy = totalAccuracy(progress.weekly.correct, progress.weekly.total)
  const dueWords = dueIds
    .map((id) => wordById.get(id))
    .filter((word): word is NonNullable<typeof word> => !!word)
    .slice(0, 6)

  const start = (mode: 'due' | 'mistakes', ids: string[]) => {
    if (!ids.length) return
    setSeed(0)
    startReview(mode, ids.slice(0, 12))
  }

  const startRandom = () => {
    const ids = [...progress.seenWords].sort(() => Math.random() - 0.5).slice(0, 10)
    if (!ids.length) return
    setSeed(0)
    startReview('due', ids)
  }

  if (reviewSession) {
    return (
      <ReviewSessionView
        mode={reviewSession.mode}
        seed={seed}
        onSeed={() => setSeed((value) => value + 1)}
      />
    )
  }

  return (
    <div className="page review-page">
      <motion.section
        className="review-hero card"
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="review-hero-copy">
          <p className="eyebrow">Кабатлау вакыты</p>
          <h1>Повторение — <span className="accent">көч</span></h1>
          <p className="lead">
            Забывание — нормально. Умное повторение возвращает слова в нужный момент, а ошибки
            становятся списком на проработку.
          </p>
          <div className="review-hero-actions">
            <button
              type="button"
              className="btn btn-primary"
              disabled={!dueIds.length}
              onClick={() => start('due', dueIds)}
            >
              <Repeat size={18} />
              {dueCount > 0 ? `Повторить ${Math.min(12, dueIds.length)} слов` : 'Тренировать слабые слова'}
              <ArrowRight size={18} />
            </button>
            <span className="hero-hint">
              К повторению сегодня: <b>{dueCount}</b>
            </span>
          </div>
        </div>
        <div className="review-hero-side">
          <Mascot mood="think" size={150} />
          <ProgressRing value={buckets.total ? buckets.mastered / buckets.total : 0} size={84} stroke={9}>
            <strong>{buckets.mastered}</strong>
            <span>выучено</span>
          </ProgressRing>
        </div>
      </motion.section>

      <section className="review-grid">
        <article className="card review-card">
          <header className="section-head">
            <div>
              <p className="eyebrow">Көнлек</p>
              <h2>Умное повторение</h2>
            </div>
            <span className="badge soft">{dueCount} к повторению</span>
          </header>
          <p className="muted">
            Слова с самым низким уровнем памяти и просроченной датой возвращаются первыми.
            Тренировка займёт около 3–4 минут.
          </p>
          <div className="review-list">
            {dueWords.length ? (
              dueWords.map((word) => {
                const stat = progress.wordStats[word.id]
                return (
                  <div key={word.id} className="review-word">
                    <span className="review-word-emoji">{word.emoji}</span>
                    <span className="review-word-copy">
                      <strong>{script === 'latin' ? word.latin : word.tt}</strong>
                      <small>{word.ru}</small>
                    </span>
                    <span className={clsx('mastery', stat && stat.strength >= 4 && 'high')}>
                      {masteryLabel(stat?.strength ?? 0)}
                    </span>
                  </div>
                )
              })
            ) : (
              <p className="empty-note">Пока нет слов для повторения — начни первый урок.</p>
            )}
          </div>
          <button
            type="button"
            className="btn btn-soft btn-block"
            disabled={!dueIds.length}
            onClick={() => start('due', dueIds)}
          >
            <Target size={17} /> Начать повторение
          </button>
        </article>

        <article className="card review-card">
          <header className="section-head">
            <div>
              <p className="eyebrow">Хаталар</p>
              <h2>Банк ошибок</h2>
            </div>
            <span className={clsx('badge', mistakeCount ? 'danger' : 'soft')}>
              {mistakeCount} слов
            </span>
          </header>
          <p className="muted">
            Каждая ошибка добавляет слово сюда. Правильный ответ постепенно убирает его из банка.
          </p>
          <div className="review-list">
            {mistakeIds.slice(0, 6).map((id) => {
              const word = wordById.get(id)
              if (!word) return null
              return (
                <div key={id} className="review-word">
                  <span className="review-word-emoji">{word.emoji}</span>
                  <span className="review-word-copy">
                    <strong>{script === 'latin' ? word.latin : word.tt}</strong>
                    <small>{word.ru}</small>
                  </span>
                  <span className="mistake-count">×{progress.mistakes[id]}</span>
                </div>
              )
            })}
            {!mistakeIds.length && (
              <p className="empty-note">
                <Check size={16} /> Ошибок нет. Так держать!
              </p>
            )}
          </div>
          <button
            type="button"
            className="btn btn-soft btn-block"
            disabled={!mistakeIds.length}
            onClick={() => start('mistakes', mistakeIds)}
          >
            <CircleAlert size={17} /> Проработать ошибки
          </button>
        </article>
      </section>

      <section className="card review-summary">
        <header className="section-head">
          <div>
            <p className="eyebrow">Хәтер</p>
            <h2>Состояние словаря</h2>
          </div>
          <span className="section-note">төгәллек {accuracy}%</span>
        </header>
        <div className="memory-bar" aria-hidden="true">
          <span className="memory-learning" style={{ width: `${buckets.total ? (buckets.learning / buckets.total) * 100 : 0}%` }} />
          <span className="memory-good" style={{ width: `${buckets.total ? (buckets.good / buckets.total) * 100 : 0}%` }} />
          <span className="memory-mastered" style={{ width: `${buckets.total ? (buckets.mastered / buckets.total) * 100 : 0}%` }} />
        </div>
        <div className="memory-legend">
          <span><i className="dot learning" /> В процессе <b>{buckets.learning}</b></span>
          <span><i className="dot good" /> Хорошо <b>{buckets.good}</b></span>
          <span><i className="dot mastered" /> Выучено <b>{buckets.mastered}</b></span>
        </div>
        <div className="review-extra">
          <button
            type="button"
            className="btn btn-ghost"
            disabled={!progress.seenWords.length}
            onClick={startRandom}
          >
            <Shuffle size={16} /> Случайные 10 слов
          </button>
          <button type="button" className="btn btn-ghost" onClick={() => setScreen('dictionary')}>
            <Sparkles size={16} /> Открыть словарь
          </button>
          <span className="review-streak">
            <Flame size={16} /> серия {progress.streak} көн
          </span>
        </div>
      </section>

      <button type="button" className="link-row" onClick={() => setScreen('learn')}>
        Вернуться к урокам <ChevronRight size={16} />
      </button>

      {reviewSession && (
        <button
          type="button"
          className="link-row"
          onClick={() => {
            closeReview()
          }}
        >
          Закрыть сессию
        </button>
      )}
    </div>
  )
}
